import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import DepartmentRoomsPage from "./DepartmentRoomsPage";

/** Department Heads can open only the department assigned to their account. */
export default function MyDepartmentPage() {
  const { user } = useAuth();

  if (!user?.department) return <Navigate to="/forbidden" replace />;

  return <DepartmentRoomsPage departmentId={user.department.id} ownDepartment />;
}
