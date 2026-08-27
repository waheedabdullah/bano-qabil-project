/**
 * Send 6-digit OTP via local Vite API (Gmail SMTP in vite.config.js).
 */
export async function sendOtpEmail(toEmail, doctorName, otp) {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toEmail,
      name: doctorName,
      otp,
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.status === 503 || data.error === "EMAIL_NOT_CONFIGURED") {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  if (!res.ok || data.error) {
    const err = new Error("EMAIL_SEND_FAILED");
    err.code = "EMAIL_SEND_FAILED";
    err.detail = data.detail || data.error;
    throw err;
  }

  return { sent: true };
}
