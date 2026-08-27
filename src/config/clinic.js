/** Clinic display */
export const CLINIC_NAME = "Al Shifa Clinic";

/**
 * OTP emails go through Vite /api/send-otp (Gmail SMTP).
 * Put these in hospital-clinic/.env (no VITE_ prefix):
 *   GMAIL_USER=your@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */
export function emailConfigured() {
  // Client cannot read GMAIL_* — server checks. Always attempt send.
  return true;
}
