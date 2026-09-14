import nodemailer from "nodemailer";

/**
 * Shared Gmail OTP send — used by Vite dev middleware and Vercel /api/send-otp.
 */
export async function sendOtpMail({ user, pass, to, name, otp }) {
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
}

export function parseOtpPayload(body) {
  const to = String(body?.to || "").trim().toLowerCase();
  const name = String(body?.name || "Doctor").trim();
  const otp = String(body?.otp || "").trim();
  if (!to || !/^\d{6}$/.test(otp)) {
    return { ok: false, error: "INVALID_PAYLOAD" };
  }
  return { ok: true, to, name, otp };
}
