import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { defaultRoute, type RoleCode } from "./routePermissions";
export function ProtectedRoute({ roles }: { roles?: RoleCode[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Checking your session…
      </div>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role.code === "DEPARTMENT_HEAD" && !user.department)
    return <Navigate to="/forbidden" replace />;
  if (roles && !roles.includes(user.role.code))
    return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
export function ForbiddenPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FB] p-6">
      <section className="max-w-md rounded-xl border border-[#DCE3ED] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#172033]">
          Access restricted
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          Your account does not have permission to view this page.
        </p>
        <Link
          to={defaultRoute[user.role.code]}
          className="mt-6 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
        >
          Go to my workspace
        </Link>
      </section>
    </main>
  );
}
export function RoleDefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={
        defaultRoute[user.role.code] === "/"
          ? "/dashboard"
          : defaultRoute[user.role.code]
      }
      replace
    />
  );
}
