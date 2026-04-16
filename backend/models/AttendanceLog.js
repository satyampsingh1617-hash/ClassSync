/**
 * AttendanceLog — Security audit trail for every OTP submission attempt.
 * Captures geolocation, mock-location flags, and outcome for each attempt.
 */
const mongoose = require("mongoose");

const attendanceLogSchema = new mongoose.Schema(
  {
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    otpId:       { type: mongoose.Schema.Types.ObjectId, ref: "OTP",     default: null },

    // ── Outcome ──────────────────────────────────────────────
    // Success        → OTP valid + inside geofence
    // Out-of-Bounds  → OTP valid but student outside campus radius
    // Spoof-Attempt  → Mock location or proxy detected
    // Invalid-OTP    → Wrong/expired OTP code
    status: {
      type: String,
      enum: ["Success", "Out-of-Bounds", "Spoof-Attempt", "Invalid-OTP"],
      required: true,
    },

    // ── Location snapshot at moment of submission ─────────────
    latitude:        { type: Number, default: null },
    longitude:       { type: Number, default: null },
    distanceMeters:  { type: Number, default: null },   // distance from campus gate
    isMockLocation:  { type: Boolean, default: false },
    isProxy:         { type: Boolean, default: false },
    accuracy:        { type: Number, default: null },   // GPS accuracy in metres

    // ── Context ───────────────────────────────────────────────
    date:      { type: String, required: true },        // YYYY-MM-DD
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    message:   { type: String, default: "" },           // human-readable reason
  },
  { timestamps: true }
);

// Index for fast violation queries
attendanceLogSchema.index({ status: 1, createdAt: -1 });
attendanceLogSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model("AttendanceLog", attendanceLogSchema);
