const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const AttendanceLog = require("../models/AttendanceLog");
const OTP = require("../models/OTP");

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard stats for admin
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalSubjects, totalAttendance] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Subject.countDocuments(),
      Attendance.countDocuments(),
    ]);

    const presentCount = await Attendance.countDocuments({ status: "Present" });
    const overallPercentage =
      totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : "0.0";

    // Recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recentAttendance = await Attendance.find({ date: { $gte: sevenDaysAgoStr } })
      .populate("studentId", "name roll class")
      .populate("subjectId", "name code")
      .sort({ date: -1 })
      .limit(20);

    // Attendance by date (last 7 days for chart)
    const dailyStats = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgoStr } } },
      {
        $group: {
          _id: { date: "$date", status: "$status" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalAttendance,
        presentCount,
        overallPercentage,
      },
      recentAttendance,
      dailyStats,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user (admin only)
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, message: "User deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/admin/classes ───────────────────────────────────
// Admin: all distinct classes from both students AND subjects | Teacher: only their assigned classes
const getClasses = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const [studentClasses, subjectClasses] = await Promise.all([
        Student.distinct("class"),
        Subject.distinct("class"),
      ]);
      // Merge and deduplicate
      const classes = [...new Set([...studentClasses, ...subjectClasses])].sort();
      return res.json({ success: true, classes });
    }

    // Teacher: get classes from their subjects
    const teacherId = req.user.teacherRef;
    if (!teacherId) return res.json({ success: true, classes: [] });

    const subjects = await Subject.find({ teacherId }).select("class");
    const classes  = [...new Set(subjects.map(s => s.class))].sort();
    return res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── DELETE /api/admin/reset-students ────────────────────────
// Full wipe: all student accounts + attendance records + OTP logs
// Admin only. Requires confirmation token in body.
const resetAllStudents = async (req, res) => {
  try {
    const { confirmText } = req.body;

    // Require the admin to type "DELETE ALL STUDENTS" to confirm
    if (confirmText !== "DELETE ALL STUDENTS") {
      return res.status(400).json({
        success: false,
        message: 'Confirmation text does not match. Type "DELETE ALL STUDENTS" exactly.',
      });
    }

    // 1. Get all student user IDs before deleting
    const studentUsers = await User.find({ role: "student" }).select("_id").lean();
    const studentUserIds = studentUsers.map(u => u._id);

    // 2. Get all student profile IDs
    const studentProfiles = await Student.find({}).select("_id").lean();
    const studentProfileIds = studentProfiles.map(s => s._id);

    // 3. Delete in order: attendance logs → attendance records → OTPs → student profiles → user accounts
    const [
      deletedLogs,
      deletedAttendance,
      deletedOTPs,
      deletedStudents,
      deletedUsers,
    ] = await Promise.all([
      AttendanceLog.deleteMany({ studentId: { $in: studentProfileIds } }),
      Attendance.deleteMany({ studentId: { $in: studentProfileIds } }),
      OTP.updateMany({}, { $pull: { usedBy: { $in: studentProfileIds } } }),
      Student.deleteMany({}),
      User.deleteMany({ role: "student" }),
    ]);

    console.log(`✅ Reset: ${deletedStudents.deletedCount} students, ${deletedUsers.deletedCount} users, ${deletedAttendance.deletedCount} attendance records, ${deletedLogs.deletedCount} logs`);

    return res.json({
      success: true,
      message: "All student data has been permanently deleted.",
      summary: {
        studentsDeleted:    deletedStudents.deletedCount,
        usersDeleted:       deletedUsers.deletedCount,
        attendanceDeleted:  deletedAttendance.deletedCount,
        logsDeleted:        deletedLogs.deletedCount,
      },
    });
  } catch (err) {
    console.error("resetAllStudents:", err.message);
    return res.status(500).json({ success: false, message: "Server error during reset." });
  }
};

module.exports = { getDashboardStats, getAllUsers, deleteUser, getClasses, resetAllStudents };
