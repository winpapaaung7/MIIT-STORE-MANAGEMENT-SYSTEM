import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";

interface DepartmentFormValues {
  department: string;
  classroom: string;
  roomNumberNotAssigned: boolean;
  status: "Available" | "Closed";
}

interface AddDepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (department: DepartmentFormValues, departmentId?: number) => void;
  mode?: "create" | "edit" | "assign";
  initialValues?: DepartmentFormValues | null;
  departmentId?: number;
}

const defaultValues: DepartmentFormValues = {
  department: "",
  classroom: "",
  roomNumberNotAssigned: true,
  status: "Available",
};

export default function AddDepartmentModal({
  open,
  onOpenChange,
  onSubmit,
  mode = "create",
  initialValues,
  departmentId,
}: AddDepartmentModalProps) {
  const { t } = useLanguage();
  const [formValues, setFormValues] =
    useState<DepartmentFormValues>(defaultValues);

  useEffect(() => {
    if (open && initialValues) {
      setFormValues(initialValues);
      return;
    }

    if (!open) {
      setFormValues(defaultValues);
    }
  }, [initialValues, open]);

  const resetForm = () => setFormValues(defaultValues);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const department = formValues.department.trim();
    const classroom = formValues.classroom.trim();

    if (!department || (!classroom && !formValues.roomNumberNotAssigned)) return;

    onSubmit(
      {
        department,
        classroom,
        roomNumberNotAssigned: formValues.roomNumberNotAssigned,
        status: formValues.status,
      },
      mode === "edit" ? departmentId : undefined,
    );

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "assign" ? t("addRoom") : mode === "edit" ? t("editRoom") : t("addRoom")}
          </DialogTitle>
          <DialogDescription>
            {mode === "assign"
              ? "Add a room for this department. Leave its number unassigned when the university has not provided one yet."
              : mode === "edit"
              ? t("updateRoom")
              : "Enter a department name. You can create its room now even when its room number is not known yet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">{t("department")}</Label>
            <Input
              id="department"
              placeholder={t("department")}
              value={formValues.department}
              readOnly={mode === "assign"}
              className={mode === "assign" ? "bg-slate-50 text-slate-600" : undefined}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  department: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classroom">{t("roomNumber")}</Label>
            <Input
              id="classroom"
              placeholder="101"
              value={formValues.classroom}
              disabled={formValues.roomNumberNotAssigned}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  classroom: event.target.value,
                  roomNumberNotAssigned: false,
                }))
              }
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formValues.roomNumberNotAssigned}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    classroom: event.target.checked ? "" : current.classroom,
                    roomNumberNotAssigned: event.target.checked,
                  }))
                }
              />
              Room number has not been assigned yet
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={formValues.status}
              onValueChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  status: value as DepartmentFormValues["status"],
                }))
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">{t("available")}</SelectItem>
                <SelectItem value="Closed">{t("closed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit">
              {mode === "assign" ? t("saveChanges") : mode === "edit" ? t("saveChanges") : t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
