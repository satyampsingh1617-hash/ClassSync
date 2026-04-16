const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["General", "Urgent", "Event"],
      default: "General",
    },
    // 'All' means visible to all students; otherwise a specific class string e.g. 'SYCS'
    targetClass: {
      type: String,
      default: "All",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      default: "",
    },
    createdByRole: {
      type: String,
      enum: ["admin", "teacher"],
      default: "admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
