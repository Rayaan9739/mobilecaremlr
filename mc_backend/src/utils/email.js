const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
const SMTP_PASS = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : "";
const EMAIL_FROM = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : "";

function isEmailConfigured() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && EMAIL_FROM);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: String(SMTP_PORT) === "465",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function verifyTransporterOnStartup() {
  if (!isEmailConfigured()) {
    console.warn(
      "⚠️ Email not configured. Set EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
    );
    return;
  }

  try {
    await transporter.verify();
    console.log("✅ SMTP transporter verified");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ SMTP transporter verification failed:", message);
  }
}

// Fire-and-forget startup verification (does not block server startup)
// eslint-disable-next-line unicorn/prefer-top-level-await
verifyTransporterOnStartup();

async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email service not configured (EMAIL_FROM/SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)",
    );
  }

  const payload = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
  };

  const attemptSend = async (attemptNo) => {
    try {
      const info = await transporter.sendMail(payload);
      console.log("✅ Email sent:", {
        to,
        subject,
        messageId: info?.messageId,
        attempt: attemptNo,
      });
      return info;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ Email send failed:", { to, subject, attempt: attemptNo, message });
      throw new Error(message || "Failed to send email");
    }
  };

  try {
    return await attemptSend(1);
  } catch (error) {
    // Retry once
    return attemptSend(2);
  }
}

module.exports = { sendEmail };

