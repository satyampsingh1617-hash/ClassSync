/**
 * seed.js — Run once to set up default admin
 * Usage: node seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/attendanceDB")
  .then(async () => {
    const db = mongoose.connection.db;

    // Drop all old indexes that may conflict, then recreate
    try { await db.collection("users").dropIndex("username_1");    } catch (_) {}
    try { await db.collection("students").dropIndex("roll_1");     } catch (_) {}

    // Recreate clean unique indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("students").createIndex({ roll: 1 }, { unique: true });
    console.log("✅ Indexes OK");

    // Upsert default admin PKC001 / PKC001
    const hash = await bcrypt.hash("PKC001", 12);
    await db.collection("users").updateOne(
      { username: "pkc001" },
      {
        $set: {
          username:           "pkc001",
          password:           hash,
          role:               "admin",
          name:               "Piyush",
          studentRef:         null,
          teacherRef:         null,
          mustChangePassword: false,
          updatedAt:          new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log("✅ Default admin ready  →  username: pkc001  |  password: PKC001");

    // Verify
    const user = await db.collection("users").findOne({ username: "pkc001" });
    const ok   = await bcrypt.compare("PKC001", user.password);
    console.log("✅ Password verify:", ok ? "PASS" : "FAIL");

    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
