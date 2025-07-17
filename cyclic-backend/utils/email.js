const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"Trust Fund Loan" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

module.exports = { sendEmail };