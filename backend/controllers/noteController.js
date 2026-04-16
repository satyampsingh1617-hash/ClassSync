const Note    = require("../models/Note");
const Subject = require("../models/Subject");
const Student = require("../models/Student");

// ─── POST /api/notes ─────────────────────────────────────────
const createNote = async (req, res) => {
  try {
    const { title, subjectId, url, description } = req.body;
    const teacherId = req.user.teacherRef;

    if (!teacherId)
      return res.status(403).json({ success: false, message: "Teacher profile not linked." });

    // Validate subject belongs to this teacher
    const subject = await Subject.findOne({ _id: subjectId, teacherId });
    if (!subject)
      return res.status(403).json({ success: false, message: "Subject not assigned to you." });

    const note = await Note.create({
      title,
      subject:   subject.name,   // store display name
      subjectId: subject._id,
      url,
      class:     subject.class,  // auto-derive class from subject
      teacherId,
      description: description || "",
    });

    return res.status(201).json({ success: true, message: "Note added.", note });
  } catch (err) {
    console.error("createNote:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/notes ───────────────────────────────────────────
const getNotes = async (req, res) => {
  try {
    const { subjectId, class: filterClass } = req.query;

    if (req.user.role === "teacher") {
      const teacherId = req.user.teacherRef;
      const query = { teacherId };
      if (subjectId)    query.subjectId = subjectId;
      if (filterClass)  query.class     = filterClass;
      const notes = await Note.find(query)
        .populate("subjectId", "name code class")
        .sort({ createdAt: -1 });
      return res.json({ success: true, notes });
    }

    if (req.user.role === "student") {
      const student = await Student.findById(req.user.studentRef).select("class");
      if (!student)
        return res.status(404).json({ success: false, message: "Student profile not found." });

      const query = { class: student.class };
      if (subjectId) query.subjectId = subjectId;

      const notes = await Note.find(query)
        .populate("subjectId", "name code class")
        .sort({ createdAt: -1 });
      return res.json({ success: true, notes, studentClass: student.class });
    }

    if (req.user.role === "admin") {
      const query = {};
      if (filterClass) query.class = filterClass;
      if (subjectId)   query.subjectId = subjectId;
      const notes = await Note.find(query)
        .populate("subjectId", "name code class")
        .sort({ createdAt: -1 });
      return res.json({ success: true, notes });
    }

    return res.status(403).json({ success: false, message: "Access denied." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── DELETE /api/notes/:id ────────────────────────────────────
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note)
      return res.status(404).json({ success: false, message: "Note not found." });

    if (req.user.role === "teacher" && note.teacherId.toString() !== req.user.teacherRef?.toString())
      return res.status(403).json({ success: false, message: "You can only delete your own notes." });

    await Note.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Note deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { createNote, getNotes, deleteNote };
