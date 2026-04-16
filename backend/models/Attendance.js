const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject",  required: true },
    date:       { type: String, required: true },           // YYYY-MM-DD
    status:     { type: String, enum: ["Present","Absent"], default: "Present" },
    markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
    method:     { type: String, enum: ["otp","manual"], default: "manual" },
    // ── Lecture details ──────────────────────────────────────
    topicName:  { type: String, default: "" },              // e.g. "Arrays & Pointers"
    timeSlot:   { type: String, default: "" },              // e.g. "9:00-10:00"
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
