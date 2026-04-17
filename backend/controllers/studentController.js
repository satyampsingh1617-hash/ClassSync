const XLSX = require("xlsx");
const Student = require("../models/Student");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

// ─────────────────────────────────────────────────────────────
// Helper: create Student + User atomically
// ─────────────────────────────────────────────────────────────
const createStudentWithAccount = async ({ name, roll, studentClass, email, phone, password, createdByRole }) => {
  // 0. Guard required fields
  if (!name || !name.trim()) throw { code: "MISSING_FIELD", message: "Student name is required." };
  if (/\d/.test(name)) throw { code: "INVALID_NAME", message: "Name cannot contain numbers." };
  if (!roll || !roll.trim()) throw { code: "MISSING_FIELD", message: "Roll number is required." };
  if (!studentClass || !studentClass.trim()) throw { code: "MISSING_FIELD", message: "Class is required. Please select a class before uploading." };

  // 1. Check duplicate roll
  const existingRoll = await Student.findOne({ roll: roll.trim() });
  if (existingRoll) throw { code: "DUPLICATE_ROLL", message: `Roll number '${roll}' already exists.` };

  // 2. Determine username = roll (lowercase)
  const username = roll.trim().toLowerCase();

  // 3. Check duplicate username
  const existingUser = await User.findOne({ username });
  if (existingUser) throw { code: "DUPLICATE_USERNAME", message: `Username '${username}' already exists.` };

  // 4. Determine password
  //    - Teacher-created: password = roll number (auto)
  //    - Admin-created: use provided password, fallback to roll
  const finalPassword = password && createdByRole === "admin" ? password : roll.trim();

  // 5. Create User account
  const user = await User.create({
    username,
    password: finalPassword,
    role: "student",
    name: name.trim(),
  });

  // 6. Create Student profile
  const student = await Student.create({
    name: name.trim(),
    roll: roll.trim(),
    class: studentClass.trim(),
    email: email || "",
    phone: phone || "",
    userId: user._id,
  });

  // 7. Link back — use updateOne to avoid re-triggering the bcrypt pre-save hook
  await User.updateOne({ _id: user._id }, { $set: { studentRef: student._id } });

  return { student, user };
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/students
// @desc    Admin creates a student (manual, custom password allowed)
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
const createStudent = async (req, res) => {
  try {
    const { name, roll, studentClass, email, phone, password } = req.body;

    const { student } = await createStudentWithAccount({
      name, roll, studentClass, email, phone, password,
      createdByRole: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully.",
      student,
    });
  } catch (err) {
    console.error("createStudent error:", err);
    if (err.code === "DUPLICATE_ROLL" || err.code === "DUPLICATE_USERNAME" || err.code === "MISSING_FIELD") {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Roll number or username already exists." });
    }
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/students/teacher-create
// @desc    Teacher creates a single student (password = roll auto)
// @access  Private/Teacher
// ─────────────────────────────────────────────────────────────
const createStudentByTeacher = async (req, res) => {
  try {
    const { name, roll, studentClass, email, phone } = req.body;

    const { student } = await createStudentWithAccount({
      name, roll, studentClass, email, phone,
      createdByRole: "teacher",
    });

    return res.status(201).json({
      success: true,
      message: `Student created. Login: username=${roll.toLowerCase()}, password=${roll}`,
      student,
    });
  } catch (err) {
    console.error("createStudentByTeacher error:", err);
    if (err.code === "DUPLICATE_ROLL" || err.code === "DUPLICATE_USERNAME" || err.code === "MISSING_FIELD") {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Roll number already exists." });
    }
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/students/bulk-upload
// @desc    Teacher uploads Excel file to create multiple students
// @access  Private/Teacher
// ─────────────────────────────────────────────────────────────
const bulkUploadStudents = async (req, res) => {
  try {
    // 1. File presence check
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded. Please attach an Excel file." });
    }

    // 2. Extension check
    const filename = req.file.originalname.toLowerCase();
    const isCsv  = filename.endsWith(".csv");
    const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".xls");
    if (!isCsv && !isExcel) {
      return res.status(400).json({ success: false, message: "Only .xlsx, .xls, or .csv files are allowed." });
    }

    // 3. Parse into rows
    let rawRows = [];
    try {
      if (isCsv) {
        // Parse CSV via XLSX (it handles CSV natively)
        const workbook = XLSX.read(req.file.buffer, { type: "buffer", raw: false });
        const sheetName = workbook.SheetNames[0];
        rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      } else {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return res.status(400).json({ success: false, message: "The Excel file has no sheets." });
        }
        rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: "Could not read the file. Make sure it is a valid .xlsx, .xls, or .csv file." });
    }

    // 4. Validate row count
    if (!rawRows.length) {
      return res.status(400).json({ success: false, message: "The uploaded file contains no student records." });
    }

    // 5. Validate required columns (case-insensitive)
    const firstRow = rawRows[0];
    const headers = Object.keys(firstRow).map(h => h.trim().toLowerCase());
    console.log("[bulk-upload] detected headers:", headers);

    const hasRoll = headers.some(h => ["roll number", "roll", "rollnumber", "roll no", "rollno"].includes(h));
    const hasName = headers.some(h => ["name", "student name", "full name"].includes(h));

    const missing = [];
    if (!hasRoll) missing.push("Roll Number");
    if (!hasName) missing.push("Name");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missing.join(", ")}. The file must have 'Roll Number' and 'Name' columns.`,
      });
    }

    // 6. Helper to extract data regardless of exact header casing
    // Forces string output and strips any trailing .0 from numeric cells
    const getField = (row, ...keys) => {
      for (const key of keys) {
        const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
          let val = String(row[found]).trim();
          // Remove trailing .0 that XLSX adds to integer cells (e.g. 2523001.0 → 2523001)
          if (/^\d+\.0$/.test(val)) val = val.slice(0, -2);
          return val;
        }
      }
      return "";
    };

    // Log parsed headers for debugging
    console.log("[bulk-upload] headers:", Object.keys(rawRows[0]).map(h => `"${h}"`).join(", "));
    console.log("[bulk-upload] first row:", JSON.stringify(rawRows[0]));
    console.log("[bulk-upload] defaultClass — req.defaultClass:", req.defaultClass, "| body:", req.body?.defaultClass, "| query:", req.query?.defaultClass);

    // 7. Process rows
    const created = [];
    const skipped = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2;

      try {
        const roll = getField(row, "roll number", "roll no", "roll", "rollnumber", "rollno");
        const name = getField(row, "name", "student name", "full name");
        const studentClass = getField(row, "class", "class name", "classname") 
          || req.defaultClass
          || req.body?.defaultClass 
          || req.query?.defaultClass 
          || "";
        const email = getField(row, "email", "mail", "email id");
        const phone = getField(row, "phone", "mobile", "mobile number", "phone number", "contact", "ph no", "ph");

        if (!roll || !name) {
          skipped.push({ row: rowNum, roll: roll || "—", name: name || "—", reason: "Missing Roll Number or Name" });
          continue;
        }

        if (!studentClass) {
          skipped.push({ row: rowNum, roll, name, reason: "No class assigned — select a class in Step 1" });
          continue;
        }

        const { student } = await createStudentWithAccount({
          name, roll, studentClass, email, phone,
          createdByRole: "teacher",
        });
        created.push({ roll, name, studentId: student._id });
      } catch (err) {
        const rowRoll = getField(row, "roll number", "roll no", "roll", "rollnumber", "rollno") || "Unknown";
        const rowName = getField(row, "name", "student name", "full name") || "Unknown";

        if (err.code === "DUPLICATE_ROLL" || err.code === "DUPLICATE_USERNAME" || err.code === 11000) {
          skipped.push({ row: rowNum, roll: rowRoll, name: rowName, reason: `Duplicate roll number '${rowRoll}'` });
        } else if (err.code === "MISSING_FIELD") {
          skipped.push({ row: rowNum, roll: rowRoll, name: rowName, reason: err.message });
        } else {
          console.error(`Row ${rowNum} error:`, err.message);
          skipped.push({ row: rowNum, roll: rowRoll, name: rowName, reason: err.message || "Unknown error" });
        }
      }
    }

    // 8. Response
    const statusCode = created.length === 0 ? 207 : 201;
    return res.status(statusCode).json({
      success: created.length > 0,
      message: `Processed ${rawRows.length} rows: ${created.length} created, ${skipped.length} skipped.`,
      summary: {
        total:   rawRows.length,
        created: created.length,
        skipped: skipped.length,
      },
      created,
      errors: skipped,
    });
  } catch (err) {
    console.error("bulkUploadStudents error:", err.message, err.stack);
    return res.status(500).json({ success: false, message: err.message || "Server error during bulk upload." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/students
// @access  Private/Admin/Teacher
// ─────────────────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const { class: filterClass, search } = req.query;
    const query = {};

    // Teacher: restrict to assigned classes only
    if (req.user.role === "teacher") {
      const teacherClasses = req.teacherClasses || [];
      if (teacherClasses.length === 0) {
        return res.json({ success: true, count: 0, students: [], teacherClasses: [] });
      }
      // If a specific class is requested, it must be in teacher's assigned classes
      if (filterClass) {
        if (!teacherClasses.includes(filterClass)) {
          return res.status(403).json({
            success: false,
            message: `You are not assigned to class '${filterClass}'.`,
          });
        }
        query.class = filterClass;
      } else {
        // No filter — return all teacher's classes
        query.class = { $in: teacherClasses };
      }
    } else {
      // Admin: can filter by any class
      if (filterClass) query.class = filterClass;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { roll: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query).sort({ class: 1, roll: 1 });

    // Get attendance stats per student
    const studentIds = students.map(s => s._id);
    const attendanceStats = await Attendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $group: {
          _id: "$studentId",
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        },
      },
    ]);

    const statsMap = {};
    attendanceStats.forEach(s => {
      statsMap[s._id.toString()] = {
        total:      s.total,
        present:    s.present,
        absent:     s.total - s.present,
        percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : "0.0",
      };
    });

    const studentsWithStats = students.map(s => ({
      ...s.toObject(),
      attendance: statsMap[s._id.toString()] || { total: 0, present: 0, absent: 0, percentage: "0.0" },
    }));

    return res.json({
      success: true,
      count: students.length,
      students: studentsWithStats,
      teacherClasses: req.teacherClasses || null,
    });
  } catch (err) {
    console.error("getAllStudents error:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/students/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    return res.json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/students/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const { name, studentClass, email, phone } = req.body;
    // Note: roll is intentionally excluded — roll is immutable after creation

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { name, class: studentClass, email, phone } },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    // Sync name on linked User account
    if (name && student.userId) {
      await User.findByIdAndUpdate(student.userId, { $set: { name } });
    }

    return res.json({ success: true, message: "Student updated.", student });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/students/:id
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    if (student.userId) await User.findByIdAndDelete(student.userId);
    await Attendance.deleteMany({ studentId: req.params.id });

    return res.json({ success: true, message: "Student deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PUT /api/students/my/profile
// @desc    Student updates their own email and phone
// @access  Private/Student
// ─────────────────────────────────────────────────────────────
const updateMyProfile = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const studentId = req.user.studentRef;
    if (!studentId) {
      return res.status(404).json({ success: false, message: "Student profile not linked." });
    }
    const updateData = {};
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone.trim();

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    return res.json({ success: true, message: "Profile updated.", student });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.studentRef);
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found." });
    return res.json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/students/my/attendance
// @access  Private/Student
// ─────────────────────────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    // Try studentRef first, fallback to userId lookup
    let studentId = req.user.studentRef;
    if (!studentId) {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.json({
          success: true,
          overall: { total: 0, present: 0, absent: 0, percentage: "0.0" },
          bySubject: [],
        });
      }
      studentId = student._id;
    }

    const records = await Attendance.find({ studentId })
      .populate("subjectId", "name code")
      .sort({ date: -1 })
      .lean();

    const subjectMap = {};
    for (const rec of records) {
      const subKey = rec.subjectId?._id?.toString();
      if (!subKey) continue;
      if (!subjectMap[subKey]) {
        subjectMap[subKey] = { subject: rec.subjectId, total: 0, present: 0, absent: 0, records: [] };
      }
      subjectMap[subKey].total++;
      if (rec.status === "Present") subjectMap[subKey].present++;
      else subjectMap[subKey].absent++;
      subjectMap[subKey].records.push(rec);
    }

    const bySubject = Object.values(subjectMap).map((s) => ({
      subject:    s.subject,
      total:      s.total,
      present:    s.present,
      absent:     s.absent,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : "0.0",
      records:    s.records,
    }));

    const overallTotal   = records.length;
    const overallPresent = records.filter((r) => r.status === "Present").length;
    const overallAbsent  = overallTotal - overallPresent;

    return res.json({
      success: true,
      overall: {
        total:      overallTotal,
        present:    overallPresent,
        absent:     overallAbsent,
        percentage: overallTotal > 0 ? ((overallPresent / overallTotal) * 100).toFixed(1) : "0.0",
      },
      bySubject,
    });
  } catch (err) {
    console.error("getMyAttendance error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createStudent,
  createStudentByTeacher,
  bulkUploadStudents,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyProfile,
  getMyAttendance,
  updateMyProfile,
};
