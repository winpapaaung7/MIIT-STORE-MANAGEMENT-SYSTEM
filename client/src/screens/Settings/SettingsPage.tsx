import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  CalendarDays,
  Clock3,
  Languages,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE_URL } from "@/lib/api";

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

type ManagementNotification = {
  id: number;
  action: "created" | "updated" | "deleted" | "transferred";
  module: string;
  record: string;
  actor: string;
  createdAt: string;
};

function notificationTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function notificationTitle(notification: ManagementNotification) {
  const verb: Record<ManagementNotification["action"], string> = {
    created: "New",
    updated: "Updated",
    deleted: "Deleted",
    transferred: "Transferred",
  };
  return `${verb[notification.action]} ${notification.module}`;
}

function profileRequestHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function requestProfile(accessToken: string): Promise<ProfileDetails> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: profileRequestHeaders(accessToken),
    credentials: "include",
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to load profile.");
  return payload.profile;
}

export default function SettingPage() {
  const { accessToken, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMyanmar = language === "mm";
  const [activeTab, setActiveTab] = useState<SettingTab>("profile");
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [profileError, setProfileError] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoStepSaving, setTwoStepSaving] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [notifications, setNotifications] = useState<ManagementNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsHistoryOpen, setNotificationsHistoryOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState(0);

  const notificationReadKey = `miit-store-notifications-read-at-${user?.id ?? "anonymous"}`;

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(notificationReadKey));
    if (Number.isFinite(saved) && saved > 0) {
      setLastReadAt(saved);
      return;
    }

    // Existing audit entries are available in the notification history, but
    // do not create a large unread badge the first time someone signs in.
    const now = Date.now();
    window.localStorage.setItem(notificationReadKey, String(now));
    setLastReadAt(now);
  }, [notificationReadKey]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/activity-log?limit=100`, {
        headers: profileRequestHeaders(accessToken),
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) return;
      setNotifications(
        payload.activities.map((activity: {
          activity_log_id: number;
          action: ManagementNotification["action"];
          module: string;
          target_name: string;
          actor_name: string;
          created_at: string;
        }) => ({
          id: activity.activity_log_id,
          action: activity.action,
          module: activity.module,
          record: activity.target_name,
          actor: activity.actor_name,
          createdAt: activity.created_at,
        })),
      );
    } catch {
      // The bell remains usable even when notifications cannot be refreshed.
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void loadNotifications();
    const refresh = window.setInterval(() => void loadNotifications(), 60_000);
    return () => window.clearInterval(refresh);
  }, [accessToken, loadNotifications]);

  const unreadNotifications = notifications.filter(
    (notification) => new Date(notification.createdAt).getTime() > lastReadAt,
  );

  const markAllNotificationsRead = () => {
    const now = Date.now();
    window.localStorage.setItem(notificationReadKey, String(now));
    setLastReadAt(now);
  };

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    void requestProfile(accessToken)
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
  }, [accessToken]);

  const loadProfile = () => {
    if (!accessToken) return;

    void requestProfile(accessToken)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setProfileError("");
      })
      .catch((error) => {
        setProfileError(error instanceof Error ? error.message : "Unable to load profile.");
      });
  };

  const saveProfile = async (nextProfile: ProfileDetails) => {
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...profileRequestHeaders(accessToken),
      },
      credentials: "include",
      body: JSON.stringify(nextProfile),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to save profile.");
    setProfile(payload.profile);
  };

  const finishPasswordChange = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      signOut();
      navigate("/login", { replace: true });
    }
  };

  const updateTwoStepVerification = async () => {
    if (!accessToken || !profile || twoStepSaving) return;

    setTwoStepSaving(true);
    setSecurityError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/two-step-verification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...profileRequestHeaders(accessToken),
        },
        credentials: "include",
        body: JSON.stringify({ enabled: !profile.twoStepEnabled }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to update two-step verification.");
      setProfile((current) => current ? { ...current, twoStepEnabled: payload.twoStepEnabled } : current);
    } catch (requestError) {
      setSecurityError(requestError instanceof Error ? requestError.message : "Unable to update two-step verification.");
    } finally {
      setTwoStepSaving(false);
    }
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
              <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => setPasswordDialogOpen(true)}>
                {isMyanmar ? "စကားဝှက်ပြောင်းရန်" : "Change Password"}
              </Button>
            }
          />

          <SettingRow
            title={isMyanmar ? "အဆင့် ၂ ဆင့် အတည်ပြုခြင်း" : "2-step verification"}
            description={isMyanmar ? "အကောင့်ဝင်ချိန်တွင် အတည်ပြုကုဒ်တစ်ခု လိုအပ်ပါသည်။" : "Require a verification code during sign in."}
            action={
              <ToggleSwitch
                checked={profile?.twoStepEnabled ?? true}
                disabled={!profile || twoStepSaving}
                onClick={() => void updateTwoStepVerification()}
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
        {securityError && <p className="mt-3 text-sm text-rose-600" role="alert">{securityError}</p>}
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
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl dark:text-slate-50">{isMyanmar ? "ဆက်တင်များ" : "Settings"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{isMyanmar ? "အကောင့်နှစ်သက်ရာများနှင့် စနစ်မှတ်တမ်းများကို စီမံပါ" : "Manage account preferences and system records"}</p>
        </div>

        <Popover open={notificationsOpen} onOpenChange={(open) => { setNotificationsOpen(open); if (open) void loadNotifications(); }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Notifications${unreadNotifications.length ? ` (${unreadNotifications.length} unread)` : ""}`}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications.length > 0 ? <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}</span> : null}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div><h2 className="font-semibold text-slate-950 dark:text-slate-50">Notifications</h2><p className="text-xs text-slate-500">Management activity alerts</p></div>
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={markAllNotificationsRead} disabled={unreadNotifications.length === 0}><CheckCheck className="h-4 w-4" />Mark all read</Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No management notifications yet.</p> : notifications.slice(0, 6).map((notification) => {
                const unread = new Date(notification.createdAt).getTime() > lastReadAt;
                return <button key={notification.id} type="button" onClick={() => { setNotificationsOpen(false); setActiveTab("history"); }} className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${unread ? "bg-sky-50/70 dark:bg-sky-950/20" : ""}`}>
                  <div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`} /><div className="min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notificationTitle(notification)}</p><p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{notification.record} · {notification.actor}</p><p className="mt-1 text-[11px] text-slate-500">{notificationTime(notification.createdAt)}</p></div></div>
                </button>;
              })}
            </div>
            <div className="border-t border-slate-100 p-2 dark:border-slate-800"><Button type="button" variant="ghost" className="w-full" onClick={() => { setNotificationsOpen(false); setNotificationsHistoryOpen(true); }}>View all notifications</Button></div>
          </PopoverContent>
        </Popover>
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
                      ? "bg-[#16243a] font-semibold text-slate-50 ring-1 ring-[#2a3b55]"
                      : "text-slate-500 hover:bg-[#1a2940] hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {labels[item.id]}
                </button>
              );
            })}
          </nav>

        </aside>

        {/* FIX 4: Only this inner container retains custom layout boundaries safely */}
        <main className="h-full min-h-0 overflow-y-auto p-6 md:p-8 scrollbar-thin [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
          {renderContent()}
        </main>
      </div>
      <ChangePasswordDialog
        open={passwordDialogOpen}
        accessToken={accessToken}
        onOpenChange={setPasswordDialogOpen}
        onPasswordChanged={finishPasswordChange}
      />
      <Dialog open={notificationsHistoryOpen} onOpenChange={setNotificationsHistoryOpen}>
        <DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <DialogTitle>All notifications</DialogTitle>
            <DialogDescription>Management activity from across the system.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-500">No notifications yet.</p> : notifications.map((notification) => {
              const unread = new Date(notification.createdAt).getTime() > lastReadAt;
              return <article key={notification.id} className={`border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800 ${unread ? "bg-sky-50/60 dark:bg-sky-950/20" : ""}`}><div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`} /><div><p className="font-medium text-slate-900 dark:text-slate-100">{notificationTitle(notification)}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.record} by {notification.actor}</p><p className="mt-1 text-xs text-slate-500">{notificationTime(notification.createdAt)}</p></div></div></article>;
            })}
          </div>
          <DialogFooter className="border-t border-slate-100 px-5 py-3 dark:border-slate-800"><Button variant="outline" onClick={markAllNotificationsRead}><CheckCheck className="h-4 w-4" />Mark all read</Button><Button onClick={() => { setNotificationsHistoryOpen(false); setActiveTab("history"); }}>Open audit history</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ChangePasswordDialog({
  open,
  accessToken,
  onOpenChange,
  onPasswordChanged,
}: {
  open: boolean;
  accessToken: string | null;
  onOpenChange: (open: boolean) => void;
  onPasswordChanged: () => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = (nextOpen: boolean) => {
    if (!nextOpen && !saving) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setError("");
    }
    onOpenChange(nextOpen);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 12) {
      setError("Your new password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to change password.");
      await onPasswordChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to change password.");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Use at least 12 characters. For your protection, you will be signed out on all devices afterwards.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={saving} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={saving} minLength={12} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={saving} minLength={12} required />
          </div>
          {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Changing..." : "Change password"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

function ToggleSwitch({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Toggle two-step verification"
      aria-pressed={checked}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-8 w-14 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-slate-900" : "bg-slate-200"}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? "left-7" : "left-1"}`} />
    </button>
  );
}
