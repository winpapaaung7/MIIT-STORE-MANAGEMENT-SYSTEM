import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import AddDepartmentModal from "./AddDepartmentModal";
import AddNewDeptButton from "./AddNewDeptButton";
import DepartmentTable, { type DepartmentSummary } from "./DepartmentTable";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface Department {
  id: number;
  department_id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed" | "Unassigned";
  has_room: boolean;
}

interface DepartmentResponse {
  ok: boolean;
  departments: Department[];
  message?: string;
}

interface CreateDepartmentResponse {
  ok: boolean;
  department: Department;
  message?: string;
}

interface UpdateDepartmentResponse {
  ok: boolean;
  department: Department;
  message?: string;
}

export default function DepartmentPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentError, setDepartmentError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/departments`);
        const result = (await response.json()) as DepartmentResponse;

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Failed to load departments");
        }

        setDepartments(result.departments);
        setDepartmentError("");
      } catch (error) {
        setDepartmentError(
          error instanceof Error ? error.message : "Failed to load departments",
        );
      }
    };

    void loadDepartments();
  }, []);

  const departmentSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const summaries = new Map<number, DepartmentSummary>();
    for (const department of departments) {
      const summary = summaries.get(department.department_id) ?? {
        departmentId: department.department_id,
        name: department.department,
        roomCount: 0,
        availableRooms: 0,
      };
      if (department.has_room) {
        summary.roomCount += 1;
        if (department.status === "Available") summary.availableRooms += 1;
      }
      summaries.set(department.department_id, summary);
    }

    return [...summaries.values()]
      .filter((summary) => !query || summary.name.toLowerCase().includes(query) || departments.some((department) => department.department_id === summary.departmentId && department.classroom.toLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, searchQuery]);

  const handleSaveDepartment = async (
    values: {
      department: string;
      classroom: string;
      roomNumberNotAssigned: boolean;
      status: "Available" | "Closed";
    },
    departmentId?: number,
  ) => {
    try {
      const payload = {
        department: values.department,
        classroom: values.classroom,
        roomNumberNotAssigned: values.roomNumberNotAssigned,
        status: values.status,
      };

      if (departmentId && selectedDepartment?.has_room) {
        const response = await fetch(
          `${API_BASE_URL}/api/departments/${departmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        const result = (await response.json()) as UpdateDepartmentResponse;

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Failed to update department");
        }

        setDepartments((current) =>
          current.map((department) =>
            department.id === departmentId ? result.department : department,
          ),
        );
      } else {
        const response = await fetch(`${API_BASE_URL}/api/departments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as CreateDepartmentResponse;

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Failed to create department");
        }

        setDepartments((current) => [
          ...current.filter((department) => department.id !== departmentId),
          result.department,
        ]);
      }

      setSelectedDepartment(null);
      setIsModalOpen(false);
      setDepartmentError("");
    } catch (error) {
      setDepartmentError(
        error instanceof Error ? error.message : "Failed to save department",
      );
    }
  };

  const handleOpenDepartmentDetails = (department: DepartmentSummary) => {
    navigate(`/departments/${department.departmentId}`);
  };

  return (
    <div className="department-page space-y-5 pb-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-3xl font-bold text-slate-950">{t("departments")}</h1></div>
        <AddNewDeptButton onClick={() => { setSelectedDepartment(null); setIsModalOpen(true); }} />
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("searchDepartments")} className="h-10 w-full rounded-lg border-slate-200 bg-white pl-10 pr-3 text-sm" />
        </label>
      </section>

      {departmentError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{departmentError}</p> : null}

      <DepartmentTable
        data={departmentSummaries}
        onOpen={handleOpenDepartmentDetails}
      />

      <AddDepartmentModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedDepartment(null);
          }
        }}
        onSubmit={handleSaveDepartment}
        mode={selectedDepartment ? (selectedDepartment.has_room ? "edit" : "assign") : "create"}
        initialValues={
          selectedDepartment
            ? {
                department: selectedDepartment.department,
                classroom: selectedDepartment.has_room ? selectedDepartment.classroom : "",
                roomNumberNotAssigned: !selectedDepartment.has_room || !selectedDepartment.classroom,
                status: selectedDepartment.status === "Closed" ? "Closed" : "Available",
              }
            : null
        }
        departmentId={selectedDepartment?.id}
      />
    </div>
  );
}
