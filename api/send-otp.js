import { parseOtpPayload, sendOtpMail } from "../server/sendOtpMail.js";

/**
 * Vercel serverless — POST /api/send-otp
 * Env: GMAIL_USER, GMAIL_APP_PASSWORD (Production + Preview)
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    res.status(503).json({ error: "EMAIL_NOT_CONFIGURED" });
    return;
  }

  const parsed = parseOtpPayload(req.body || {});
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    await sendOtpMail({
      user,
      pass,
      to: parsed.to,
      name: parsed.name,
      otp: parsed.otp,
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
