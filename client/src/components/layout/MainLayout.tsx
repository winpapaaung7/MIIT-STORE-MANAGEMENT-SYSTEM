import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6 bg-slate-100 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
