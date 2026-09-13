import { useEffect, useState } from "react";
import { KeyRound, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthContext";
const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
type Role = {
  id: number;
  name: string;
};
type Department = {
  id: number;
  name: string;
};
type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: Department | null;
  status: "Active" | "Inactive";
};
const empty = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  departmentId: "",
  status: "Active" as "Active" | "Inactive",
};
export default function UsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]),
    [roles, setRoles] = useState<Role[]>([]),
    [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState(empty),
    [editing, setEditing] = useState<User | null>(null),
    [query, setQuery] = useState("");
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken ?? ""}`,
  };
  const field = (key: keyof typeof empty, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }) as typeof empty);
  const load = async () => {
    setLoading(true);
    try {
      const [list, options] = await Promise.all([
        fetch(`${API}/api/users?query=${encodeURIComponent(query)}`, {
          headers,
        }),
        fetch(`${API}/api/users/options`, { headers }),
      ]);
      const l = await list.json(),
        o = await options.json();
      if (!list.ok) throw new Error(l.message);
      setUsers(l.users);
      setRoles(o.roles ?? []);
      setDepartments(o.departments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [accessToken]);
  const save = async () => {
    if (!editing && draft.password.length < 12) {
      setError("Temporary password must be at least 12 characters.");
      return;
    }
    if (!draft.name.trim() || !draft.email.trim() || !draft.roleId) {
      setError("Name, email, and role are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        ...draft,
        roleId: Number(draft.roleId),
        departmentId: draft.departmentId ? Number(draft.departmentId) : null,
      };
      if (editing) delete body.password;
      const response = await fetch(
        editing ? `${API}/api/users/${editing.id}` : `${API}/api/users`,
        {
          method: editing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(editing ? "User updated." : "User created.");
      setEditing(null);
      setDraft(empty);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save user");
    } finally {
      setSaving(false);
    }
  };
  const edit = (user: User) => {
    setEditing(user);
    setDraft({
      name: user.name,
      email: user.email,
      password: "",
      roleId: String(user.role.id),
      departmentId: user.department ? String(user.department.id) : "",
      status: user.status,
    });
  };
  const reset = async (user: User) => {
    const password = window.prompt(
      `New password for ${user.name} (minimum 12 characters):`,
    );
    if (!password) return;
    if (password.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    const confirmation = window.prompt("Confirm the new password:");
    if (confirmation !== password) {
      setError("Passwords do not match. Password was not changed.");
      return;
    }
    const response = await fetch(`${API}/api/users/${user.id}/reset-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    response.ok ? setMessage(data.message) : setError(data.message);
  };
  const remove = async (user: User) => {
    if (
      !window.confirm(
        `Delete ${user.name}? This cannot be undone. Users with rental or transfer records cannot be deleted.`,
      )
    )
      return;
    const response = await fetch(`${API}/api/users/${user.id}`, {
      method: "DELETE",
      headers,
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("User deleted.");
      await load();
    } else setError(data.message);
  };
  const actions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Actions for ${user.name}`}
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => edit(user)}>
          <Pencil className="mr-2 size-4" />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void reset(user)}>
          <KeyRound className="mr-2 size-4" />
          Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => void remove(user)}
        >
          <Trash2 className="mr-2 size-4" />
          Delete user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <div className="users-page space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-sm text-slate-500">
          Create and manage authorized MIIT Store accounts.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded border border-green-200 bg-green-50 p-3 text-green-700"
        >
          {message}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">
            {editing ? "Edit user" : "Create user"}
          </h2>
          <div className="mt-4 space-y-3">
            <input
              value={draft.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="Name"
              className="h-10 w-full rounded border px-3"
            />
            <input
              value={draft.email}
              onChange={(e) => field("email", e.target.value)}
              placeholder="Email"
              className="h-10 w-full rounded border px-3"
            />
            {!editing && (
              <input
                type="password"
                value={draft.password}
                onChange={(e) => field("password", e.target.value)}
              placeholder="Temporary password"
              minLength={12}
              autoComplete="new-password"
                className="h-10 w-full rounded border px-3"
              />
            )}
            <select
              value={draft.roleId}
              onChange={(e) => field("roleId", e.target.value)}
              className="h-10 w-full rounded border px-3"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              value={draft.departmentId}
              onChange={(e) => field("departmentId", e.target.value)}
              className="h-10 w-full rounded border px-3"
            >
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              value={draft.status}
              onChange={(e) => field("status", e.target.value)}
              className="h-10 w-full rounded border px-3"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create user"}
              </Button>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setDraft(empty);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </section>
        <section className="min-w-0 rounded-xl border bg-white">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load();
                }}
                placeholder="Search name or email"
                className="h-10 w-full rounded border pl-9 pr-3"
              />
            </label>
            <Button
              variant="outline"
              onClick={() => void load()}
              className="sm:self-start"
            >
              Search
            </Button>
          </div>
          <div className="divide-y md:hidden">
            {users.map((user) => (
              <article key={user.id} className="relative p-4 pr-12">
                <div className="absolute right-3 top-3">{actions(user)}</div>
                <b className="block pr-4">{user.name}</b>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {user.email}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500">Role</dt>
                    <dd>{user.role.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Department</dt>
                    <dd>{user.department?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd>{user.status}</dd>
                  </div>
                </dl>
              </article>
            ))}
            {!loading && !users.length && (
              <p className="p-12 text-center text-slate-500">No users found.</p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px]">
              <thead className="bg-slate-50 text-left text-sm text-slate-500">
                <tr>
                  <th className="p-4">User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-4">
                      <b>{user.name}</b>
                      <br />
                      <span className="text-sm text-slate-500">
                        {user.email}
                      </span>
                    </td>
                    <td>{user.role.name}</td>
                    <td>{user.department?.name ?? "—"}</td>
                    <td>{user.status}</td>
                    <td className="text-center">{actions(user)}</td>
                  </tr>
                ))}
                {!loading && !users.length && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <p className="p-8 text-center text-slate-500">Loading users…</p>
          )}
        </section>
      </div>
    </div>
  );
}
