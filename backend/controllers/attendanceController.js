const Attendance = require("../models/Attendance");
const Student    = require("../models/Student");
const Subject    = require("../models/Subject");

const getTodayDate = () => new Date().toISOString().split("T")[0];

// ─── POST /api/attendance ─────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, date, status, topicName, timeSlot } = req.body;
    const attendanceDate = date || getTodayDate();

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });

    // Teacher isolation: teacher can only mark attendance for their own subjects
    if (req.user.role === "teacher") {
      if (subject.teacherId?.toString() !== req.user.teacherRef?.toString()) {
        return res.status(403).json({ success: false, message: "You are not assigned to this subject." });
      }
    }

    const existing = await Attendance.findOne({ studentId, subjectId, date: attendanceDate });
    if (existing) return res.status(400).json({ success: false, message: "Attendance already marked." });

    const attendance = await Attendance.create({
      studentId, subjectId, date: attendanceDate,
      status: status || "Present",
      markedBy: req.user.role === "teacher" ? req.user.teacherRef : null,
      method: "manual",
      topicName: topicName || "",
      timeSlot:  timeSlot  || "",
    });

    return res.status(201).json({ success: true, message: "Attendance marked.", attendance });
  } catch (err) {
    console.error("markAttendance:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /api/attendance/bulk ────────────────────────────────
const markBulkAttendance = async (req, res) => {
  try {
    const { subjectId, date, records, topicName, timeSlot } = req.body;
    const attendanceDate = date || getTodayDate();

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });

    // Teacher isolation
    if (req.user.role === "teacher") {
      if (subject.teacherId?.toString() !== req.user.teacherRef?.toString()) {
        return res.status(403).json({ success: false, message: "You are not assigned to this subject." });
      }
    }

    const markedBy = req.user.role === "teacher" ? req.user.teacherRef : null;
    const results  = { success: [], failed: [] };

    for (const record of records) {
      try {
        const existing = await Attendance.findOne({
          studentId: record.studentId, subjectId, date: attendanceDate,
        });

        if (existing) {
          // Update existing record instead of skipping
          existing.status    = record.status || "Present";
          existing.topicName = topicName || existing.topicName;
          existing.timeSlot  = timeSlot  || existing.timeSlot;
          existing.markedBy  = markedBy  || existing.markedBy;
          await existing.save();
          results.success.push(record.studentId);
        } else {
          await Attendance.create({
            studentId: record.studentId, subjectId,
            date: attendanceDate, status: record.status || "Present",
            markedBy, method: "manual",
            topicName: topicName || "", timeSlot: timeSlot || "",
          });
          results.success.push(record.studentId);
        }
      } catch (err) {
        results.failed.push({ studentId: record.studentId, reason: err.message });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Attendance saved for ${results.success.length} students.`,
      results,
    });
  } catch (err) {
    console.error("markBulkAttendance:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/attendance ──────────────────────────────────────
// Admin: sees all | Teacher: only their subjects
const getAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, date, startDate, endDate, class: filterClass } = req.query;

    const query = {};
    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (date)      query.date      = date;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };

    // ── Teacher isolation ──────────────────────────────────────
    if (req.user.role === "teacher") {
      const teacherId = req.user.teacherRef;
      // Get all subjects assigned to this teacher
      const mySubjects = await Subject.find({ teacherId }).select("_id");
      const mySubjectIds = mySubjects.map(s => s._id);

      if (subjectId) {
        // Verify the requested subject belongs to this teacher
        const isOwn = mySubjectIds.some(id => id.toString() === subjectId);
        if (!isOwn) {
          return res.status(403).json({ success: false, message: "You are not assigned to this subject." });
        }
      } else {
        // Restrict to teacher's subjects only
        query.subjectId = { $in: mySubjectIds };
      }
    }
    // Admin: no restriction — sees everything

    let records = await Attendance.find(query)
      .populate("studentId", "name roll class")
      .populate("subjectId", "name code class")
      .populate("markedBy", "name")
      .sort({ date: -1, createdAt: -1 });

    if (filterClass) {
      records = records.filter(r => r.studentId?.class === filterClass);
    }

    return res.json({ success: true, count: records.length, records });
  } catch (err) {
    console.error("getAttendance:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/attendance/day-trends ──────────────────────────
// Returns attendance counts grouped by day of week (Mon-Sat)
const getDayTrends = async (req, res) => {
  try {
    const { class: filterClass } = req.query;
    const records = await Attendance.find({})
      .populate("studentId", "class")
      .lean();

    const dayMap = { Mon: { present: 0, absent: 0 }, Tue: { present: 0, absent: 0 },
      Wed: { present: 0, absent: 0 }, Thu: { present: 0, absent: 0 },
      Fri: { present: 0, absent: 0 }, Sat: { present: 0, absent: 0 } };
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    for (const rec of records) {
      if (filterClass && rec.studentId?.class !== filterClass) continue;
      const d = new Date(rec.date);
      const dayName = dayNames[d.getDay()];
      if (!dayMap[dayName]) continue;
      if (rec.status === "Present") dayMap[dayName].present++;
      else dayMap[dayName].absent++;
    }

    const trends = Object.entries(dayMap).map(([day, counts]) => ({ day, ...counts }));
    return res.json({ success: true, trends });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/attendance/report ───────────────────────────────
// Accurate report: groups ALL records (Present + Absent) per student per subject
const getAttendanceReport = async (req, res) => {
  try {
    const { subjectId, class: filterClass } = req.query;
    const query = {};
    if (subjectId) query.subjectId = subjectId;

    // Teacher isolation
    if (req.user.role === "teacher") {
      const teacherId = req.user.teacherRef;
      const mySubjects = await Subject.find({ teacherId }).select("_id");
      const mySubjectIds = mySubjects.map(s => s._id);

      if (subjectId) {
        const isOwn = mySubjectIds.some(id => id.toString() === subjectId);
        if (!isOwn) return res.status(403).json({ success: false, message: "Not your subject." });
      } else {
        query.subjectId = { $in: mySubjectIds };
      }
    }

    // Fetch ALL records — both Present and Absent
    const records = await Attendance.find(query)
      .populate("studentId", "name roll class")
      .populate("subjectId", "name code")
      .lean();

    // Group by student+subject
    const reportMap = {};
    for (const rec of records) {
      if (!rec.studentId || !rec.subjectId) continue;
      if (filterClass && rec.studentId.class !== filterClass) continue;

      const key = `${rec.studentId._id}_${rec.subjectId._id}`;
      if (!reportMap[key]) {
        reportMap[key] = {
          student: rec.studentId,
          subject: rec.subjectId,
          total:   0,
          present: 0,
          absent:  0,
        };
      }
      reportMap[key].total++;
      if (rec.status === "Present") {
        reportMap[key].present++;
      } else {
        reportMap[key].absent++;
      }
    }

    const report = Object.values(reportMap).map(r => ({
      student:    r.student,
      subject:    r.subject,
      total:      r.total,
      present:    r.present,
      absent:     r.absent,
      percentage: r.total > 0 ? ((r.present / r.total) * 100).toFixed(1) : "0.0",
    })).sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

    return res.json({ success: true, count: report.length, report });
  } catch (err) {
    console.error("getAttendanceReport:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── DELETE /api/attendance/:id (admin only) ──────────────────
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found." });
    return res.json({ success: true, message: "Attendance record deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { markAttendance, markBulkAttendance, getAttendance, getAttendanceReport, getDayTrends, deleteAttendance };
