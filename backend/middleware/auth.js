const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Subject = require("../models/Subject");

// ─── protect: verify JWT ──────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Token is invalid. User not found." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token is invalid or expired." });
  }
};

// ─── authorize: role check ────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }
    next();
  };
};

// ─── teacherClassGuard: teacher can only access their assigned classes ──
// Reads ?class= query param and checks against teacher's subjects
const teacherClassGuard = async (req, res, next) => {
  try {
    // Admins bypass this check
    if (req.user.role === "admin") return next();

    // Only applies to teachers
    if (req.user.role !== "teacher") return next();

    const requestedClass = req.query.class;

    // If no class filter requested, restrict to teacher's classes only
    // (controller will handle the actual filtering)
    if (!requestedClass) return next();

    const teacherId = req.user.teacherRef;
    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: "Teacher profile not linked. Contact admin.",
      });
    }

    // Get all classes assigned to this teacher via subjects
    const subjects = await Subject.find({ teacherId }).select("class");
    const assignedClasses = [...new Set(subjects.map(s => s.class))];

    if (!assignedClasses.includes(requestedClass)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You are not assigned to class '${requestedClass}'.`,
        assignedClasses,
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error in class guard." });
  }
};

// ─── getTeacherClasses: attach teacher's assigned classes to req ──
const attachTeacherClasses = async (req, res, next) => {
  try {
    if (req.user.role !== "teacher") return next();

    const teacherId = req.user.teacherRef;
    if (!teacherId) {
      req.teacherClasses = [];
      return next();
    }

    const subjects = await Subject.find({ teacherId }).select("class");
    req.teacherClasses = [...new Set(subjects.map(s => s.class))];
    next();
  } catch (err) {
    req.teacherClasses = [];
    next();
  }
};

module.exports = { protect, authorize, teacherClassGuard, attachTeacherClasses };
