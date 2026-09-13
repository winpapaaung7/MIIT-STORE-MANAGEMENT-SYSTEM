import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import msmLogo from "@/assets/MSM logo_r.png";
import { useAuth } from "@/auth/AuthContext";
import { allowedNavigation } from "@/routes/routePermissions";
import { API_BASE_URL } from "@/lib/api";
export function Sidebar({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const { user, signOut } = useAuth(),
    navigate = useNavigate();
  const menuItems = user ? allowedNavigation(user) : [];
  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      signOut();
      navigate("/login", { replace: true });
    }
  }
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-[#111827] bg-[#050814] p-[clamp(0.75rem,2vh,1rem)] text-slate-300 transition-all duration-200 ${collapsed ? "w-16" : "w-[260px]"}`}
    >
      <div className="min-h-0">
        <div className="flex items-center justify-between px-1 py-2">
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={msmLogo}
                alt="MIIT Store logo"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <h1 className="truncate text-lg font-bold tracking-wide text-[#f59e0b]">
                MIIT Store
              </h1>
            </div>
          )}
          <button
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => onCollapsedChange(!collapsed)}
            className="rounded-md p-1 hover:bg-[#0f172a]/40"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <div
          className={`mx-1 my-3 rounded-lg border border-[#1e293b]/50 bg-[#0f172a]/60 ${collapsed ? "flex h-16 items-center justify-center" : "h-16 p-3"}`}
        >
          {collapsed ? (
            <User size={18} />
          ) : (
            <>
              <p className="truncate text-[10px] font-bold uppercase text-[#f59e0b]">
                {user?.role.name}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-300">
                {user?.name}
              </p>
            </>
          )}
        </div>
        <nav className="mt-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon,
              label = item.labelByRole?.[user!.role.code] ?? item.label;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `group relative flex h-11 items-center rounded-lg transition-colors ${collapsed ? "justify-center" : "gap-3 px-3"} ${isActive ? "bg-[#0f172a] font-medium text-white" : "text-slate-400 hover:bg-[#0f172a]/40 hover:text-slate-200"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-slate-400"}
                    />
                    {!collapsed && <span className="text-[13px]">{label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded bg-[#0f172a] px-2 py-1 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto px-1 pb-0 pt-3">
        <button
          onClick={() => void logout()}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[#1e293b] py-2 text-[13px] font-medium text-slate-300 transition hover:bg-[#0f172a]/50 ${collapsed ? "px-0" : ""}`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
