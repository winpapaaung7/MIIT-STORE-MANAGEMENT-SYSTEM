import { Router, type Request, type Response } from "express";
import { createAccessToken, createRefreshToken, hashRefreshToken, normalizeEmail, toAuthenticatedUser, verifyAccessToken, verifyPassword } from "../auth/service.js";
import { createChallengeId, createOtp, hashOtp, otpExpiresMs, otpMatches, otpResendMs, sendLoginOtp, smtpConfigured } from "../auth/otp.js";

const REFRESH_COOKIE = "miit_refresh";
const DEFAULT_REFRESH_TOKEN_DAYS = 30;
const refreshTokenDays = Number(process.env.AUTH_REFRESH_TOKEN_DAYS ?? DEFAULT_REFRESH_TOKEN_DAYS);
const refreshLifetimeMs =
  (Number.isFinite(refreshTokenDays) && refreshTokenDays > 0
    ? refreshTokenDays
    : DEFAULT_REFRESH_TOKEN_DAYS) *
  24 *
  60 *
  60 *
  1000;
const userInclude = { role: true, department: true };
const attempts = new Map<string, number[]>();
function rateLimit(req: Request, res: Response, key: string, limit: number) { const now = Date.now(), windowMs = 15 * 60_000, values = (attempts.get(key) ?? []).filter((time) => time > now - windowMs); if (values.length >= limit) { res.status(429).json({ ok: false, message: "Too many requests. Please try again later." }); return false; } values.push(now); attempts.set(key, values); return true; }
function clientIp(req: Request) { return req.ip || req.socket.remoteAddress || "unknown"; }
function readCookie(req: Request, name: string) { const entry = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null; }
function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  });
}
function clearRefreshCookie(res: Response) { res.clearCookie(REFRESH_COOKIE, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth" }); }
async function issueSession(prisma: any, user: any, res: Response, expiresAt = new Date(Date.now() + refreshLifetimeMs)) { const refreshToken = createRefreshToken(); await prisma.refresh_token.create({ data: { user_id: user.user_id, token_hash: hashRefreshToken(refreshToken), expires_at: expiresAt } }); setRefreshCookie(res, refreshToken, expiresAt); return { ok: true, accessToken: createAccessToken(user.user_id), user: toAuthenticatedUser(user) }; }
async function createAndSendChallenge(prisma: any, user: any, ip: string) {
  if (!smtpConfigured()) throw new Error("SMTP is not configured");
  const challengeId = createChallengeId(), otp = createOtp(), now = new Date(), expiresAt = new Date(now.getTime() + otpExpiresMs());
  await prisma.$transaction(async (tx: any) => { await tx.otp_challenge.updateMany({ where: { user_id: user.user_id, used_at: null }, data: { used_at: now } }); await tx.otp_challenge.deleteMany({ where: { expires_at: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } }); await tx.otp_challenge.create({ data: { otp_challenge_id: challengeId, user_id: user.user_id, otp_hash: hashOtp(challengeId, otp), expires_at: expiresAt, resend_available_at: new Date(now.getTime() + otpResendMs()), request_ip: ip } }); });
  try { await sendLoginOtp(user.email, otp); } catch (error) { await prisma.otp_challenge.update({ where: { otp_challenge_id: challengeId }, data: { used_at: new Date() } }); throw error; }
  return { requiresOtp: true, challengeId, expiresIn: Math.floor(otpExpiresMs() / 1000), resendAfter: Math.floor(otpResendMs() / 1000) };
}
export function createAuthRouter(prisma: any) {
  const router = Router();
  router.post("/login", async (req, res) => { const email = normalizeEmail(req.body?.email), password = typeof req.body?.password === "string" ? req.body.password : "", ip = clientIp(req); if (!rateLimit(req, res, `login:ip:${ip}`, 30) || !rateLimit(req, res, `login:email:${email}`, 10)) return; if (!email || !password) return res.status(400).json({ ok: false, message: "Email and password are required" }); try { const user = await prisma.users.findUnique({ where: { email }, include: userInclude }); if (!user || user.status.toLowerCase() !== "active" || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ ok: false, message: "Invalid email or password" }); try { toAuthenticatedUser(user); } catch { return res.status(403).json({ ok: false, message: "Account role assignment is invalid" }); } return res.json(await createAndSendChallenge(prisma, user, ip)); } catch (error) { console.error("OTP login request failed", error instanceof Error ? error.message : "unknown error"); return res.status(503).json({ ok: false, message: "Email verification is temporarily unavailable" }); } });
  router.post("/verify-otp", async (req, res) => { const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId.trim() : "", otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "", ip = clientIp(req); if (!rateLimit(req, res, `verify:ip:${ip}`, 40) || !rateLimit(req, res, `verify:challenge:${challengeId}`, 15)) return; if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(otp)) return res.status(400).json({ ok: false, message: "Invalid verification request" }); try { const response = await prisma.$transaction(async (tx: any) => { const challenge = await tx.otp_challenge.findUnique({ where: { otp_challenge_id: challengeId }, include: { user: { include: userInclude } } }); if (!challenge || challenge.used_at || challenge.expires_at <= new Date() || challenge.attempt_count >= challenge.max_attempts) throw new Error("INVALID_OTP"); if (!otpMatches(challengeId, otp, challenge.otp_hash)) { await tx.otp_challenge.update({ where: { otp_challenge_id: challengeId }, data: { attempt_count: { increment: 1 } } }); throw new Error("INVALID_OTP"); } if (challenge.user.status.toLowerCase() !== "active") throw new Error("INVALID_OTP"); await tx.otp_challenge.update({ where: { otp_challenge_id: challengeId }, data: { used_at: new Date() } }); return issueSession(tx, challenge.user, res); }); return res.json(response); } catch (error) { if (error instanceof Error && error.message === "INVALID_OTP") return res.status(401).json({ ok: false, message: "Invalid or expired verification code" }); return res.status(500).json({ ok: false, message: "Unable to verify code" }); } });
  router.post("/resend-otp", async (req, res) => { const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId.trim() : "", ip = clientIp(req); if (!rateLimit(req, res, `resend:${ip}:${challengeId}`, 5)) return; if (!/^[a-f0-9]{64}$/.test(challengeId)) return res.status(400).json({ ok: false, message: "Invalid verification request" }); try { const challenge = await prisma.otp_challenge.findUnique({ where: { otp_challenge_id: challengeId }, include: { user: { include: userInclude } } }); if (!challenge || challenge.used_at || challenge.expires_at <= new Date() || challenge.user.status.toLowerCase() !== "active") return res.status(401).json({ ok: false, message: "Invalid or expired verification code" }); const wait = challenge.resend_available_at.getTime() - Date.now(); if (wait > 0) return res.status(429).json({ ok: false, message: "Please wait before requesting another code", resendAfter: Math.ceil(wait / 1000) }); return res.json(await createAndSendChallenge(prisma, challenge.user, ip)); } catch (error) { console.error("OTP resend failed", error instanceof Error ? error.message : "unknown error"); return res.status(503).json({ ok: false, message: "Email verification is temporarily unavailable" }); } });
  router.post("/refresh", async (req, res) => { const token = readCookie(req, REFRESH_COOKIE); if (!token) return res.status(401).json({ ok: false, message: "Refresh session is required" }); try { const stored = await prisma.refresh_token.findUnique({ where: { token_hash: hashRefreshToken(token) }, include: { user: { include: userInclude } } }); if (!stored || stored.revoked_at || stored.expires_at <= new Date() || stored.user.status.toLowerCase() !== "active") { clearRefreshCookie(res); return res.status(401).json({ ok: false, message: "Refresh session is invalid" }); } await prisma.refresh_token.update({ where: { refresh_token_id: stored.refresh_token_id }, data: { revoked_at: new Date() } }); return res.json(await issueSession(prisma, stored.user, res, stored.expires_at)); } catch { return res.status(500).json({ ok: false, message: "Unable to refresh session" }); } });
  router.get("/me", async (req, res) => { const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "", userId = token ? verifyAccessToken(token) : null; if (!userId) return res.status(401).json({ ok: false, message: "Authentication is required" }); try { const user = await prisma.users.findUnique({ where: { user_id: userId }, include: userInclude }); if (!user || user.status.toLowerCase() !== "active") return res.status(401).json({ ok: false, message: "Authentication is required" }); return res.json({ ok: true, user: toAuthenticatedUser(user) }); } catch { return res.status(403).json({ ok: false, message: "User role is not authorized" }); } });
  router.post("/logout", async (req, res) => { const token = readCookie(req, REFRESH_COOKIE); if (token) await prisma.refresh_token.updateMany({ where: { token_hash: hashRefreshToken(token), revoked_at: null }, data: { revoked_at: new Date() } }); clearRefreshCookie(res); return res.json({ ok: true }); });
  return router;
}
