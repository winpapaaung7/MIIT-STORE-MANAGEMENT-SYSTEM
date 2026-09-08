export const ROLE_CODES = ["ADMIN", "DEPARTMENT_HEAD", "LAPTOP_RENTAL"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export type AuthenticatedUserRole = { id: number; code: RoleCode; name: string };
export type AuthenticatedUserDepartment = { id: number; name: string; code: string };
export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: AuthenticatedUserRole;
  department: AuthenticatedUserDepartment | null;
};
