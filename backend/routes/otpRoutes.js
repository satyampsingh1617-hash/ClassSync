const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const {
  generateOTP, verifyOTP, getActiveOTP, deactivateOTP, getViolations,
} = require("../controllers/otpController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Teacher generates OTP for a subject
router.post(
  "/generate",
  protect, authorize("teacher"),
  [
    body("subjectId").notEmpty().withMessage("Subject ID is required"),
    body("topicName").optional().isString(),
    body("timeSlot").optional().isString(),
  ],
  validate,
  generateOTP
);

// Student verifies OTP to mark attendance
router.post(
  "/verify",
  protect, authorize("student"),
  [
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit code required"),
    body("subjectId").notEmpty().withMessage("Subject ID is required"),
    body("latitude").notEmpty().isFloat({ min: -90,  max: 90  }).withMessage("Valid latitude required"),
    body("longitude").notEmpty().isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("isMockLocation").optional().isBoolean(),
    body("isProxy").optional().isBoolean(),
    body("accuracy").optional().isFloat({ min: 0 }),
  ],
  validate,
  verifyOTP
);

// Teacher views active OTP for a subject
router.get("/active/:subjectId", protect, authorize("teacher"), getActiveOTP);

// Teacher/Admin deactivates an OTP
router.post("/deactivate/:id", protect, authorize("teacher", "admin"), deactivateOTP);

// Teacher/Admin views violations (Out-of-Bounds + Spoof attempts)
router.get("/violations", protect, authorize("teacher", "admin"), getViolations);

module.exports = router;
