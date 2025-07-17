const otpStore = new Map();
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000); // 4-digit code
}

function sendOtp(phone) {
  const otp = generateOtp();
  otpStore.set(phone, { otp, expires: Date.now() + OTP_EXPIRY });
  
  // In production: Integrate with SMS service like Twilio
  console.log(`OTP for ${phone}: ${otp}`);
  return otp;
}

function verifyOtp(phone, code) {
  const stored = otpStore.get(phone);
  
  if (!stored || stored.expires < Date.now()) {
    return false;
  }
  
  return stored.otp === parseInt(code);
}

module.exports = { sendOtp, verifyOtp };