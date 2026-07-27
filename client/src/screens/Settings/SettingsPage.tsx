import { useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  Languages,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import SettingProfile from "./Settingprofile";
import AcedemicYear from "./AcedemicYear";
import History from "./History";
import Preferences from "./Preferences";

const settingTabs = [
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "academic", label: "Academic Year", icon: CalendarDays },
  { id: "history", label: "History", icon: Clock3 },
  { id: "preferences", label: "Preferences", icon: Languages },
] as const;

type SettingTab = (typeof settingTabs)[number]["id"];

export default function SettingPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>("profile");
  const [twoStep, setTwoStep] = useState(true);

  const renderContent = () => {
    if (activeTab === "profile") return <SettingProfile />;
    if (activeTab === "academic") return <AcedemicYear />;
    if (activeTab === "history") return <History />;
    if (activeTab === "preferences") return <Preferences />;

    return (
      <section>
        <SectionHeader
          title="Security"
          description="Manage account protection and access controls."
        />

        <div className="mt-6 divide-y divide-slate-100">
          <SettingRow
            title="Password"
            description="Set a strong password to protect your account."
            action={
              <Button variant="outline" className="h-9 rounded-full px-4">
                Change Password
              </Button>
            }
          />

          <SettingRow
            title="2-step verification"
            description="Require a verification code during sign in."
            action={
              <ToggleSwitch
                checked={twoStep}
                onClick={() => setTwoStep((value) => !value)}
              />
            }
          />

          <SettingRow
            title="Notifications"
            description="Receive alerts about system changes."
            action={
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Enabled
              </span>
            }
          />
        </div>
      </section>
    );
  };

  return (
    // FIX 1: Max-height using viewport calculations matching layout layout definitions
    // prevents structural elements from overflowing the page container
    <div className="flex max-h-[calc(100vh-4rem)] w-full flex-col space-y-6 overflow-hidden">
      {/* Settings Top Header Frame (Completely static/unscrollable) */}
      <div className="flex flex-col gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage account preferences and system records
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              placeholder="Search settings..."
            />
          </div>

          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* FIX 2: Added 'min-h-0' alongside flex structural settings to strictly cut off page extension */}
      <div className="grid min-h-0 flex-1 rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[260px_1fr] overflow-hidden">
        {/* FIX 3: Replaced 'overflow-y-auto' with 'overflow-hidden' on the side options layout wrapper */}
        <aside className="flex flex-col border-b border-slate-100 p-5 lg:border-b-0 lg:border-r overflow-hidden shrink-0">
          {/* Identity Card Block */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                MIIT Admin
              </p>
              <p className="truncate text-xs text-slate-500">
                admin@miitstore.com
              </p>
            </div>
          </div>

          {/* Links Selection Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
            {settingTabs.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                    active
                      ? "bg-slate-900 font-semibold text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout Action Footer */}
          <button className="mt-8 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50 shrink-0">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </aside>

        {/* FIX 4: Only this inner container retains custom layout boundaries safely */}
        <main className="h-full min-h-0 overflow-y-auto p-6 md:p-8 scrollbar-thin [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Sub-components definitions
function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div>
        <p className="text-sm font-medium text-slate-950">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

// If your app is using a custom dark theme button, change 'bg-slate-900' to match your theme class here
function ToggleSwitch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? "left-7" : "left-1"}`}
      />
    </button>
  );
}
