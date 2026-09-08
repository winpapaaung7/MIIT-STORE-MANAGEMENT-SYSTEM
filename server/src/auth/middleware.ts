import type { NextFunction, Request, Response } from "express";
import { toAuthenticatedUser, verifyAccessToken } from "./service.js";
import type { AuthenticatedUser, RoleCode } from "./types.js";

declare global { namespace Express { interface Request { auth?: AuthenticatedUser; } } }

const include = { role: true, department: true };
export function requireAuth(prisma: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
    const userId = token ? verifyAccessToken(token) : null;
    if (!userId) return res.status(401).json({ ok: false, message: "Authentication is required" });
    try {
      const user = await prisma.users.findUnique({ where: { user_id: userId }, include });
      if (!user || user.status.toLowerCase() !== "active") return res.status(401).json({ ok: false, message: "Authentication is required" });
      req.auth = toAuthenticatedUser(user);
      return next();
    } catch { return res.status(403).json({ ok: false, message: "User is not authorized" }); }
  };
}
export const allowRoles = (...roles: RoleCode[]) => (req: Request, res: Response, next: NextFunction) =>
  !req.auth ? res.status(401).json({ ok: false, message: "Authentication is required" }) : roles.includes(req.auth.role.code) ? next() : res.status(403).json({ ok: false, message: "Permission denied" });

export function requireDepartmentScope(requestedDepartmentId: number | null | undefined, res: Response, auth?: AuthenticatedUser) {
  if (!auth || auth.role.code !== "DEPARTMENT_HEAD") return true;
  if (requestedDepartmentId !== auth.department?.id) { res.status(404).json({ ok: false, message: "Record not found" }); return false; }
  return true;
}

// One centralized endpoint policy. Controllers only add data scope checks where needed.
export function apiAuthorization(prisma: any) {
  const authenticate = requireAuth(prisma);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/accessories/by-code/" || req.path.startsWith("/accessories/by-code/")) return next(); // Flutter scanner: intentionally public read-only lookup.
    await authenticate(req, res, () => {
      const role = req.auth!.role.code;
      if (role === "ADMIN") return next();
      const rental = req.path.startsWith("/laptop-rentals") || req.path.startsWith("/students") || req.path.startsWith("/teachers");
      if (role === "LAPTOP_RENTAL" && rental) return next();
      const headRead = req.method === "GET" && (req.path.startsWith("/dashboard") || req.path === "/items" || req.path === "/item-details" || req.path === "/departments" || req.path.startsWith("/qr-codes/") || req.path.startsWith("/transfers"));
      const headTransfer = req.method === "POST" && req.path === "/transfers";
      if (role === "DEPARTMENT_HEAD" && (headRead || headTransfer)) return next();
      return res.status(403).json({ ok: false, message: "Permission denied" });
    });
  };
}
