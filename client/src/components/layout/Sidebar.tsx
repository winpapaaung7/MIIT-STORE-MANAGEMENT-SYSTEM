import { useState } from "react";
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
} from "lucide-react";

// Note:alert
// everytime u add a new route in the AppRoutes.tsx file, you need to add a new item in the menuItems array below. The title is the text that will be displayed in the sidebar, the icon is the icon that will be displayed in the sidebar, and the to is the route that will be navigated to when the item is clicked.

const menuItems = [
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen bg-[#050814] text-slate-300 flex flex-col justify-between p-3 border-r border-[#111827] flex-shrink-0 transition-all duration-200 ${
        collapsed ? "w-16" : "w-[260px]"
      }`}
    >
      {/* header part, i mean the top section with miit storage text */}
      <div>
        <div className="flex items-center justify-between px-1 py-2">
          {!collapsed && (
            <h1 className="text-lg font-bold text-[#f59e0b] tracking-wide">
              MIIT Store
            </h1>
          )}

          <button
            onClick={() => setCollapsed((s) => !s)}
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
        <nav className="mt-2 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.title}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center h-11 rounded-lg transition-colors ${
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
      <div className="px-1 pb-2">
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
