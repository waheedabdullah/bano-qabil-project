import nodemailer from "nodemailer";

export const config = {
  runtime: "nodejs",
  maxDuration: 15,
};

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/**
 * Vercel serverless — POST /api/send-otp
 * Env (Production/Preview runtime): GMAIL_USER, GMAIL_APP_PASSWORD
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const user = clean(process.env.GMAIL_USER);
  const pass = clean(process.env.GMAIL_APP_PASSWORD);

  if (!user || !pass) {
    const missing = [];
    if (!user) missing.push("GMAIL_USER");
    if (!pass) missing.push("GMAIL_APP_PASSWORD");
    const relatedKeys = Object.keys(process.env).filter((key) =>
      /gmail|mail|smtp/i.test(key)
    );
    res.status(503).json({
      error: "EMAIL_NOT_CONFIGURED",
      missing,
      relatedKeys,
      envCount: Object.keys(process.env).length,
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  body = body || {};

  const to = String(body.to || "").trim().toLowerCase();
  const name = String(body.name || "Doctor").trim();
  const otp = String(body.otp || "").trim();

  if (!to || !/^\d{6}$/.test(otp)) {
    res.status(400).json({ error: "INVALID_PAYLOAD" });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Al Shifa Clinic" <${user}>`,
      to,
      subject: "Al Shifa Clinic — verification code",
      text: `Hello ${name},\n\nYour Al Shifa Clinic verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
      html: `
        <p>Hello ${name},</p>
        <p>Your <strong>Al Shifa Clinic</strong> verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    res.status(200).json({ sent: true });
  } catch (err) {
    console.error("OTP email failed:", err?.message || err);
    res.status(500).json({
      error: "EMAIL_SEND_FAILED",
      detail: err?.message || "send failed",
    });
  }
}
