const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username:           { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:           { type: String, required: true, minlength: 3, select: false },
  role:               { type: String, enum: ["admin","teacher","student"], required: true },
  name:               { type: String, required: true, trim: true },
  studentRef:         { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
  teacherRef:         { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
