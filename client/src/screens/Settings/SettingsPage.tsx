import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  Languages,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

import SettingProfile from "./Settingprofile";
import AcedemicYear from "./AcedemicYear";
import History from "./History";
import Preferences from "./Preferences";
import type { ProfileDetails } from "./EditProfileModal";

const settingTabs = [
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "academic", label: "Academic Year", icon: CalendarDays },
  { id: "history", label: "History", icon: Clock3 },
  { id: "preferences", label: "Preferences", icon: Languages },
] as const;

type SettingTab = (typeof settingTabs)[number]["id"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

async function requestProfile(): Promise<ProfileDetails> {
  const response = await fetch(`${API_BASE_URL}/api/profile`);
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to load profile.");
  return payload.profile;
}

export default function SettingPage() {
  const { language } = useLanguage();
  const isMyanmar = language === "mm";
  const [activeTab, setActiveTab] = useState<SettingTab>("profile");
  const [twoStep, setTwoStep] = useState(true);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void requestProfile()
      .then((nextProfile) => {
        if (!cancelled) {
          setProfile(nextProfile);
          setProfileError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : "Unable to load profile.");
        }
      });

    return () => { cancelled = true; };
  }, []);

  const loadProfile = () => {
    void requestProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setProfileError("");
      })
      .catch((error) => {
        setProfileError(error instanceof Error ? error.message : "Unable to load profile.");
      });
  };

  const saveProfile = async (nextProfile: ProfileDetails) => {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProfile),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to save profile.");
    setProfile(payload.profile);
  };

  const renderContent = () => {
    if (activeTab === "profile") {
      if (profile) return <SettingProfile profile={profile} onSave={saveProfile} />;
      if (profileError) {
        return <section className="space-y-3"><h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">My Profile</h2><p className="text-sm text-rose-600">{profileError}</p><Button variant="outline" onClick={() => { setProfileError(""); void loadProfile(); }}>Try again</Button></section>;
      }
      return <section><h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">My Profile</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading profile...</p></section>;
    }
    if (activeTab === "academic") return <AcedemicYear />;
    if (activeTab === "history") return <History />;
    if (activeTab === "preferences") return <Preferences />;

    return (
      <section>
        <SectionHeader
          title={isMyanmar ? "လုံခြုံရေး" : "Security"}
          description={isMyanmar ? "အကောင့်ကာကွယ်မှုနှင့် ဝင်ရောက်ခွင့်များကို စီမံပါ။" : "Manage account protection and access controls."}
        />

        <div className="mt-6 divide-y divide-slate-100">
          <SettingRow
            title={isMyanmar ? "စကားဝှက်" : "Password"}
            description={isMyanmar ? "သင့်အကောင့်ကို ကာကွယ်ရန် ခိုင်မာသော စကားဝှက်တစ်ခု သတ်မှတ်ပါ။" : "Set a strong password to protect your account."}
            action={
              <Button variant="outline" className="h-9 rounded-full px-4">
                {isMyanmar ? "စကားဝှက်ပြောင်းရန်" : "Change Password"}
              </Button>
            }
          />

          <SettingRow
            title={isMyanmar ? "အဆင့် ၂ ဆင့် အတည်ပြုခြင်း" : "2-step verification"}
            description={isMyanmar ? "အကောင့်ဝင်ချိန်တွင် အတည်ပြုကုဒ်တစ်ခု လိုအပ်ပါသည်။" : "Require a verification code during sign in."}
            action={
              <ToggleSwitch
                checked={twoStep}
                onClick={() => setTwoStep((value) => !value)}
              />
            }
          />

          <SettingRow
            title={isMyanmar ? "အသိပေးချက်များ" : "Notifications"}
            description={isMyanmar ? "စနစ်ပြောင်းလဲမှုများအတွက် သတိပေးချက်များကို ရယူပါ။" : "Receive alerts about system changes."}
            action={
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {isMyanmar ? "ဖွင့်ထားသည်" : "Enabled"}
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
    <div className="settings-page flex max-h-[calc(100vh-4rem)] w-full flex-col space-y-6 overflow-hidden">
      {/* Settings Top Header Frame (Completely static/unscrollable) */}
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{isMyanmar ? "ဆက်တင်များ" : "Settings"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{isMyanmar ? "အကောင့်နှစ်သက်ရာများနှင့် စနစ်မှတ်တမ်းများကို စီမံပါ" : "Manage account preferences and system records"}</p>
        </div>

        <div>
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* FIX 2: Added 'min-h-0' alongside flex structural settings to strictly cut off page extension */}
      <div className="grid min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[260px_1fr] dark:border-slate-800 dark:bg-slate-900">
        {/* FIX 3: Replaced 'overflow-y-auto' with 'overflow-hidden' on the side options layout wrapper */}
        <aside className="flex shrink-0 flex-col overflow-hidden border-b border-slate-100 p-5 lg:border-r lg:border-b-0 dark:border-slate-800 dark:bg-[#050814]">
          {/* Identity Card Block */}
          <div className="mb-6 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-100">
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={`${profile.name}'s profile`}
                  className="h-full w-full object-cover"
                />
              ) : profile ? (
                profile.name
                  .split(" ")
                  .filter(Boolean)
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              ) : <UserRound className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                {profile?.name ?? "Loading..."}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {profile?.email ?? ""}
              </p>
            </div>
          </div>

          {/* Links Selection Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
            {settingTabs.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const labels: Record<SettingTab, string> = isMyanmar
                ? { profile: "ကိုယ်ရေးအချက်အလက်", security: "လုံခြုံရေး", academic: "ပညာသင်နှစ်", history: "မှတ်တမ်း", preferences: "နှစ်သက်ရာများ" }
                : Object.fromEntries(settingTabs.map((tab) => [tab.id, tab.label])) as Record<SettingTab, string>;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${
                    active
                      ? "bg-[#0f172a] font-semibold text-white"
                      : "text-slate-500 hover:bg-slate-800 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {labels[item.id]}
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
      <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
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
        <p className="text-sm font-medium text-slate-950 dark:text-slate-100">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
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
