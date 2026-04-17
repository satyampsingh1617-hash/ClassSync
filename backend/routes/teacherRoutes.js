const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getMySubjects,
  getMyProfile,
} = require("../controllers/teacherController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const teacherValidation = [
  body("name").trim().notEmpty().withMessage("Teacher name is required"),
];

// Teacher's own routes — admin with teacherRef can also use these
router.get("/my/subjects", protect, authorize("teacher", "admin"), getMySubjects);
router.get("/my/profile",  protect, authorize("teacher", "admin"), getMyProfile);

// Admin routes
router.post("/", protect, authorize("admin"), teacherValidation, validate, createTeacher);
router.get("/", protect, authorize("admin"), getAllTeachers);
router.get("/:id", protect, authorize("admin"), getTeacherById);
router.put("/:id", protect, authorize("admin"), updateTeacher);
router.delete("/:id", protect, authorize("admin"), deleteTeacher);

module.exports = router;
