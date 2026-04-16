const mongoose = require("mongoose");

const readStatusSchema = new mongoose.Schema({
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Announcement",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  readAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index — prevents duplicate read records
readStatusSchema.index({ announcementId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ReadStatus", readStatusSchema);
