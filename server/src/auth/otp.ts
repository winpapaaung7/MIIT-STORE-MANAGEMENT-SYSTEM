import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

const number = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; };
export const otpExpiresMs = () => number(process.env.OTP_EXPIRES_MINUTES, 5) * 60_000;
export const otpResendMs = () => number(process.env.OTP_RESEND_SECONDS, 60) * 1_000;
const otpSecret = () => process.env.AUTH_OTP_SECRET || process.env.AUTH_ACCESS_TOKEN_SECRET || "";
export const createOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const createChallengeId = () => randomBytes(32).toString("hex");
export const hashOtp = (challengeId: string, otp: string) => {
  const secret = otpSecret();
  if (secret.length < 32) throw new Error("AUTH_OTP_SECRET or AUTH_ACCESS_TOKEN_SECRET must be at least 32 characters");
  return createHmac("sha256", secret).update(`${challengeId}:${otp}`).digest("hex");
};
export const otpMatches = (challengeId: string, otp: string, hash: string) => {
  const candidate = hashOtp(challengeId, otp);
  return candidate.length === hash.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
};
export function smtpConfigured() { return ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].every((key) => Boolean(process.env[key])); }
export async function sendLoginOtp(to: string, otp: string) {
  if (!smtpConfigured()) throw new Error("SMTP is not configured");
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: "MIIT Store verification code", text: `Your MIIT Store verification code is ${otp}. It expires in ${Math.round(otpExpiresMs() / 60_000)} minutes. Do not share this code.`, html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2 style="color:#047857">MIIT Store Management</h2><p>Use this verification code to complete your sign in:</p><p style="font-size:30px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in ${Math.round(otpExpiresMs() / 60_000)} minutes. Do not share it with anyone.</p></div>` });
}
