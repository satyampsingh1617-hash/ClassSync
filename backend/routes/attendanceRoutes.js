const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getAttendanceReport,
  getDayTrends,
  deleteAttendance,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const attendanceValidation = [
  body("studentId").notEmpty().withMessage("Student ID is required"),
  body("subjectId").notEmpty().withMessage("Subject ID is required"),
];

router.post("/", protect, authorize("admin", "teacher"), attendanceValidation, validate, markAttendance);
router.post("/bulk", protect, authorize("admin", "teacher"), markBulkAttendance);
router.get("/", protect, authorize("admin", "teacher"), getAttendance);
router.get("/report", protect, authorize("admin", "teacher"), getAttendanceReport);
router.get("/day-trends", protect, authorize("admin", "teacher"), getDayTrends);
router.delete("/:id", protect, authorize("admin"), deleteAttendance);

module.exports = router;
