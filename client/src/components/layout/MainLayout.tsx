import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="flex overflow-x-hidden">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden p-6 bg-slate-100 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
