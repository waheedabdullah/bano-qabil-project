import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import nodemailer from "nodemailer";

function otpEmailApi() {
  return {
    name: "otp-email-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");

      server.middlewares.use("/api/send-otp", (req, res, next) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        let raw = "";
        req.on("data", (chunk) => {
          raw += chunk;
        });
        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json");

          const user = env.GMAIL_USER?.trim();
          const pass = env.GMAIL_APP_PASSWORD?.trim();
          if (!user || !pass) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: "EMAIL_NOT_CONFIGURED" }));
            return;
          }

          try {
            const body = JSON.parse(raw || "{}");
            const to = String(body.to || "").trim().toLowerCase();
            const name = String(body.name || "Doctor").trim();
            const otp = String(body.otp || "").trim();

            if (!to || !/^\d{6}$/.test(otp)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "INVALID_PAYLOAD" }));
              return;
            }

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

            res.statusCode = 200;
            res.end(JSON.stringify({ sent: true }));
          } catch (err) {
            console.error("OTP email failed:", err?.message || err);
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: "EMAIL_SEND_FAILED",
                detail: err?.message || "send failed",
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), otpEmailApi()],
  server: {
    watch: {
      usePolling: true,
      ignored: ["**/node_modules/**", "**/.git/**"],
    },
  },
});
