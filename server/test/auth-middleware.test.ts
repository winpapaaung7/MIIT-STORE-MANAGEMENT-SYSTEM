import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowRoles, apiAuthorization, requireAuth, requireDepartmentScope } from "../src/auth/middleware.js";
import { createAccessToken } from "../src/auth/service.js";

process.env.AUTH_ACCESS_TOKEN_SECRET = "test-secret-that-is-at-least-thirty-two-characters-long";

const user = { user_id: 7, full_name: "Test Admin", email: "test@example.com", status: "Active", department_id: null, department_head_of_id: null, role: { role_id: 1, role_code: "ADMIN", role_name: "Administrator" }, department: null };
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() });

describe("authorization middleware (mocked Prisma)", () => {
  const prisma = { users: { findUnique: vi.fn() } };
  beforeEach(() => vi.clearAllMocks());

  it("rejects requests without a bearer token", async () => {
    const res = response();
    await requireAuth(prisma)({ headers: {} } as any, res as any, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("loads an active user from mocked Prisma and continues", async () => {
    prisma.users.findUnique.mockResolvedValue(user);
    const req: any = { headers: { authorization: `Bearer ${createAccessToken(7)}` } };
    const next = vi.fn();
    await requireAuth(prisma)(req, response() as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.auth.role.code).toBe("ADMIN");
  });

  it("enforces roles and department scope", () => {
    const res = response();
    allowRoles("ADMIN")({ auth: { role: { code: "LAPTOP_RENTAL" } } } as any, res as any, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(requireDepartmentScope(3, res as any, { role: { code: "DEPARTMENT_HEAD" }, department: { id: 2 } } as any)).toBe(false);
  });

  it("keeps the scanner lookup public", async () => {
    const next = vi.fn();
    await apiAuthorization(prisma)({ path: "/accessories/by-code/ABC", method: "GET", headers: {} } as any, response() as any, next);
    expect(next).toHaveBeenCalledOnce();
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
  });
});
