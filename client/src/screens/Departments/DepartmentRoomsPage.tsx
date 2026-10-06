import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Building2, ChevronLeft, CircleCheck, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import AddDepartmentModal from "./AddDepartmentModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

type DepartmentRoom = {
  id: number;
  department_id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed";
  has_room: boolean;
};

const roomLabel = (room: DepartmentRoom) => room.classroom || "Room number not assigned";

type DepartmentRoomsPageProps = {
  /** Used by the Department Head route so its department cannot be chosen from the URL. */
  departmentId?: number;
  ownDepartment?: boolean;
  viewOnly?: boolean;
  dashboardPath?: string;
  locationLabel?: string;
};

export default function DepartmentRoomsPage({ departmentId: requestedDepartmentId, ownDepartment = false, viewOnly = false, dashboardPath, locationLabel }: DepartmentRoomsPageProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { departmentId: routeDepartmentId } = useParams();
  const id = ownDepartment ? Number(user?.department?.id) : requestedDepartmentId ?? Number(routeDepartmentId);
  const isPersonalDepartmentView = ownDepartment || viewOnly;
  const canManage = user?.role.code === "ADMIN" && !isPersonalDepartmentView;
  const [rooms, setRooms] = useState<DepartmentRoom[]>([]);
  const [editingRoom, setEditingRoom] = useState<DepartmentRoom | null>(null);
  const [error, setError] = useState("");
  const [departmentName, setDepartmentName] = useState("Department");
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<DepartmentRoom | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const availableRoomCount = rooms.filter((room) => room.status === "Available").length;

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("Department not found.");
      return;
    }

    void fetch(`${API_BASE_URL}/api/departments`)
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; departments?: DepartmentRoom[]; message?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Failed to load department rooms.");
        const departmentRows = (payload.departments ?? []).filter((room) => room.department_id === id);
        if (!departmentRows.length) throw new Error("Department not found.");
        const matches = departmentRows.filter((room) => room.has_room);
        setDepartmentName(departmentRows[0].department);
        setRooms(matches.sort((a, b) => roomLabel(a).localeCompare(roomLabel(b), undefined, { numeric: true })));
        setError("");
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Failed to load department rooms."));
  }, [id]);

  const addRoom = async (values: { department: string; classroom: string; roomNumberNotAssigned: boolean; status: "Available" | "Closed" }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { ok?: boolean; department?: DepartmentRoom; message?: string };
      if (!response.ok || !payload.ok || !payload.department) throw new Error(payload.message ?? "Failed to add room.");
      setRooms((current) => [...current, payload.department!].sort((a, b) => roomLabel(a).localeCompare(roomLabel(b), undefined, { numeric: true })));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to add room.");
    }
  };

  const updateRoom = async (values: { department: string; classroom: string; roomNumberNotAssigned: boolean; status: "Available" | "Closed" }, roomId?: number) => {
    if (!roomId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json() as { ok?: boolean; department?: DepartmentRoom; message?: string };
      if (!response.ok || !payload.ok || !payload.department) throw new Error(payload.message ?? "Failed to update room.");
      setRooms((current) => current.map((room) => room.id === roomId ? payload.department! : room));
      setEditingRoom(null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update room.");
    }
  };

  const renameDepartment = async () => {
    const name = nameDraft.trim();
    if (!name) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/entity/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: name }),
      });
      const payload = await response.json() as { ok?: boolean; department?: { name: string }; message?: string };
      if (!response.ok || !payload.ok || !payload.department) throw new Error(payload.message ?? "Failed to update department.");
      setDepartmentName(payload.department.name);
      setRooms((current) => current.map((room) => ({ ...room, department: payload.department!.name })));
      setRenameOpen(false);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update department.");
    }
  };

  const deleteDepartment = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/entity/${id}`, { method: "DELETE" });
      const payload = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Failed to delete department.");
      navigate("/departments", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete department.");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const deleteRoom = async () => {
    if (!roomToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments/${roomToDelete.id}`, {
        method: "DELETE",
      });
      const payload = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Failed to delete room.");

      setRooms((current) => current.filter((room) => room.id !== roomToDelete.id));
      setRoomToDelete(null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete room.");
      setRoomToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="department-page mx-auto max-w-7xl space-y-6 pb-8">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {!isPersonalDepartmentView && <Button type="button" variant="ghost" size="icon" aria-label="Back to Departments" className="mt-0.5 shrink-0 rounded-xl" onClick={() => navigate("/departments")}><ChevronLeft className="size-5" /></Button>}
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{locationLabel ?? (ownDepartment ? "My Department / Locations" : "Departments / Locations")}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{departmentName}</h1><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><CircleCheck className="size-3.5" />Operational</span></div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose a location to view its inventory dashboard and activity.</p>
            </div>
          </div>
          {canManage && <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button type="button" variant="outline" className="rounded-xl border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Delete department</Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setNameDraft(departmentName); setRenameOpen(true); }}>Rename department</Button>
            <Button type="button" className="rounded-xl" onClick={() => setAddRoomOpen(true)}><Plus className="size-4" />Add location</Button>
          </div>}
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900"><div className="rounded-lg bg-white p-2 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"><Building2 className="size-4" /></div><div><p className="text-xl font-bold text-slate-950 dark:text-white">{rooms.length}</p><p className="text-xs text-slate-500">Registered locations</p></div></div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 px-4 py-3 dark:bg-emerald-950/30"><div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300"><CircleCheck className="size-4" /></div><div><p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{availableRoomCount}</p><p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Available now</p></div></div>
          {canManage
            ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-slate-700"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Need another location?</p><button type="button" className="mt-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300" onClick={() => setAddRoomOpen(true)}>Add a room or an unnumbered location <ArrowUpRight className="inline size-3.5" /></button></div>
            : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-slate-700"><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Department locations</p><p className="mt-1 text-xs text-slate-500">Open a location to view its inventory and activity.</p></div>}
        </div>
      </header>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}

      {!error && !rooms.length ? <Card className="border-dashed border-slate-300 dark:border-slate-700"><CardContent className="flex flex-col items-center py-16 text-center"><div className="rounded-2xl bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><DoorOpen className="size-7" /></div><h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">No locations yet</h2><p className="mt-1 max-w-sm text-sm text-slate-500">{canManage ? "Add a room now, or create an active location and assign its room number later." : "Your administrator has not assigned a location to this department yet."}</p>{canManage && <Button type="button" className="mt-5 rounded-xl" onClick={() => setAddRoomOpen(true)}><Plus className="size-4" />Add location</Button>}</CardContent></Card> : null}

      {rooms.length ? <section aria-label="Department locations"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-950 dark:text-white">Locations</h2><p className="mt-0.5 text-sm text-slate-500">Select a location to open its dashboard.</p></div><span className="text-sm text-slate-500">{rooms.length} total</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <article key={room.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-800">
            <button type="button" onClick={() => navigate(dashboardPath ? `${dashboardPath}?roomId=${room.id}` : ownDepartment ? `/my-department/dashboard?roomId=${room.id}` : `/departments/${room.department_id}/dashboard?departmentId=${room.department_id}&roomId=${room.id}`)} className="w-full p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
              <div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><DoorOpen className="size-6" /></div><Badge variant={room.status === "Available" ? "default" : "secondary"} className="rounded-full px-2.5">{room.status === "Available" ? t("available") : t("closed")}</Badge></div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{room.classroom ? "Room" : "Location"}</p>
              <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{room.classroom || "Number not assigned"}</p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300"><span>Open dashboard</span><span className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200"><ArrowUpRight className="size-4" /></span></div>
            </button>
            {canManage && <div className="flex gap-2 border-t border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60"><Button type="button" variant="ghost" size="sm" className="flex-1 justify-start rounded-lg text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" onClick={() => setEditingRoom(room)}><Pencil className="size-3.5" />Edit location</Button><Button type="button" variant="ghost" size="sm" className="justify-start rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-200" onClick={() => setRoomToDelete(room)}><Trash2 className="size-3.5" />Delete</Button></div>}
          </article>
        ))}
      </div></section> : null}

      {canManage && <AddDepartmentModal
        open={addRoomOpen}
        onOpenChange={setAddRoomOpen}
        onSubmit={(values) => { void addRoom(values); }}
        mode="assign"
        initialValues={{ department: departmentName, classroom: "", roomNumberNotAssigned: true, status: "Available" }}
      />}

      {canManage && <AddDepartmentModal
        open={Boolean(editingRoom)}
        onOpenChange={(open) => { if (!open) setEditingRoom(null); }}
        onSubmit={(values, roomId) => { void updateRoom(values, roomId); }}
        mode="edit"
        departmentId={editingRoom?.id}
        initialValues={editingRoom ? { department: departmentName, classroom: editingRoom.classroom, roomNumberNotAssigned: !editingRoom.classroom, status: editingRoom.status } : null}
      />}

      {canManage && <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void renameDepartment(); }}>
            <Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Department name" autoFocus />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button><Button type="submit">Save changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>}

      {canManage && <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete {departmentName}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This is allowed only when the department has no rooms, inventory items, assigned users, department head, or transfer records.</p>
          <DialogFooter><Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button type="button" disabled={deleting} className="bg-rose-600 hover:bg-rose-700" onClick={() => void deleteDepartment()}>{deleting ? "Deleting..." : "Delete department"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>}

      {canManage && <Dialog open={Boolean(roomToDelete)} onOpenChange={(open) => { if (!open && !deleting) setRoomToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete {roomToDelete ? roomLabel(roomToDelete) : "this location"}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This cannot be undone. A room with inventory items or transfer records cannot be deleted.</p>
          <DialogFooter><Button type="button" variant="outline" disabled={deleting} onClick={() => setRoomToDelete(null)}>Cancel</Button><Button type="button" disabled={deleting} className="bg-rose-600 hover:bg-rose-700" onClick={() => void deleteRoom()}>{deleting ? "Deleting..." : "Delete room"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>}

    </div>
  );
}
