import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { AuthenticatedUser, RoleCode } from "./types.js";

const scrypt = promisify(scryptCallback);
const tokenSecret = () => {
  const value = process.env.AUTH_ACCESS_TOKEN_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_ACCESS_TOKEN_SECRET must be at least 32 characters");
  return value;
};
export const normalizeEmail = (email: unknown) => typeof email === "string" ? email.trim().toLowerCase() : "";
export const hashRefreshToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const createRefreshToken = () => randomBytes(48).toString("base64url");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  const saved = Buffer.from(hash, "hex");
  return saved.length === derived.length && timingSafeEqual(saved, derived);
}

type AccessPayload = { sub: number; exp: number };
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
export function createAccessToken(userId: number) {
  const payload: AccessPayload = { sub: userId, exp: Math.floor(Date.now() / 1000) + 15 * 60 };
  const body = encode(payload);
  return `${body}.${createHmac("sha256", tokenSecret()).update(body).digest("base64url")}`;
}
export function verifyAccessToken(token: string): number | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AccessPayload; return payload.exp > Date.now() / 1000 && Number.isInteger(payload.sub) ? payload.sub : null; } catch { return null; }
}

export function toAuthenticatedUser(user: any): AuthenticatedUser {
  const code = user.role?.role_code as RoleCode | null;
  if (!code || !["ADMIN", "DEPARTMENT_HEAD", "LAPTOP_RENTAL"].includes(code)) throw new Error("User has no valid application role");
  if (code === "DEPARTMENT_HEAD" && (!user.department_id || !user.department_head_of_id || user.department_id !== user.department_head_of_id)) {
    throw new Error("Department head must be assigned to exactly one matching department");
  }
  return { id: user.user_id, name: user.full_name, email: user.email, role: { id: user.role.role_id, code, name: user.role.role_name }, department: user.department ? { id: user.department.department_id, name: user.department.department_name, code: user.department.department_code } : null };
}
