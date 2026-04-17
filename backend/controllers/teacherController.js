const Teacher = require("../models/Teacher");
const User = require("../models/User");
const Subject = require("../models/Subject");

/**
 * @route   POST /api/teachers
 * @desc    Create a new teacher (admin only)
 * @access  Private/Admin
 */
const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, department, username, password } = req.body;

    // Check username BEFORE creating anything
    if (username) {
      const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists." });
      }
    }

    // Create teacher profile
    const teacher = await Teacher.create({ name, email, phone, department });

    // Create user account for teacher
    if (username && password) {
      const user = await User.create({
        username: username.toLowerCase().trim(),
        password,
        role: "teacher",
        name,
        teacherRef: teacher._id,
      });

      teacher.userId = user._id;
      await teacher.save();
    }

    res.status(201).json({ success: true, message: "Teacher created successfully.", teacher });
  } catch (error) {
    console.error("Create teacher error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Username already exists." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/teachers
 * @desc    Get all teachers (admin only)
 * @access  Private/Admin
 */
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/teachers/:id
 * @desc    Get single teacher
 * @access  Private/Admin
 */
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   PUT /api/teachers/:id
 * @desc    Update teacher (admin only)
 * @access  Private/Admin
 */
const updateTeacher = async (req, res) => {
  try {
    const { name, email, phone, department, isClassTeacher, assignedClass } = req.body;

    // Build update object — only include defined fields
    const updateData = {};
    if (name        !== undefined) updateData.name       = name;
    if (email       !== undefined) updateData.email      = email;
    if (phone       !== undefined) updateData.phone      = phone;
    if (department  !== undefined) updateData.department = department;

    // Class teacher designation — always update both fields together
    if (typeof isClassTeacher === "boolean") {
      updateData.isClassTeacher = isClassTeacher;
      updateData.assignedClass  = isClassTeacher ? (assignedClass || "").trim() : "";
    }

    // Fetch first so we have userId before update
    const existing = await Teacher.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Sync name on linked User account
    if (name && existing.userId) {
      await User.findByIdAndUpdate(existing.userId, { $set: { name } });
    }

    res.json({ success: true, message: "Teacher updated.", teacher });
  } catch (error) {
    console.error("updateTeacher error:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/teachers/my/profile
 * @desc    Get logged-in teacher's own Teacher profile (includes isClassTeacher, assignedClass)
 * @access  Private/Teacher
 */
const getMyProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher profile not found." });
    res.json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   DELETE /api/teachers/:id
 * @desc    Delete teacher (admin only)
 * @access  Private/Admin
 */
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    // Delete associated user account
    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }

    res.json({ success: true, message: "Teacher deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   PUT /api/teachers/my/profile
 * @desc    Teacher updates their own profile
 * @access  Private/Teacher or Admin with teacherRef
 */
const updateMyProfile = async (req, res) => {
  try {
    const { name, email, phone, department } = req.body;
    const teacherId = req.user.teacherRef;
    if (!teacherId) {
      return res.status(404).json({ success: false, message: "Teacher profile not linked." });
    }

    const updateData = {};
    if (name       !== undefined) updateData.name       = name.trim();
    if (email      !== undefined) updateData.email      = email.trim();
    if (phone      !== undefined) updateData.phone      = phone.trim();
    if (department !== undefined) updateData.department = department.trim();

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found." });

    // Sync name on User account
    if (name) await User.findByIdAndUpdate(req.user._id, { $set: { name: name.trim() } });

    res.json({ success: true, message: "Profile updated.", teacher });
  } catch (error) {
    console.error("updateMyProfile:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
const getMySubjects = async (req, res) => {
  try {
    const teacherId = req.user.teacherRef;
    const subjects = await Subject.find({ teacherId }).sort({ name: 1 });
    res.json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMySubjects,
  getMyProfile,
  updateMyProfile,
};
