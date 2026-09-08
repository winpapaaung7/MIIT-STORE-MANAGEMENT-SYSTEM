import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

export interface ProfileDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  status: string;
  image?: string;
}

interface EditProfileModalProps {
  profile: ProfileDetails;
  onSave: (profile: ProfileDetails) => Promise<void>;
  trigger: ReactNode;
}

export default function EditProfileModal({
  profile,
  onSave,
  trigger,
}: EditProfileModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [department, setDepartment] = useState(profile.department);
  const [phone, setPhone] = useState(profile.phone);
  const [image, setImage] = useState(profile.image ?? "");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(profile.name);
      setEmail(profile.email);
      setDepartment(profile.department);
      setPhone(profile.phone);
      setImage(profile.image ?? "");
      setSaveError("");
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    setSaveError("");

    try {
      await onSave({
        ...profile,
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        phone: phone.trim(),
        image,
      });
      setOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("editProfileTitle")}</DialogTitle>
          <DialogDescription>
            {t("editProfileDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-profile-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >
          <div className="grid gap-2">
            <Label htmlFor="profile-image">{t("profilePhoto")}</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white">
                {image ? (
                  <img
                    src={image}
                    alt={t("profilePhoto")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-7 w-7" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-10 cursor-pointer border-slate-300 text-sm file:mr-3 file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />
                <p className="text-xs text-slate-500">
                  {t("uploadImage")}
                </p>
              </div>
            </div>
            {image ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setImage("")}
                className="h-8 w-fit px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                {t("removePhoto")}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-name">{t("fullName")}</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("enterName")}
              className="h-10 border-slate-300"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-email">{t("emailAddress")}</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="h-10 border-slate-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-department">{t("department")}</Label>
            <Input
              id="profile-department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="e.g. IT & Store Operations"
              className="h-10 border-slate-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-phone">{t("phoneNumber")}</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. +95 9 123 456 789"
              className="h-10 border-slate-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-role">{t("accountRole")}</Label>
            <Input
              id="profile-role"
              value={profile.role}
              readOnly
              disabled
              className="h-10 border-slate-200 bg-slate-100 text-slate-500"
            />
            <p className="text-xs text-slate-500">
              {t("roleManaged")}
            </p>
          </div>

          {saveError ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {saveError}
            </p>
          ) : null}
        </form>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            disabled={!name.trim() || !email.trim() || saving}
            className="bg-slate-950 hover:bg-slate-800"
          >
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
