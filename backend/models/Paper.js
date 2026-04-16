const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    subject:     { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    class:       { type: String, default: "" },
    semester:    { type: String, default: "" },
    date:        { type: String, default: "" },
    duration:    { type: String, default: "" },
    totalMarks:  { type: Number, default: 0 },
    sections:    { type: Array,  default: [] },   // full sections array stored as-is
    syllabusText:{ type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paper", paperSchema);
