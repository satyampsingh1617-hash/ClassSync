const express = require("express");
const router = express.Router();
const { getDashboardStats, getAllUsers, deleteUser, getClasses, resetAllStudents } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.get("/dashboard", protect, authorize("admin"), getDashboardStats);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);
router.get("/classes", protect, authorize("admin", "teacher"), getClasses);
router.delete("/reset-students", protect, authorize("admin"), resetAllStudents);

module.exports = router;
