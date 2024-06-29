const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the MonthlyOfferings schema
const expenseSchema = new Schema({
  category: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
 image: { type: Buffer },
}, { timestamps: true });

// Create the MonthlyOfferings model
const expense = mongoose.model('expense', expenseSchema);

module.exports = expense;
