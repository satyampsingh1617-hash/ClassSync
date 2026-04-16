const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const subjectValidation = [
  body("name").trim().notEmpty().withMessage("Subject name is required"),
  body("code").trim().notEmpty().withMessage("Subject code is required"),
  body("class").trim().notEmpty().withMessage("Class is required"),
];

router.post("/", protect, authorize("admin"), subjectValidation, validate, createSubject);
router.get("/", protect, getAllSubjects);
router.get("/:id", protect, getSubjectById);
router.put("/:id", protect, authorize("admin"), updateSubject);
router.delete("/:id", protect, authorize("admin"), deleteSubject);

module.exports = router;
