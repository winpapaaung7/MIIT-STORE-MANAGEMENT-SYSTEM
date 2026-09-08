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
  status: "Available" | "Closed";
}

interface AddDepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (department: DepartmentFormValues, departmentId?: number) => void;
  mode?: "create" | "edit";
  initialValues?: DepartmentFormValues | null;
  departmentId?: number;
}

const defaultValues: DepartmentFormValues = {
  department: "",
  classroom: "",
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

    if (!department || !classroom) return;

    onSubmit(
      {
        department,
        classroom,
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
            {mode === "edit" ? t("editRoom") : t("addRoom")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? t("updateRoom")
              : t("enterRoom")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">{t("departmentClassroom")}</Label>
            <Input
              id="department"
              placeholder={t("department")}
              value={formValues.department}
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
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  classroom: event.target.value,
                }))
              }
            />
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
              {mode === "edit" ? t("saveChanges") : t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
