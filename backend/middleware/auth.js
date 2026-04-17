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

// ─── teacherClassGuard: teacher/admin-teacher can only access their assigned classes ──
const teacherClassGuard = async (req, res, next) => {
  try {
    const { role, teacherRef } = req.user;

    // Pure admin with no teacherRef — bypass (sees everything)
    if (role === "admin" && !teacherRef) return next();

    // Admin with teacherRef OR regular teacher — apply class isolation
    if (role !== "teacher" && role !== "admin") return next();

    const requestedClass = req.query.class;
    if (!requestedClass) return next();

    const teacherId = teacherRef;
    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: "Teacher profile not linked. Contact admin.",
      });
    }

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

// ─── attachTeacherClasses: attach teacher's assigned classes to req ──
const attachTeacherClasses = async (req, res, next) => {
  try {
    const { role, teacherRef } = req.user;

    // Pure admin with no teacherRef — skip (admin sees all)
    if (role === "admin" && !teacherRef) return next();

    if (role !== "teacher" && role !== "admin") return next();

    const teacherId = teacherRef;
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
