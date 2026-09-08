import { useState, type CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? "64px" : "260px";
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ "--sidebar-width": sidebarWidth } as CSSProperties}>
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />

      <main className="ml-[var(--sidebar-width)] min-h-screen min-w-0 bg-slate-100 p-4 transition-colors sm:p-6 dark:bg-[#020617]">
        <Outlet />
      </main>
    </div>
  );
}
