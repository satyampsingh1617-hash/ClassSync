const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject (admin only)
 * @access  Private/Admin
 */
const createSubject = async (req, res) => {
  try {
    const { name, code, class: subjectClass, teacherId, description } = req.body;

    // Check duplicate code
    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Subject code already exists." });
    }

    // Validate teacher if provided
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ success: false, message: "Teacher not found." });
      }
    }

    const subject = await Subject.create({
      name,
      code,
      class: subjectClass,
      teacherId: teacherId || null,
      description: description || "",
    });

    const populated = await Subject.findById(subject._id).populate("teacherId", "name email");

    res.status(201).json({ success: true, message: "Subject created successfully.", subject: populated });
  } catch (error) {
    console.error("Create subject error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects
 * @access  Private
 */
const getAllSubjects = async (req, res) => {
  try {
    const { class: filterClass, teacherId } = req.query;

    const query = {};
    if (filterClass) query.class = filterClass;
    if (teacherId) query.teacherId = teacherId;

    const subjects = await Subject.find(query)
      .populate("teacherId", "name email department")
      .sort({ name: 1 });

    res.json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   GET /api/subjects/:id
 * @desc    Get single subject
 * @access  Private
 */
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate("teacherId", "name email");
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }
    res.json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject (admin only)
 * @access  Private/Admin
 */
const updateSubject = async (req, res) => {
  try {
    const { name, code, class: subjectClass, teacherId, description } = req.body;

    if (code) {
      const existing = await Subject.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Subject code already in use." });
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code, class: subjectClass, teacherId, description },
      { new: true, runValidators: true }
    ).populate("teacherId", "name email");

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    res.json({ success: true, message: "Subject updated.", subject });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject (admin only)
 * @access  Private/Admin
 */
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }
    res.json({ success: true, message: "Subject deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
