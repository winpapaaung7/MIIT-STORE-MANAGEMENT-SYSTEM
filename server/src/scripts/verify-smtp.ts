import "dotenv/config";
import nodemailer from "nodemailer";

const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"] as const;
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`SMTP configuration is missing: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transporter.verify();
    console.log("SMTP verification passed. The server can authenticate with the configured mail service.");
  } catch (error) {
    console.error("SMTP verification failed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
