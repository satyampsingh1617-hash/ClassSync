const OTP = require("../models/OTP");
const Violation = require("../models/Violation");
const Attendance = require("../models/Attendance"); // Added attendance model

// Helper: Haversine Formula for Distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * @desc    Generate OTP (Teacher)
 */
exports.generateOTP = async (req, res) => {
  try {
    const { subjectId, latitude, longitude } = req.body;

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Deactivate any previous OTPs for this subject
    await OTP.updateMany({ subjectId, isActive: true }, { isActive: false });

    const newOTP = await OTP.create({
      code,
      subjectId,
      teacher: req.user.id,
      location: { lat: latitude, lng: longitude }, // Store teacher's anchor point
      isActive: true,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    res.status(201).json({ success: true, code: newOTP.code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify OTP & Mark Attendance (Student)
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { code, subjectId, latitude, longitude, isMockLocation, isProxy } = req.body;

    // 1. Find active OTP
    const activeOTP = await OTP.findOne({ subjectId, code, isActive: true });

    if (!activeOTP) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // 2. Anti-Cheat: Mock Location or Proxy/VPN
    if (isMockLocation || isProxy) {
      await Violation.create({
        student: req.user.id,
        subjectId,
        type: isMockLocation ? "MOCK_LOCATION" : "PROXY_DETECTED",
        details: `Student used ${isMockLocation ? "Fake GPS" : "VPN/Proxy"}.`,
        coordinates: { lat: latitude, lng: longitude }
      });
      return res.status(403).json({ success: false, message: "Security violation detected." });
    }

    // 3. Geofence Check (300m Radius)
    const distance = getDistance(
      latitude,
      longitude,
      activeOTP.location.lat,
      activeOTP.location.lng
    );

    const RADIUS_THRESHOLD = 300; 

    if (distance > RADIUS_THRESHOLD) {
      await Violation.create({
        student: req.user.id,
        subjectId,
        type: "OUT_OF_RANGE",
        details: `Distance: ${Math.round(distance)}m (Limit: ${RADIUS_THRESHOLD}m)`
      });
      return res.status(403).json({
        success: false,
        message: `Verification failed. You are ${Math.round(distance)}m away.`,
      });
    }

    // 4. Success - Mark Attendance
    const alreadyMarked = await Attendance.findOne({ 
        student: req.user.id, 
        subjectId,
        date: { $gte: new Date().setHours(0,0,0,0) } 
    });

    if (alreadyMarked) {
        return res.status(400).json({ success: false, message: "Attendance already marked for today." });
    }

    await Attendance.create({
      student: req.user.id,
      subjectId,
      status: "Present",
      verifiedAt: new Date(),
      location: { lat: latitude, lng: longitude }
    });

    res.status(200).json({ success: true, message: "Attendance verified successfully!" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Standard Admin/Teacher Fetch Functions
exports.getActiveOTP = async (req, res) => {
  const otp = await OTP.findOne({ subjectId: req.params.subjectId, isActive: true });
  res.status(200).json({ success: true, data: otp });
};

exports.getViolations = async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { teacher: req.user.id };
  const violations = await Violation.find(filter).populate("student", "name email");
  res.status(200).json({ success: true, data: violations });
};
