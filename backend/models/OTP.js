const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    code:       { type: String, required: true },
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject",  required: true },
    teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: "Teacher",  required: true },
    date:       { type: String, required: true },
    expiry:     { type: Date,   required: true },
    isActive:   { type: Boolean, default: true },
    usedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    // ── Lecture details ──────────────────────────────────────
    topicName:  { type: String, default: "" },
    timeSlot:   { type: String, default: "" },
  },
  { timestamps: true }
);

otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
