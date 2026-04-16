const express = require("express");
const router  = express.Router();
const Query   = require("../models/Query");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const { protect, authorize } = require("../middleware/auth");

// ── IMPORTANT: specific routes BEFORE parameterised routes ────

// ── GET /api/queries/check-teacher ────────────────────────────
// Student: check if their class has a class teacher assigned
router.get("/check-teacher", protect, authorize("student"), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.json({ success: true, hasTeacher: false, message: "Student profile not found." });

    const classTeacher = await Teacher.findOne({
      isClassTeacher: true,
      assignedClass:  student.class,
    });

    if (!classTeacher) {
      return res.json({
        success: true,
        hasTeacher: false,
        message: `No class teacher assigned for class '${student.class}'. Please contact admin.`,
        studentClass: student.class,
      });
    }

    return res.json({ success: true, hasTeacher: true, studentClass: student.class });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/queries/class-overview ───────────────────────────
// Class Teacher only — must be defined BEFORE /:id routes
router.get("/class-overview", protect, authorize("teacher"), async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || !teacher.isClassTeacher) {
      return res.status(403).json({ success: false, message: "Only class teachers can access this." });
    }

    const queries = await Query.find({ studentClass: teacher.assignedClass })
      .populate("studentId", "name roll")
      .sort({ createdAt: -1 })
      .lean();

    // Attach studentName for convenience
    const enriched = queries.map(q => ({
      ...q,
      studentName: q.studentId?.name || "Student",
    }));

    res.json({ success: true, queries: enriched, assignedClass: teacher.assignedClass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/queries ───────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "student") {
      filter = { studentUserId: req.user._id };
    } else if (req.user.role === "teacher") {
      filter = { teacherUserId: req.user._id };
    }

    const queries = await Query.find(filter)
      .populate("studentId", "name roll")
      .sort({ createdAt: -1 })
      .lean();

    // Attach studentName for convenience
    const enriched = queries.map(q => ({
      ...q,
      studentName: q.studentId?.name || "Student",
    }));

    res.json({ success: true, queries: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/queries ──────────────────────────────────────────
router.post("/", protect, authorize("student"), async (req, res) => {
  try {
    const { message, subject } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required." });

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found." });

    const classTeacher = await Teacher.findOne({
      isClassTeacher: true,
      assignedClass:  student.class,
    });

    if (!classTeacher) {
      return res.status(404).json({
        success: false,
        message: `No class teacher assigned for class '${student.class}'. Please contact admin.`,
      });
    }

    const query = await Query.create({
      studentId:     student._id,
      studentUserId: req.user._id,
      teacherId:     classTeacher._id,
      teacherUserId: classTeacher.userId || null,
      studentClass:  student.class,
      subject:       subject || "",
      message,
    });

    res.status(201).json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/queries/:id/respond ───────────────────────────────
router.put("/:id/respond", protect, authorize("teacher", "admin"), async (req, res) => {
  try {
    const { response } = req.body;
    if (!response) return res.status(400).json({ success: false, message: "Response is required." });

    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found." });

    if (
      req.user.role === "teacher" &&
      query.teacherUserId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to respond to this query." });
    }

    query.response = response;
    query.status   = "Resolved";
    await query.save();

    res.json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/queries/:id/seen ──────────────────────────────────
// Student marks a teacher's response as seen
router.put("/:id/seen", protect, authorize("student"), async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found." });
    if (query.studentUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    query.studentSeenResponse = true;
    await query.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/queries/:id/reopen ────────────────────────────────
router.put("/:id/reopen", protect, authorize("student"), async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, message: "Query not found." });

    if (query.studentUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    query.status = "Pending";
    await query.save();
    res.json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
