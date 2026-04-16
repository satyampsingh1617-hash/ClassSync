const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    // Subject name (display)
    subject:    { type: String, required: true, trim: true },
    // Subject reference — links to Subject collection
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    url:        { type: String, required: true, trim: true },
    class:      { type: String, required: true, trim: true },
    teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    description:{ type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
