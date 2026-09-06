import { NavLink } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight, FileText, Laptop, LayoutDashboard, LogOut, Package, Settings, User } from "lucide-react";

import msmLogo from "@/assets/MSM logo_r.png";
import { type TranslationKey, useLanguage } from "@/context/LanguageContext";

const menuItems: { title: TranslationKey; icon: typeof Package; to: string }[] = [
  { title: "dashboard", icon: LayoutDashboard, to: "/" },
  { title: "inventory", icon: Package, to: "/inventory" },
  { title: "accessories", icon: FileText, to: "/accessories" },
  { title: "laptopRental", icon: Laptop, to: "/laptop-rental" },
  { title: "department", icon: Building2, to: "/departments" },
  { title: "settings", icon: Settings, to: "/Settings" },
];

export function Sidebar({ collapsed, onCollapsedChange }: { collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void }) {
  const { t } = useLanguage();

  return <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-[#111827] bg-[#050814] p-[clamp(0.75rem,2vh,1rem)] text-slate-300 transition-all duration-200 ${collapsed ? "w-16" : "w-[260px]"}`}>
    <div className="min-h-0">
      <div className="flex items-center justify-between px-1 py-2">
        {!collapsed && <div className="flex min-w-0 items-center gap-2.5"><img src={msmLogo} alt="MSM logo" className="h-8 w-8 shrink-0 object-contain" /><h1 className="truncate text-lg font-bold tracking-wide text-[#f59e0b]">MIIT Store</h1></div>}
        <button aria-label="Toggle sidebar" onClick={() => onCollapsedChange(!collapsed)} className="rounded-md p-1 hover:bg-[#0f172a]/40">{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
      </div>

      {collapsed ? <div className="my-3 flex h-16 items-center justify-center"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1e293b]/50 bg-[#0f172a]/60"><User size={18} /></div></div> : <div className="mx-1 my-3 h-16 rounded-lg border border-[#1e293b]/50 bg-[#0f172a]/60 p-3"><p className="text-[10px] font-bold uppercase text-[#f59e0b]">{t("administrator")}</p><p className="mt-1 text-xs font-semibold text-slate-300">{t("fullSystemAccess")}</p></div>}

      <nav className="mt-[clamp(0.25rem,1vh,0.5rem)] space-y-[clamp(0.25rem,0.8vh,0.375rem)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.title);
          return <NavLink key={item.title} to={item.to} className={({ isActive }) => `group relative flex h-[clamp(2.25rem,5.1vh,2.75rem)] items-center rounded-lg transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${isActive ? "bg-[#0f172a] font-medium text-white" : "text-slate-400 hover:bg-[#0f172a]/40 hover:text-slate-200"}`}>
            {({ isActive }) => <><Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />{!collapsed && <span className="text-[13px]">{label}</span>}{collapsed && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded bg-[#0f172a] px-2 py-1 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{label}</span>}</>}
          </NavLink>;
        })}
      </nav>
    </div>
    <div className="mt-auto px-1 pb-0 pt-3"><button className={`flex w-full items-center justify-center gap-2 rounded-lg border border-[#1e293b] py-2 text-[13px] font-medium text-slate-300 transition-colors hover:bg-[#0f172a]/50 ${collapsed ? "px-0" : ""}`}><LogOut size={18} />{!collapsed && <span>{t("signOut")}</span>}</button></div>
  </aside>;
}
