import {
  BadgeCheck,
  Building2,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

import AccessPermissionsModal from "./AccessPermissionsModal";
import EditProfileModal, { type ProfileDetails } from "./EditProfileModal";

interface SettingProfileProps {
  profile: ProfileDetails;
  onSave: (profile: ProfileDetails) => Promise<void>;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function displayValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

export default function SettingProfile({ profile, onSave }: SettingProfileProps) {
  const { t } = useLanguage();
  const isActive = profile.status.toLowerCase() === "active";

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl dark:text-slate-50">{t("myProfile")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("manageProfile")}</p>
        </div>
        <EditProfileModal profile={profile} onSave={onSave} trigger={<Button className="h-10 rounded-lg bg-[#071a3a] px-4 text-sm hover:bg-[#102b59] dark:bg-[#365778] dark:hover:bg-[#2c4b6c]"><PencilLine className="h-4 w-4" />{t("editProfile")}</Button>} />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3.5">
          <ProfileAvatar profile={profile} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{profile.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{profile.role}</span>
              <StatusBadge active={isActive} label={isActive ? t("active") : profile.status} />
            </div>
            <p className="mt-1.5 truncate text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef3fb] text-[#183968] dark:bg-slate-800 dark:text-blue-300"><ShieldCheck className="h-[18px] w-[18px]" /></div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("accountAccess")}</h3>
            <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{t("fullSystemAccess")}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t("administratorAccess")}</p>
          </div>
        </div>
        <AccessPermissionsModal trigger={<Button variant="outline" className="h-10 w-fit rounded-lg px-4 text-sm">{t("viewPermissions")}</Button>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef3fb] text-[#183968] dark:bg-slate-800 dark:text-blue-300"><UserRound className="h-[18px] w-[18px]" /></div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("personalInformation")}</h3>
          </div>
        </div>

        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-slate-800">
          <InfoColumn>
            <InfoItem label={t("fullName")} value={profile.name} />
            <InfoItem label={t("emailAddress")} value={profile.email} icon={Mail} />
            <InfoItem label={t("department")} value={displayValue(profile.department, t("notAssigned"))} icon={Building2} />
          </InfoColumn>
          <InfoColumn>
            <InfoItem label={t("accountRole")} value={profile.role} />
            <InfoItem label={t("phoneNumber")} value={displayValue(profile.phone, t("notProvided"))} icon={Phone} />
            <InfoItem label={t("accountStatus")} value={<StatusBadge active={isActive} label={isActive ? t("active") : profile.status} />} />
          </InfoColumn>
        </div>
      </div>
    </section>
  );
}

function ProfileAvatar({ profile }: { profile: ProfileDetails }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9eff9] text-2xl font-bold text-[#102b58] ring-1 ring-[#dce6f4] dark:bg-slate-800 dark:text-blue-200 dark:ring-slate-700">
      {profile.image ? <img src={profile.image} alt={`${profile.name}'s profile`} className="h-full w-full object-cover" /> : initials(profile.name)}
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{active ? <BadgeCheck className="h-3 w-3" /> : null}{label}</span>;
}

function InfoColumn({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-slate-100 px-4 dark:divide-slate-800">{children}</div>;
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof Mail }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3.5">
      <span className="flex shrink-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">{Icon ? <Icon className="h-4 w-4" /> : null}{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}
