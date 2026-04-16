const express  = require("express");
const router   = express.Router();
const { body } = require("express-validator");
const { login, createUser, getMe, changePassword, resetPassword } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Public
router.post("/login",
  [
    body("username").notEmpty().withMessage("Username required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate, login
);

// Admin only — create any user
router.post("/create-user",
  protect, authorize("admin"),
  [
    body("username").trim().notEmpty().withMessage("Username required"),
    body("password").notEmpty().withMessage("Password required"),
    body("role").isIn(["admin","teacher","student"]).withMessage("Invalid role"),
    body("name").trim().notEmpty().withMessage("Name required"),
  ],
  validate, createUser
);

// Private
router.get("/me", protect, getMe);

router.post("/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password required"),
    body("newPassword").isLength({ min: 3 }).withMessage("Min 3 characters"),
  ],
  validate, changePassword
);

router.post("/reset-password/:userId",
  protect, authorize("admin"),
  [body("newPassword").notEmpty().withMessage("New password required")],
  validate, resetPassword
);

module.exports = router;
