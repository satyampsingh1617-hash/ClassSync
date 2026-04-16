require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
}));

// Body parsers — must come before routes
app.use(express.json({ strict: false, limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
      console.error("❌ MongoDB:", err.message);
      console.log("🔄 Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/students",      require("./routes/studentRoutes"));
app.use("/api/teachers",      require("./routes/teacherRoutes"));
app.use("/api/subjects",      require("./routes/subjectRoutes"));
app.use("/api/attendance",    require("./routes/attendanceRoutes"));
app.use("/api/otp",           require("./routes/otpRoutes"));
app.use("/api/admin",         require("./routes/adminRoutes"));
app.use("/api/notes",         require("./routes/noteRoutes"));
app.use("/api/papers",        require("./routes/paperRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/queries",       require("./routes/queryRoutes"));

app.get("/api/health", (_, res) => res.json({ success: true, message: "API running 🚀" }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Global error handler (must have 4 params)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON.' });
  }
  console.error("Global error:", err.message, err.stack?.split("\n")[0]);
  res.status(500).json({ success: false, message: "Internal server error.", detail: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
