import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import AddDepartmentModal from "./AddDepartmentModal";
import AddNewDeptButton from "./AddNewDeptButton";
import DepartmentTable from "./DepartmentTable";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface Department {
  id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed";
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

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter((department) => {
      const departmentName = department.department.toLowerCase();
      const roomNumber = department.classroom.toLowerCase();

      return departmentName.includes(query) || roomNumber.includes(query);
    });
  }, [departments, searchQuery]);

  const handleSaveDepartment = async (
    values: {
      department: string;
      classroom: string;
      status: "Available" | "Closed";
    },
    departmentId?: number,
  ) => {
    try {
      const payload = {
        department: values.department,
        classroom: values.classroom,
        status: values.status,
      };

      if (departmentId) {
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

        setDepartments((current) => [...current, result.department]);
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

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (department: Department) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/departments/${department.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Failed to delete department");
      }

      setDepartments((current) =>
        current.filter((item) => item.id !== department.id),
      );
      setDepartmentError("");
    } catch (error) {
      setDepartmentError(
        error instanceof Error ? error.message : "Failed to delete department",
      );
    }
  };

  const handleOpenDepartmentDetails = (department: Department) => {
    const params = new URLSearchParams({
      department: department.department,
      room: department.classroom,
    });

    navigate(`/accessories?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Departments</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by department or room"
              className="h-11 pl-9"
            />
          </div>

          <AddNewDeptButton
            onClick={() => {
              setSelectedDepartment(null);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {departmentError ? (
        <p className="text-sm font-medium text-red-600">{departmentError}</p>
      ) : null}

      <DepartmentTable
        data={filteredDepartments}
        onOpen={handleOpenDepartmentDetails}
        onEdit={handleEditDepartment}
        onDelete={handleDeleteDepartment}
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
        mode={selectedDepartment ? "edit" : "create"}
        initialValues={
          selectedDepartment
            ? {
                department: selectedDepartment.department,
                classroom: selectedDepartment.classroom,
                status: selectedDepartment.status,
              }
            : null
        }
        departmentId={selectedDepartment?.id}
      />
    </div>
  );
}
