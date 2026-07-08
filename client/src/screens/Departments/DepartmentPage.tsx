import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import AddDepartmentModal from "./AddDepartmentModal";
import AddNewDeptButton from "./AddNewDeptButton";
import DepartmentTable from "./DepartmentTable";

interface Department {
  id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed";
}

const initialDepartments: Department[] = [
  {
    id: 1,
    department: "Computer Science",
    classroom: "101",
    status: "Available",
  },
  { id: 2, department: "Mathematics", classroom: "202", status: "Closed" },
];

export default function DepartmentPage() {
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

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

  const handleSaveDepartment = (
    values: {
      department: string;
      classroom: string;
      status: "Available" | "Closed";
    },
    departmentId?: number,
  ) => {
    if (departmentId) {
      setDepartments((current) =>
        current.map((department) =>
          department.id === departmentId
            ? {
                ...department,
                department: values.department,
                classroom: values.classroom,
                status: values.status,
              }
            : department,
        ),
      );
      setSelectedDepartment(null);
      setIsModalOpen(false);
      return;
    }

    setDepartments((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((department) => department.id)) + 1,
        department: values.department,
        classroom: values.classroom,
        status: values.status,
      },
    ]);
    setSelectedDepartment(null);
    setIsModalOpen(false);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDepartments((current) =>
      current.filter((item) => item.id !== department.id),
    );
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

      <DepartmentTable
        data={filteredDepartments}
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
