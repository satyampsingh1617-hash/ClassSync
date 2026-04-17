const express  = require("express");
const router   = express.Router();
const { body } = require("express-validator");
const { createNote, getNotes, deleteNote } = require("../controllers/noteController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.post("/",
  protect, authorize("teacher", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title required"),
    body("subjectId").notEmpty().withMessage("Subject required"),
    body("url").trim().notEmpty().withMessage("URL required"),
  ],
  validate, createNote
);

router.get("/",  protect, authorize("teacher","student","admin"), getNotes);
router.delete("/:id", protect, authorize("teacher","admin"), deleteNote);

module.exports = router;
