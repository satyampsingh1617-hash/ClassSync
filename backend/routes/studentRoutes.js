const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const multer  = require("multer");
const {
  createStudent, createStudentByTeacher, bulkUploadStudents,
  getAllStudents, getStudentById, updateStudent, deleteStudent,
  getMyProfile, getMyAttendance, updateMyProfile,
} = require("../controllers/studentController");
const { protect, authorize, teacherClassGuard, attachTeacherClasses } = require("../middleware/auth");
const validate = require("../middleware/validate");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls|csv)$/i)) cb(null, true);
    else cb(new Error("Only .xlsx, .xls, or .csv files are allowed."), false);
  },
});

const studentValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("roll").trim().notEmpty().withMessage("Roll number is required"),
  body("studentClass").trim().notEmpty().withMessage("Class is required"),
];

// ── Student own routes ────────────────────────────────────────
router.get("/my/profile",    protect, authorize("student"), getMyProfile);
router.get("/my/attendance", protect, authorize("student"), getMyAttendance);
router.put("/my/profile",    protect, authorize("student"), [
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email"),
  body("phone").optional().isString(),
], validate, updateMyProfile);

// ── Excel bulk upload (teacher + admin) ──────────────────────
router.post("/bulk-upload", protect, authorize("teacher", "admin"), (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "File upload error." });
    }
    // Multer v2: req.body is populated for multipart text fields after upload.
    // Also accept defaultClass from query param as a reliable fallback.
    req.defaultClass = req.body?.defaultClass || req.query?.defaultClass || "";
    next();
  });
}, bulkUploadStudents);

// ── Teacher creates single student ───────────────────────────
router.post("/teacher-create", protect, authorize("teacher", "admin"), studentValidation, validate, createStudentByTeacher);

// ── List students (admin + teacher, with class guard) ─────────
router.get("/",
  protect,
  authorize("admin", "teacher"),
  attachTeacherClasses,   // attaches req.teacherClasses for teachers
  teacherClassGuard,      // blocks if requested class not in teacher's list
  getAllStudents
);

// ── Admin CRUD ────────────────────────────────────────────────
router.post("/",      protect, authorize("admin"), studentValidation, validate, createStudent);
router.get("/:id",    protect, authorize("admin", "teacher"), getStudentById);
router.put("/:id",    protect, authorize("admin"), updateStudent);
router.delete("/:id", protect, authorize("admin"), deleteStudent);

module.exports = router;
