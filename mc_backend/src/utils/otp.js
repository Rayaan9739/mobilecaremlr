const bcrypt = require("./bcrypt");
const twilio = require("twilio");
const prisma = require("./prisma");
const { sendEmail } = require("./email");

// Twilio client initialization with guard
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

const verifyOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};

const sendEmailOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Mobile Care - OTP Verification",
    html: `
      <h2>OTP Verification</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `,
  });
};

const sendPhoneOTP = async (phone, otp) => {
  if (!twilioClient) {
    console.warn("⚠️ Twilio not configured. Skipping SMS OTP to:", phone);
    return;
  }
  await twilioClient.messages.create({
    body: `Your Mobile Care login code is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

const createOTP = async (type, email = null, phone = null) => {
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete existing OTPs
  await prisma.oTP.deleteMany({
    where: {
      OR: [{ email: email }, { phone: phone }],
    },
  });

  // Create new OTP
  await prisma.oTP.create({
    data: {
      code: hashedOTP,
      type,
      email,
      phone,
      expiresAt,
    },
  });

  return otp;
};

const checkOTP = async (type, otp, email = null, phone = null, consume = false) => {
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      ...(type ? { type } : {}),
      OR: [{ email: email }, { phone: phone }],
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    throw new Error("OTP expired or not found");
  }

  if (otpRecord.attempts >= 3) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new Error("Too many attempts. Please request a new OTP.");
  }

  const isValid = await verifyOTP(otp, otpRecord.code);

  if (!isValid) {
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });
    throw new Error("Invalid OTP");
  }

  if (consume) {
    // Delete OTP after successful verification
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
  }
  return true;
};

const validateOTP = async (otp, email = null, phone = null) => {
  return checkOTP(null, otp, email, phone, true);
};

module.exports = {
  generateOTP,
  sendEmailOTP,
  sendPhoneOTP,
  createOTP,
  checkOTP,
  validateOTP,
};
