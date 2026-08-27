import { NavLink } from "react-router-dom";
import {
  Package,
  FileText,
  Laptop,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Building2,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import msmLogo from "@/assets/MSM logo_r.png";

// Note:alert
// everytime u add a new route in the AppRoutes.tsx file, you need to add a new item in the menuItems array below. The title is the text that will be displayed in the sidebar, the icon is the icon that will be displayed in the sidebar, and the to is the route that will be navigated to when the item is clicked.

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    to: "/",
  },
  {
    title: "Inventory",
    icon: Package,
    to: "/inventory",
  },
  {
    title: "Accessories Detail",
    icon: FileText,
    to: "/accessories",
  },
  {
    title: "Laptop Rental Service",
    icon: Laptop,
    to: "/laptop-rental",
  },
  {
    title: "Department",
    icon: Building2,
    to: "/departments",
  },
  {
    title: "Settings",
    icon: Settings,
    to: "/Settings",
  },
];

export function Sidebar({ collapsed, onCollapsedChange }: { collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void }) {

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-[#111827] bg-[#050814] p-[clamp(0.75rem,2vh,1rem)] text-slate-300 transition-all duration-200 ${
        collapsed ? "w-16" : "w-[260px]"
      }`}
    >
      {/* header part, i mean the top section with miit storage text */}
      <div className="min-h-0">
        <div className="flex items-center justify-between px-1 py-2">
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2.5">
              <img src={msmLogo} alt="MSM logo" className="h-8 w-8 shrink-0 object-contain" />
              <h1 className="truncate text-lg font-bold tracking-wide text-[#f59e0b]">MIIT Store</h1>
            </div>
          )}

          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="rounded-md p-1 hover:bg-[#0f172a]/40"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* user profile part and we will add the user profile later */}
        {collapsed ? (
          <div className="flex justify-center my-3 h-16 items-center">
            <div className="w-10 h-10 rounded-full bg-[#0f172a]/60 border border-[#1e293b]/50 flex items-center justify-center">
              <User size={18} />
            </div>
          </div>
        ) : (
          <div className="mx-1 my-3 p-3 h-16 rounded-lg bg-[#0f172a]/60 border border-[#1e293b]/50">
            <p className="text-[10px] font-bold text-[#f59e0b] uppercase">
              Administrator
            </p>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              Full System Access
            </p>
          </div>
        )}

        {/* navigation menu to our screens, ask me directly in the telegram group if u dont know how to add route here */}
        <nav className="mt-[clamp(0.25rem,1vh,0.5rem)] space-y-[clamp(0.25rem,0.8vh,0.375rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.title}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex h-[clamp(2.25rem,5.1vh,2.75rem)] items-center rounded-lg transition-colors ${
                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                  } ${
                    isActive
                      ? "text-white font-medium bg-[#0f172a]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#0f172a]/40"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-slate-400"}
                    />

                    {!collapsed && (
                      <span className="text-[13px]">{item.title}</span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="absolute left-full ml-3 whitespace-nowrap rounded bg-[#0f172a] px-2 py-1 text-sm text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.title}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* footer of the sidebar with the sign out button */}
      <div className="mt-auto px-1 pb-0 pt-3">
        <button
          className={`w-full flex items-center justify-center gap-2 rounded-lg border border-[#1e293b] py-2 text-[13px] text-slate-300 font-medium hover:bg-[#0f172a]/50 transition-colors ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut size={18} />

          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
