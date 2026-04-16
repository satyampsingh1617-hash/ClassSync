const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const {
  generateOTP, verifyOTP, getActiveOTP, deactivateOTP, getViolations,
} = require("../controllers/otpController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.post(
  "/generate",
  protect, authorize("teacher"),
  [body("subjectId").notEmpty().withMessage("Subject ID is required")],
  validate,
  generateOTP
);

router.post(
  "/verify",
  protect, authorize("student"),
  [
    body("code").notEmpty().withMessage("OTP code is required"),
    body("subjectId").notEmpty().withMessage("Subject ID is required"),
    // location fields are optional
    body("latitude").optional().isFloat({ min: -90,  max: 90  }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
    body("isMockLocation").optional().isBoolean(),
    body("isProxy").optional().isBoolean(),
    body("accuracy").optional().isFloat({ min: 0 }),
  ],
  validate,
  verifyOTP
);

router.get("/active/:subjectId", protect, authorize("teacher"), getActiveOTP);
router.post("/deactivate/:id",   protect, authorize("teacher", "admin"), deactivateOTP);

// Violation dashboard — teacher sees own subjects, admin sees all
router.get("/violations", protect, authorize("teacher", "admin"), getViolations);

module.exports = router;
