import { type ReactNode } from "react";
import { Check, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

const permissions = [
  "Inventory",
  "Accessories",
  "Departments",
  "Laptop Rental Service",
  "Academic Years",
  "Settings",
];

interface AccessPermissionsModalProps {
  trigger: ReactNode;
}

export default function AccessPermissionsModal({
  trigger,
}: AccessPermissionsModalProps) {
  const { t } = useLanguage();
  const labels: Record<string, string> = { Inventory: t("inventory"), Accessories: t("accessories"), Departments: t("departments"), "Laptop Rental Service": t("laptopRental"), "Academic Years": t("academicYears"), Settings: t("settings") };
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {t("fullSystemAccess")}
          </DialogTitle>
          <DialogDescription>
            {t("permissionsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2 sm:grid-cols-2">
          {permissions.map((permission) => (
            <div
              key={permission}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-sm font-medium text-slate-800">
                {labels[permission] ?? permission}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          {t("permissionsManaged")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
