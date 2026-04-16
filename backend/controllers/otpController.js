const OTP           = require("../models/OTP");
const Attendance    = require("../models/Attendance");
const AttendanceLog = require("../models/AttendanceLog");
const Student       = require("../models/Student");
const Subject       = require("../models/Subject");
const { checkGeofence } = require("../utils/geofence");

const generateOTPCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const getTodayDate    = () => new Date().toISOString().split("T")[0];

// ─── POST /api/otp/generate ───────────────────────────────────
const generateOTP = async (req, res) => {
  try {
    const { subjectId, topicName, timeSlot } = req.body;
    const teacherId = req.user.teacherRef;

    const subject = await Subject.findById(subjectId);
    if (!subject)
      return res.status(404).json({ success: false, message: "Subject not found." });

    if (subject.teacherId?.toString() !== teacherId?.toString())
      return res.status(403).json({ success: false, message: "You are not assigned to this subject." });

    // Deactivate existing OTPs for this subject today
    await OTP.updateMany(
      { subjectId, teacherId, date: getTodayDate(), isActive: true },
      { isActive: false }
    );

    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 2;
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const code   = generateOTPCode();

    const otp = await OTP.create({
      code, subjectId, teacherId,
      date: getTodayDate(),
      expiry, isActive: true,
      topicName: topicName || "",
      timeSlot:  timeSlot  || "",
    });

    return res.status(201).json({
      success: true,
      message: `OTP generated. Valid for ${expiryMinutes} minutes.`,
      otp: {
        id: otp._id, code: otp.code, subjectId: otp.subjectId,
        expiry: otp.expiry, expiryMinutes,
        topicName: otp.topicName, timeSlot: otp.timeSlot,
      },
    });
  } catch (err) {
    console.error("generateOTP:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /api/otp/verify ─────────────────────────────────────
// Accepts optional geolocation fields: latitude, longitude, isMockLocation, isProxy, accuracy
const verifyOTP = async (req, res) => {
  const today     = getTodayDate();
  const studentId = req.user.studentRef;
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection?.remoteAddress || "";

  // ── Helper: write audit log ──────────────────────────────────
  const writeLog = async (status, subjectId, otpId, locationData, message) => {
    try {
      await AttendanceLog.create({
        studentId,
        subjectId: subjectId || null,
        otpId:     otpId     || null,
        status,
        latitude:       locationData?.latitude       ?? null,
        longitude:      locationData?.longitude      ?? null,
        distanceMeters: locationData?.distanceMeters ?? null,
        isMockLocation: locationData?.isMockLocation ?? false,
        isProxy:        locationData?.isProxy        ?? false,
        accuracy:       locationData?.accuracy       ?? null,
        date:    today,
        userAgent,
        ipAddress,
        message,
      });
    } catch (logErr) {
      console.error("AttendanceLog write failed:", logErr.message);
    }
  };

  try {
    const {
      code, subjectId,
      latitude, longitude,
      isMockLocation = false,
      isProxy        = false,
      accuracy       = null,
    } = req.body;

    if (!studentId)
      return res.status(400).json({ success: false, message: "Student profile not linked." });

    // ── 1. Validate OTP exists ────────────────────────────────
    const otp = await OTP.findOne({
      code, subjectId, isActive: true,
      expiry: { $gt: new Date() },
    });

    if (!otp) {
      await writeLog("Invalid-OTP", subjectId, null,
        { latitude, longitude, isMockLocation, isProxy, accuracy },
        "Invalid or expired OTP code"
      );
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    if (otp.usedBy.includes(studentId)) {
      return res.status(400).json({ success: false, message: "You have already marked attendance." });
    }

    const existing = await Attendance.findOne({ studentId, subjectId, date: today });
    if (existing)
      return res.status(400).json({ success: false, message: "Attendance already marked for today." });

    // ── 2. Spoof detection ────────────────────────────────────
    if (isMockLocation || isProxy) {
      await writeLog("Spoof-Attempt", subjectId, otp._id,
        { latitude, longitude, isMockLocation, isProxy, accuracy },
        isMockLocation ? "Mock location detected" : "Proxy/VPN detected"
      );
      return res.status(403).json({
        success: false,
        message: "Security check failed. Mock location or proxy detected.",
        code: "SPOOF_DETECTED",
      });
    }

    // ── 3. Geofence check (only if coordinates provided) ──────
    if (latitude != null && longitude != null) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      // Guard against NaN from invalid coordinate strings
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ success: false, message: "Invalid location coordinates." })
      }

      const geo = checkGeofence(lat, lng);

      if (!geo.inside) {
        await writeLog("Out-of-Bounds", subjectId, otp._id,
          { latitude, longitude, distanceMeters: geo.distance, isMockLocation, isProxy, accuracy },
          `Student is ${geo.distance}m from campus (limit: ${geo.campus.radius}m)`
        );
        return res.status(403).json({
          success: false,
          message: `You are ${geo.distance}m away from campus. Must be within ${geo.campus.radius}m to mark attendance.`,
          code: "OUT_OF_BOUNDS",
          distance: geo.distance,
          limit: geo.campus.radius,
        });
      }

      // Inside geofence — mark attendance
      const attendance = await Attendance.create({
        studentId, subjectId, date: today,
        status: "Present", markedBy: otp.teacherId, method: "otp",
        topicName: otp.topicName, timeSlot: otp.timeSlot,
      });

      otp.usedBy.push(studentId);
      await otp.save();

      await writeLog("Success", subjectId, otp._id,
        { latitude, longitude, distanceMeters: geo.distance, isMockLocation, isProxy, accuracy },
        `Marked present — ${geo.distance}m from campus gate`
      );

      return res.json({
        success: true,
        message: "Attendance marked! You are Present.",
        attendance,
        distance: geo.distance,
      });
    }

    // ── 4. No coordinates provided — mark without geofence ────
    // (fallback for browsers that deny location; still logs it)
    const attendance = await Attendance.create({
      studentId, subjectId, date: today,
      status: "Present", markedBy: otp.teacherId, method: "otp",
      topicName: otp.topicName, timeSlot: otp.timeSlot,
    });

    otp.usedBy.push(studentId);
    await otp.save();

    await writeLog("Success", subjectId, otp._id,
      { latitude: null, longitude: null, isMockLocation, isProxy, accuracy },
      "Marked present — no location data provided"
    );

    return res.json({ success: true, message: "Attendance marked! You are Present.", attendance });

  } catch (err) {
    console.error("verifyOTP:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/otp/active/:subjectId ──────────────────────────
const getActiveOTP = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const teacherId = req.user.teacherRef;

    const otp = await OTP.findOne({
      subjectId, teacherId, isActive: true,
      expiry: { $gt: new Date() },
    });

    if (!otp) return res.json({ success: true, otp: null });

    return res.json({
      success: true,
      otp: {
        id: otp._id, code: otp.code, expiry: otp.expiry,
        usedCount: otp.usedBy.length,
        topicName: otp.topicName, timeSlot: otp.timeSlot,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── POST /api/otp/deactivate/:id ────────────────────────────
const deactivateOTP = async (req, res) => {
  try {
    const otp = await OTP.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!otp) return res.status(404).json({ success: false, message: "OTP not found." });
    return res.json({ success: true, message: "OTP deactivated." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── GET /api/otp/violations ──────────────────────────────────
// Teacher/Admin: get all Out-of-Bounds and Spoof-Attempt logs
const getViolations = async (req, res) => {
  try {
    const { status, subjectId, date, class: filterClass } = req.query;

    const query = {
      status: { $in: ["Out-of-Bounds", "Spoof-Attempt"] },
    };

    if (status && ["Out-of-Bounds", "Spoof-Attempt", "Invalid-OTP"].includes(status)) {
      query.status = status;
    }
    if (subjectId) query.subjectId = subjectId;
    if (date)      query.date      = date;

    // Teacher isolation — only show violations for their subjects
    if (req.user.role === "teacher") {
      const Subject = require("../models/Subject");
      const mySubjects = await Subject.find({ teacherId: req.user.teacherRef }).select("_id");
      const mySubjectIds = mySubjects.map(s => s._id);
      query.subjectId = subjectId
        ? (mySubjectIds.some(id => id.toString() === subjectId) ? subjectId : null)
        : { $in: mySubjectIds };
      if (query.subjectId === null)
        return res.json({ success: true, violations: [], count: 0 });
    }

    let violations = await AttendanceLog.find(query)
      .populate("studentId", "name roll class")
      .populate("subjectId", "name code class")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Optional class filter (post-populate)
    if (filterClass) {
      violations = violations.filter(v => v.studentId?.class === filterClass);
    }

    return res.json({ success: true, count: violations.length, violations });
  } catch (err) {
    console.error("getViolations:", err.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { generateOTP, verifyOTP, getActiveOTP, deactivateOTP, getViolations };
