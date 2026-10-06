import { Building2, FileText, Laptop, LayoutDashboard, Package, Settings, UsersRound, type LucideIcon } from "lucide-react";
import type { AuthenticatedUser } from "@/auth/AuthContext";
export type RoleCode = AuthenticatedUser["role"]["code"];
export type RoutePermission = { path: string; label: string; labelByRole?: Partial<Record<RoleCode, string>>; icon: LucideIcon; roles: RoleCode[]; sidebar?: boolean };
export const defaultRoute: Record<RoleCode, string> = { ADMIN: "/", DEPARTMENT_HEAD: "/my-department", LAPTOP_RENTAL: "/laptop-rental" };
export const routePermissions: RoutePermission[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { path: "/inventory", label: "Inventory", icon: Package, roles: ["ADMIN"] },
  { path: "/my-department", label: "My Department", icon: Building2, roles: ["DEPARTMENT_HEAD"] },
  { path: "/accessories", label: "Item details", icon: FileText, roles: ["ADMIN", "DEPARTMENT_HEAD", "LAPTOP_RENTAL"] },
  { path: "/laptop-rental", label: "Laptop Rental", icon: Laptop, roles: ["ADMIN", "LAPTOP_RENTAL"] },
  { path: "/rental-dashboard", label: "My Department", icon: LayoutDashboard, roles: ["LAPTOP_RENTAL"] },
  { path: "/departments", label: "Departments", icon: Building2, roles: ["ADMIN"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "DEPARTMENT_HEAD", "LAPTOP_RENTAL"] },
  { path: "/users", label: "Users", icon: UsersRound, roles: ["ADMIN"] },
  { path: "/students", label: "Students", icon: UsersRound, roles: ["LAPTOP_RENTAL"], sidebar: false },
  { path: "/teachers", label: "Teachers", icon: UsersRound, roles: ["LAPTOP_RENTAL"], sidebar: false },
  { path: "/returns", label: "Returns", icon: Laptop, roles: ["LAPTOP_RENTAL"], sidebar: false },
];
export function allowedNavigation(user: AuthenticatedUser) {
  const routes = routePermissions.filter((route) => route.sidebar !== false && route.roles.includes(user.role.code));
  if (user.role.code !== "LAPTOP_RENTAL") return routes;

  const rentalSidebarOrder = ["/rental-dashboard", "/laptop-rental", "/accessories", "/settings"];
  return [...routes].sort((left, right) => rentalSidebarOrder.indexOf(left.path) - rentalSidebarOrder.indexOf(right.path));
}
export function rolesFor(path: string) { return routePermissions.find((route) => route.path === path)?.roles ?? []; }
