const express      = require("express");
const router       = express.Router();
const Announcement = require("../models/Announcement");
const Student      = require("../models/Student");
const ReadStatus   = require("../models/ReadStatus");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/announcements ─────────────────────────────────────
// Admin/Teacher: get all announcements
// Student: get announcements targeted to 'All' or their class, enriched with isRead
router.get("/", protect, async (req, res) => {
  try {
    let filter = {};
    let student = null;

    if (req.user.role === "student") {
      student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.json({ success: true, announcements: [] });
      const studentClass = student.class;
      filter = { $or: [{ targetClass: "All" }, { targetClass: studentClass }] };
    }

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with isRead for students
    if (req.user.role === "student" && student && announcements.length) {
      const ids = announcements.map((a) => a._id);
      const readRecords = await ReadStatus.find({
        studentId: student._id,
        announcementId: { $in: ids },
      }).lean();
      const readSet = new Set(readRecords.map((r) => r.announcementId.toString()));
      const enriched = announcements.map((a) => ({
        ...a,
        isRead: readSet.has(a._id.toString()),
      }));
      return res.json({ success: true, announcements: enriched });
    }

    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/announcements ────────────────────────────────────
// Admin or Teacher only
router.post("/", protect, authorize("admin", "teacher"), async (req, res) => {
  try {
    const { title, content, priority, targetClass } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority:      priority || "General",
      targetClass:   targetClass || "All",
      createdBy:     req.user._id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
    });

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/announcements/:id/read ──────────────────────────
// Student only — mark an announcement as read (upsert)
router.post("/:id/read", protect, authorize("student"), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    await ReadStatus.findOneAndUpdate(
      { announcementId: req.params.id, studentId: student._id },
      { $setOnInsert: { readAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/announcements/:id ─────────────────────────────
// Admin only (or the teacher who created it)
router.delete("/:id", protect, authorize("admin", "teacher"), async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: "Announcement not found." });

    // Teachers can only delete their own
    if (req.user.role === "teacher" && ann.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this announcement." });
    }

    await ann.deleteOne();
    res.json({ success: true, message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
