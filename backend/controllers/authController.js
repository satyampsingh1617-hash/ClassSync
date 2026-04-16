const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const User    = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// Safe user response — no model methods, plain object
const safeUser = (u) => ({
  id:                u._id.toString(),
  username:          u.username,
  name:              u.name,
  role:              u.role,
  studentRef:        u.studentRef ? u.studentRef.toString() : null,
  teacherRef:        u.teacherRef ? u.teacherRef.toString() : null,
  mustChangePassword: u.mustChangePassword || false,
});

// ─── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password are required." });

    // Get raw document including password field
    const user = await User.findOne({ username: username.toLowerCase().trim() })
      .select("username name role password studentRef teacherRef mustChangePassword")
      .lean();  // plain JS object — no Mongoose methods, no toJSON issues

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid username or password." });

    // Direct bcrypt compare — no model method
    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok)
      return res.status(401).json({ success: false, message: "Invalid username or password." });

    const token = generateToken(user._id);
    return res.json({
      success: true,
      message: "Login successful.",
      token,
      mustChangePassword: user.mustChangePassword || false,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("login error:", err.message);
    return res.status(500).json({ success: false, message: "Server error.", detail: err.message });
  }
};

// ─── POST /api/auth/create-user  (Admin only) ─────────────────
const createUser = async (req, res) => {
  try {
    const { username, password, role, name, email, phone, roll, studentClass, department } = req.body;

    if (!["admin","teacher","student"].includes(role))
      return res.status(400).json({ success: false, message: "Role must be admin, teacher, or student." });

    if (role === "student" && (!roll || !studentClass))
      return res.status(400).json({ success: false, message: "Roll number and class are required for student." });

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists)
      return res.status(400).json({ success: false, message: "Username already taken." });

    if (role === "student") {
      const rollExists = await Student.findOne({ roll: roll.trim() });
      if (rollExists)
        return res.status(400).json({ success: false, message: `Roll number '${roll}' already exists.` });
    }

    const user = await User.create({ username, password, role, name });

    if (role === "student") {
      const student = await Student.create({
        name, roll: roll.trim(), class: studentClass.trim(),
        email: email || "", phone: phone || "", userId: user._id,
      });
      user.studentRef = student._id;
      await user.save();
    }

    if (role === "teacher") {
      const teacher = await Teacher.create({
        name, email: email || "", phone: phone || "",
        department: department || "", userId: user._id,
        isClassTeacher: req.body.isClassTeacher || false,
        assignedClass:  req.body.isClassTeacher ? (req.body.assignedClass || "") : "",
      });
      user.teacherRef = teacher._id;
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created.`,
      user: { id: user._id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("createUser error:", err.message);
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Username or roll number already exists." });
    return res.status(500).json({ success: false, message: "Server error.", detail: err.message });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /api/auth/change-password ──────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const ok   = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!ok)
      return res.status(400).json({ success: false, message: "Current password is incorrect." });

    user.password           = newPassword;
    user.mustChangePassword = false;
    await user.save();
    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /api/auth/reset-password/:userId  (Admin only) ─────
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.password           = newPassword;
    user.mustChangePassword = true;
    await user.save();
    return res.json({ success: true, message: `Password reset for ${user.username}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { login, createUser, getMe, changePassword, resetPassword };
