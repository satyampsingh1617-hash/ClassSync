const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  generateOTP,
  verifyOTP,
  getActiveOTP,
  deactivateOTP,
  getViolations,
} = require("../controllers/otpController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Teacher generates OTP with their current location
router.post(
  "/generate",
  protect,
  authorize("teacher"),
  [
    body("subjectId").notEmpty().withMessage("Subject ID is required"),
    body("latitude").isFloat({ min: -90, max: 90 }),
    body("longitude").isFloat({ min: -180, max: 180 }),
  ],
  validate,
  generateOTP
);

// Student verifies with geofencing
router.post(
  "/verify",
  protect,
  authorize("student"),
  [
    body("code").isLength({ min: 6, max: 6 }).withMessage("6-digit code required"),
    body("subjectId").notEmpty().withMessage("Subject ID is required"),
    body("latitude").isFloat({ min: -90, max: 90 }),
    body("longitude").isFloat({ min: -180, max: 180 }),
    body("isMockLocation").optional().isBoolean(),
    body("accuracy").optional().isFloat({ min: 0 }),
  ],
  validate,
  verifyOTP
);

router.get("/active/:subjectId", protect, authorize("teacher"), getActiveOTP);
router.post("/deactivate/:id", protect, authorize("teacher", "admin"), deactivateOTP);
router.get("/violations", protect, authorize("teacher", "admin"), getViolations);

module.exports = router;
