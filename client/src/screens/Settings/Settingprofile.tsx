import { type ReactNode } from "react";
import { BadgeCheck, Building2, Mail, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

import AccessPermissionsModal from "./AccessPermissionsModal";
import EditProfileModal, { type ProfileDetails } from "./EditProfileModal";

interface SettingProfileProps {
  profile: ProfileDetails;
  onSave: (profile: ProfileDetails) => Promise<void>;
}

function ProfileAvatar({ profile }: { profile: ProfileDetails }) {
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-bold text-slate-800">
      {profile.image ? (
        <img src={profile.image} alt={`${profile.name}'s profile`} className="h-full w-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <UserRound className="h-6 w-6" />
      )}
    </div>
  );
}

export default function SettingProfile({ profile, onSave }: SettingProfileProps) {
  const { t } = useLanguage();
  const isActive = profile.status.toLowerCase() === "active";
  const roleLabel = profile.role.toLowerCase() === "admin" || profile.role.toLowerCase() === "administrator" ? t("administrator") : profile.role;
  const statusLabel = isActive ? t("active") : profile.status;

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{t("myProfile")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("manageProfile")}</p>
        </div>
        <EditProfileModal
          profile={profile}
          onSave={onSave}
          trigger={
            <Button className="h-10 shrink-0 rounded-xl bg-slate-950 px-4 hover:bg-slate-800">
              <Pencil className="h-4 w-4" />
              {t("editProfile")}
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ProfileAvatar profile={profile} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-slate-950">{profile.name}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-amber-700">{roleLabel}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-950">{t("accountAccess")}</h3>
            <p className="mt-1 text-sm font-medium text-slate-700">{t("fullSystemAccess")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("administratorAccess")}</p>
          </div>
        </div>
        <AccessPermissionsModal trigger={<Button variant="outline" className="h-10 shrink-0 rounded-xl px-4">{t("viewPermissions")}</Button>} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <UserRound className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-950">{t("personalInformation")}</h3>
        </div>

        <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <InfoRow label={t("fullName")} value={profile.name} />
          <InfoRow label={t("role")} value={roleLabel} />
          <InfoRow label={t("emailAddress")} value={profile.email} icon={<Mail className="h-3.5 w-3.5" />} />
          <InfoRow label={t("phoneNumber")} value={profile.phone || t("notProvided")} icon={<Phone className="h-3.5 w-3.5" />} />
          <InfoRow label={t("department")} value={profile.department || t("notAssigned")} icon={<Building2 className="h-3.5 w-3.5" />} />
          <InfoRow label={t("accountStatus")} value={<span className={`inline-flex items-center gap-1.5 ${isActive ? "text-emerald-700" : "text-slate-600"}`}><BadgeCheck className="h-4 w-4" /> {statusLabel}</span>} />
        </dl>
      </section>
    </section>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-2 flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">{icon}{value}</dd>
    </div>
  );
}
