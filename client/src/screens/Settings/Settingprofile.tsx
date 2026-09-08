import { Mail, Pencil, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SettingProfileProps {
  name?: string;
  role?: string;
  email?: string;
}

export default function SettingProfile({
  name = "Administrator",
  role = "Full System Access",
  email = "admin@miitstore.com",
}: SettingProfileProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          My Profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account information and access level.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
            <UserRound className="h-7 w-7" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">
              {name}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500">
              {role}
            </p>
          </div>
        </div>

        <Button variant="outline" className="h-9 rounded-xl px-4">
          Edit
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-950">
                Email address
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {email}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Verified
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-950">
                Account role
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Access to inventory, departments, and settings.
              </p>
            </div>
          </div>

          <span className="text-sm font-medium text-slate-500">
            Admin
          </span>
        </div>
      </div>
    </section>
  );
}
