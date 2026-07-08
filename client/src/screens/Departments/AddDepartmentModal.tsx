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
            {mode === "edit" ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the department details below."
              : "Enter the department name, class number, and current status."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department Name</Label>
            <Input
              id="department"
              placeholder="e.g. Computer Science"
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
            <Label htmlFor="classroom">Class Number</Label>
            <Input
              id="classroom"
              placeholder="e.g. 101"
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
            <Label htmlFor="status">Status</Label>
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
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "edit" ? "Save Changes" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
