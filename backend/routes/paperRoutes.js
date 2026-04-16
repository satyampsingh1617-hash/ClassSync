const express = require("express");
const router  = express.Router();
const Paper   = require("../models/Paper");
const { protect, authorize } = require("../middleware/auth");

// ── Save / upsert paper (teacher only) ───────────────────────
router.post("/save", protect, authorize("teacher"), async (req, res) => {
  try {
    const teacherId = req.user.teacherRef;
    if (!teacherId)
      return res.status(403).json({ success: false, message: "Teacher profile not linked." });

    const { subject, subjectCode, class: cls, semester, date, duration, totalMarks, sections, syllabusText } = req.body;

    // Upsert: one paper per teacher per subject+class combo (or just save new)
    const paperId = req.body._id && req.body._id !== 'null' && req.body._id !== '' ? req.body._id : null;
    let paper;

    if (paperId) {
      // Update existing — only if it belongs to this teacher
      paper = await Paper.findOneAndUpdate(
        { _id: paperId, teacherId },
        { subject, subjectCode, class: cls, semester, date, duration, totalMarks, sections, syllabusText },
        { new: true }
      );
      if (!paper) return res.status(404).json({ success: false, message: "Paper not found or not yours." });
    } else {
      paper = await Paper.create({
        teacherId, subject, subjectCode, class: cls, semester,
        date, duration, totalMarks, sections, syllabusText,
      });
    }

    return res.status(201).json({ success: true, message: "Paper saved.", paper });
  } catch (err) {
    console.error("savePaper:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── Get papers ────────────────────────────────────────────────
// Teacher: only their own | Admin: all
router.get("/", protect, authorize("teacher", "admin"), async (req, res) => {
  try {
    const query = req.user.role === "teacher"
      ? { teacherId: req.user.teacherRef }
      : {};

    const papers = await Paper.find(query)
      .populate("teacherId", "name")
      .sort({ updatedAt: -1 });

    return res.json({ success: true, papers });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── Get single paper ──────────────────────────────────────────
router.get("/:id", protect, authorize("teacher", "admin"), async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id).populate("teacherId", "name");
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found." });

    // Teacher can only view their own
    if (req.user.role === "teacher" && paper.teacherId?._id?.toString() !== req.user.teacherRef?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.json({ success: true, paper });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── Delete paper ──────────────────────────────────────────────
router.delete("/:id", protect, authorize("teacher", "admin"), async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, message: "Paper not found." });

    if (req.user.role === "teacher" && paper.teacherId?.toString() !== req.user.teacherRef?.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    await Paper.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Paper deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
