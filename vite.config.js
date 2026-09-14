import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { parseOtpPayload, sendOtpMail } from "./server/sendOtpMail.js";

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
            const parsed = parseOtpPayload(body);
            if (!parsed.ok) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: parsed.error }));
              return;
            }

            await sendOtpMail({
              user,
              pass,
              to: parsed.to,
              name: parsed.name,
              otp: parsed.otp,
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
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    },
  },
});
