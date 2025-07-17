const express = require('express');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const Loan = require('./models/Loan');
const { sendEmail } = require('./utils/email');
const { sendOtp, verifyOtp } = require('./utils/otp');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Connection error:', err));

const app = express();


// Your routes and other server logic go here...

module.exports = app;;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, and PNG files are allowed'));
  }
}).fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'proofOfIncome', maxCount: 1 }
]);

// Routes
app.post('/api/send-otp', async (req, res) => {
  try {
    const otp = await sendOtp(req.body.phone);
    res.json({ success: true, otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const isValid = await verifyOtp(req.body.phone, req.body.otp);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const files = req.files;
    const fileUrls = {};

    if (files.idDocument) {
      fileUrls.idDocument = `https://${req.get('host')}/uploads/${files.idDocument[0].filename}`;
    }

    if (files.proofOfIncome) {
      fileUrls.proofOfIncome = `https://${req.get('host')}/uploads/${files.proofOfIncome[0].filename}`;
    }

    res.json(fileUrls);
  });
});

app.post('/api/loans', async (req, res) => {
  try {
    const loan = new Loan({
      ...req.body,
      status: 'pending',
      appliedDate: new Date()
    });

    await loan.save();

    // Send confirmation email
    await sendEmail({
      to: req.body.email,
      subject: 'Loan Application Received',
      html: `
        <h2>Thank you for your application!</h2>
        <p>Your application ID: <strong>${loan._id}</strong></p>
        <p>We will review your application and get back to you within 2 business days.</p>
      `
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/loans', async (req, res) => {
  try {
    const loans = await Loan.find();
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // In production, use proper credentials validation
  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Verify Token Middleware
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) return res.status(403).send('Invalid token');
    next();
  });
}

// Admin Routes
app.get('/api/admin/loans', authenticateAdmin, async (req, res) => {
  try {
    const loans = await Loan.find().sort({ appliedDate: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/loans/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    res.json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/admin/loans/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason: req.body.reason 
      },
      { new: true }
    );
    res.json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});