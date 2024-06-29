const express = require("express");
const router = express.Router();
// const offeringsController = require('../controllers/Offerings');
const Expense = require("../controllers/Expense");
const multer = require("multer");
// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define routes for Offerings
router.post(
  "/add",
  upload.fields([{ name: "image", maxCount: 1 }]),
  Expense.addExpense
);
router.get('/category', Expense.getExpenseByCategoryAndDate);
router.get("/categories", Expense.getDistinctCategories);
router.get("/:id", Expense.getSingleExpense);
router.get('/member/verify/:id', Expense.verifyMember);



module.exports = router;
