import { FormEvent, useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Table from "../components/Table";
import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import { apiFetch, isAbortError } from "../api/client";

const roleOptions = [
  { slug: "admin", label: "Admin" },
  { slug: "coach", label: "Coach" },
  { slug: "support", label: "Support" },
];

const permissionCatalog = [
  { key: "billing.manage", label: "Manage billing & payments" },
  { key: "billing.read", label: "View billing" },
  { key: "members.manage", label: "Manage members" },
  { key: "members.read", label: "View members" },
  { key: "communications.manage", label: "Email/SMS automations" },
  { key: "communications.read", label: "View messaging" },
  { key: "workouts.manage", label: "Workout builder" },
  { key: "workouts.read", label: "View workouts" },
  { key: "analytics.manage", label: "Reporting & insights" },
];

type TeamUser = {
  id: number;
  name: string;
  email: string;
  role_slug: string;
  role_name: string;
  last_login_at?: string | null;
  is_primary_owner?: boolean;
};

type RoleRecord = {
  id: string;
  name: string;
  slug: string;
  permissions: string[];
};

export default function Team() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role_slug: "coach" });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const [usersRes, rolesRes] = await Promise.all([
          apiFetch<{ data: TeamUser[] }>("/team/users", { signal: controller.signal }),
          apiFetch<{ data: RoleRecord[] }>("/roles", { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setUsers(usersRes.data);
        setRoles(rolesRes.data);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load team");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setCreating(true);
      const response = await apiFetch<{ data: { user: TeamUser; temp_password: string } }>("/team/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((prev) => [...prev, response.data.user]);
      setTempPassword(response.data.temp_password);
      setForm({ name: "", email: "", role_slug: "coach" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(userId: number, role_slug: string) {
    try {
      const response = await apiFetch<{ data: TeamUser }>(`/team/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role_slug }),
      });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role_slug: response.data.role_slug } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role");
    }
  }

  async function handleDelete(userId: number) {
    if (!confirm("Remove this team member?")) return;
    try {
      await apiFetch(`/team/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove user");
    }
  }

  async function handlePermissionToggle(roleId: string, permission: string, enabled: boolean) {
    try {
      setSavingPermissions(roleId);
      const role = roles.find((r) => r.id === roleId);
      if (!role) return;
      const nextPermissions = enabled
        ? Array.from(new Set([...(role.permissions ?? []), permission]))
        : (role.permissions ?? []).filter((perm) => perm !== permission);

      const response = await apiFetch<{ data: RoleRecord }>(`/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: nextPermissions, name: role.name }),
      });
      setRoles((prev) => prev.map((r) => (r.id === roleId ? response.data : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update permissions");
    } finally {
      setSavingPermissions(null);
    }
  }

  const rolePermissionMap = useMemo(() => {
    return roles.reduce<Record<string, string[]>>((acc, role) => {
      acc[role.slug] = role.permissions ?? [];
      return acc;
    }, {});
  }, [roles]);

  return (
    <div className="space-y-6">
      <Card title="Team" subtitle="Invite admins, coaches, and support roles">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={handleCreate}>
          <label className="text-sm">
            Full name
            <TextInput
              className="mt-1"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            Email
            <TextInput
              type="email"
              className="mt-1"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            Role
            <SelectInput
              className="mt-1"
              value={form.role_slug}
              onChange={(event) => setForm((prev) => ({ ...prev, role_slug: event.target.value }))}
            >
              {roleOptions.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.label}
                </option>
              ))}
            </SelectInput>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={creating}>
              Add member
            </Button>
          </div>
        </form>
        {tempPassword && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Temporary password: <span className="font-semibold text-slate-900">{tempPassword}</span>
          </p>
        )}
      </Card>

      <Card title="Team directory" subtitle="Manage access for staff and contractors">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <Table
            cols={[
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              {
                key: "role",
                header: "Role",
                render: (_: unknown, row: TeamUser) => (
                  <SelectInput
                    className="w-auto rounded-lg px-2 py-1 text-sm"
                    value={row.role_slug}
                    onChange={(event) => handleRoleChange(row.id, event.target.value)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.slug} value={role.slug}>
                        {role.label}
                      </option>
                    ))}
                  </SelectInput>
                ),
              },
              {
                key: "last_login_at",
                header: "Last active",
                render: (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : "—"),
              },
              {
                key: "actions",
                header: "",
                render: (_: unknown, row: TeamUser) =>
                  row.is_primary_owner ? (
                    <span className="text-xs font-medium text-slate-400">Primary owner</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  ),
              },
            ]}
            rows={users.map((user) => ({ ...user, role: user.role_slug }))}
          />
        )}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </Card>

      <Card title="Role permissions" subtitle="Customize what each role can access">
        <div className="grid gap-4 md:grid-cols-3">
          {roleOptions.map((roleOption) => {
            const role = roles.find((r) => r.slug === roleOption.slug);
            if (!role) return null;
            const assigned = rolePermissionMap[role.slug] ?? [];
            return (
              <div key={roleOption.slug} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{roleOption.label}</p>
                    <p className="text-xs text-slate-500">{role.name}</p>
                  </div>
                  {savingPermissions === role.id && <span className="text-xs text-slate-400">Saving…</span>}
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {permissionCatalog.map((permission) => (
                    <label key={permission.key} className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={assigned.includes(permission.key)}
                        onChange={(event) => handlePermissionToggle(role.id, permission.key, event.target.checked)}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
