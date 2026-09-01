import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword, normalizeEmail } from "../auth/service.js";

const email = normalizeEmail(process.env.RESET_USER_EMAIL);
const password = process.env.RESET_USER_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !email || typeof password !== "string" || password.length < 12) {
  console.error("Safe error: set DATABASE_URL, RESET_USER_EMAIL, and a RESET_USER_PASSWORD of at least 12 characters.");
  process.exitCode = 1;
} else {
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { email }, select: { user_id: true } });
      if (!user) return "not-found" as const;
      await tx.users.update({ where: { user_id: user.user_id }, data: { password_hash: await hashPassword(password) } });
      await tx.refresh_token.updateMany({ where: { user_id: user.user_id, revoked_at: null }, data: { revoked_at: new Date() } });
      return "success" as const;
    });
    console.log(result === "success" ? "Password reset completed; active sessions were revoked." : "User not found.");
  } catch {
    console.error("Safe error: password reset could not be completed.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
