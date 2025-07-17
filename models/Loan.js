const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  currency: { 
    type: String, 
    required: true,
    enum: ['USD', 'ZAR', 'BBD', 'EUR']
  },
  amount: { type: Number, required: true },
  term: { type: Number, required: true },
  purpose: { type: String, required: true },
  documents: {
    idDocument: String,
    proofOfIncome: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', LoanSchema);