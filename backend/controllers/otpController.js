const OTP            = require("../models/OTP");
const Attendance     = require("../models/Attendance");
const AttendanceLog  = require("../models/AttendanceLog");
const { checkGeofence } = require("../utils/geofence");

const getTodayDate = () => new Date().toISOString().split("T")[0];

/**
 * @desc  Generate OTP (Teacher)
 * POST  /api/otp/generate
 */
exports.generateOTP = async (req, res) => {
  try {
    const { subjectId, topicName, timeSlot } = req.body;

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Deactivate any previous active OTPs for this subject
    await OTP.updateMany({ subjectId, isActive: true }, { isActive: false });

    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newOTP = await OTP.create({
      code,
      subjectId,
      teacherId:  req.user.teacherRef,
      date:       getTodayDate(),
      expiry,
      isActive:   true,
      topicName:  topicName || "",
      timeSlot:   timeSlot  || "",
    });

    res.status(201).json({ success: true, code: newOTP.code, expiresAt: expiry });
  } catch (error) {
    console.error("generateOTP:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Verify OTP & Mark Attendance (Student)
 * POST  /api/otp/verify
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { code, subjectId, latitude, longitude, isMockLocation, isProxy, accuracy } = req.body;

    const today     = getTodayDate();
    const studentId = req.user.studentRef;
    const lat       = parseFloat(latitude);
    const lng       = parseFloat(longitude);

    // ── 1. Anti-cheat: mock location / proxy ─────────────────
    if (isMockLocation || isProxy) {
      await AttendanceLog.create({
        studentId,
        subjectId,
        status:         "Spoof-Attempt",
        latitude:       isNaN(lat) ? null : lat,
        longitude:      isNaN(lng) ? null : lng,
        isMockLocation: !!isMockLocation,
        isProxy:        !!isProxy,
        accuracy:       accuracy || null,
        date:           today,
        message:        `${isMockLocation ? "Fake GPS" : "VPN/proxy"} detected.`,
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        code:    "SPOOF_DETECTED",
        message: `Security violation: ${isMockLocation ? "fake GPS" : "VPN/proxy"} detected.`,
      });
    }

    // ── 2. Validate coordinates ───────────────────────────────
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "Invalid location coordinates." });
    }

    // ── 3. Find active, non-expired OTP ──────────────────────
    const activeOTP = await OTP.findOne({
      subjectId,
      code,
      isActive: true,
      expiry:   { $gt: new Date() },
    });

    if (!activeOTP) {
      await AttendanceLog.create({
        studentId,
        subjectId,
        status:    "Invalid-OTP",
        latitude:  lat,
        longitude: lng,
        accuracy:  accuracy || null,
        date:      today,
        message:   "Invalid or expired OTP.",
      }).catch(() => {});

      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // ── 4. Geofence check against campus ─────────────────────
    const { inside, distance, campus } = checkGeofence(lat, lng);

    if (!inside) {
      await AttendanceLog.create({
        studentId,
        subjectId,
        otpId:          activeOTP._id,
        status:         "Out-of-Bounds",
        latitude:       lat,
        longitude:      lng,
        distanceMeters: distance,
        accuracy:       accuracy || null,
        date:           today,
        message:        `${distance}m from campus (limit: ${campus.radius}m).`,
      }).catch(() => {});

      return res.status(403).json({
        success:  false,
        code:     "OUT_OF_BOUNDS",
        message:  `You are ${distance}m from campus. Must be within ${campus.radius}m.`,
        distance,
        limit:    campus.radius,
      });
    }

    // ── 5. Prevent duplicate attendance for today ─────────────
    const alreadyMarked = await Attendance.findOne({
      studentId,
      subjectId,
      date: today,
    });

    if (alreadyMarked) {
      return res.status(400).json({ success: false, message: "Attendance already marked for today." });
    }

    // ── 6. Mark attendance ────────────────────────────────────
    await Attendance.create({
      studentId,
      subjectId,
      date:      today,
      status:    "Present",
      method:    "otp",
      topicName: activeOTP.topicName || "",
      timeSlot:  activeOTP.timeSlot  || "",
    });

    // Log success
    await AttendanceLog.create({
      studentId,
      subjectId,
      otpId:          activeOTP._id,
      status:         "Success",
      latitude:       lat,
      longitude:      lng,
      distanceMeters: distance,
      accuracy:       accuracy || null,
      date:           today,
      message:        `Marked present. ${distance}m from campus.`,
    }).catch(() => {});

    // Mark OTP as used by this student
    await OTP.findByIdAndUpdate(activeOTP._id, {
      $addToSet: { usedBy: studentId },
    });

    return res.status(200).json({
      success:  true,
      message:  "Attendance marked successfully!",
      distance,
    });

  } catch (error) {
    console.error("verifyOTP:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Get violations (Out-of-Bounds + Spoof attempts)
 * GET   /api/otp/violations
 */
exports.getViolations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {
      status: { $in: ["Out-of-Bounds", "Spoof-Attempt"] },
    };
    if (date)   filter.date   = date;
    if (status) filter.status = status;

    const violations = await AttendanceLog.find(filter)
      .populate("studentId", "name roll class")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success:    true,
      count:      violations.length,
      violations,
    });
  } catch (error) {
    console.error("getViolations:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Deactivate OTP (Teacher / Admin)
 * POST  /api/otp/deactivate/:id
 */
exports.deactivateOTP = async (req, res) => {
  try {
    const otp = await OTP.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!otp) return res.status(404).json({ success: false, message: "OTP not found." });
    res.json({ success: true, message: "OTP deactivated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Get active OTP for a subject (Teacher)
 * GET   /api/otp/active/:subjectId
 */
exports.getActiveOTP = async (req, res) => {
  try {
    const otp = await OTP.findOne({
      subjectId: req.params.subjectId,
      isActive:  true,
      expiry:    { $gt: new Date() },
    });
    res.status(200).json({ success: true, data: otp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
