import { Building2, FileText, Laptop, LayoutDashboard, Package, Settings, UsersRound, type LucideIcon } from "lucide-react";
import type { AuthenticatedUser } from "@/auth/AuthContext";
export type RoleCode = AuthenticatedUser["role"]["code"];
export type RoutePermission = { path: string; label: string; labelByRole?: Partial<Record<RoleCode, string>>; icon: LucideIcon; roles: RoleCode[] };
export const defaultRoute: Record<RoleCode, string> = { ADMIN: "/", DEPARTMENT_HEAD: "/", LAPTOP_RENTAL: "/laptop-rental" };
export const routePermissions: RoutePermission[] = [
  { path: "/", label: "Dashboard", labelByRole: { DEPARTMENT_HEAD: "Department Dashboard" }, icon: LayoutDashboard, roles: ["ADMIN", "DEPARTMENT_HEAD"] },
  { path: "/inventory", label: "Inventory", labelByRole: { DEPARTMENT_HEAD: "Department Inventory" }, icon: Package, roles: ["ADMIN", "DEPARTMENT_HEAD"] },
  { path: "/accessories", label: "Accessories", icon: FileText, roles: ["ADMIN", "DEPARTMENT_HEAD"] },
  { path: "/laptop-rental", label: "Laptop Rental", icon: Laptop, roles: ["ADMIN", "LAPTOP_RENTAL"] },
  { path: "/rental-dashboard", label: "Rental Dashboard", icon: LayoutDashboard, roles: ["LAPTOP_RENTAL"] },
  { path: "/departments", label: "Departments", icon: Building2, roles: ["ADMIN"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
  { path: "/users", label: "Users", icon: UsersRound, roles: ["ADMIN"] },
  { path: "/students", label: "Students", icon: UsersRound, roles: ["LAPTOP_RENTAL"] },
  { path: "/teachers", label: "Teachers", icon: UsersRound, roles: ["LAPTOP_RENTAL"] },
  { path: "/returns", label: "Returns", icon: Laptop, roles: ["LAPTOP_RENTAL"] },
  { path: "/transfers", label: "Transfers", icon: Building2, roles: ["DEPARTMENT_HEAD"] },
];
export function allowedNavigation(user: AuthenticatedUser) { return routePermissions.filter((route) => route.roles.includes(user.role.code)); }
export function rolesFor(path: string) { return routePermissions.find((route) => route.path === path)?.roles ?? []; }
