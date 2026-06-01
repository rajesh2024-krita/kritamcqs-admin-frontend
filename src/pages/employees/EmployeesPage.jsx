import { useEffect, useMemo, useState } from "react";
import { employeeService } from "../../api/employeeService";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/common/AdminIcons";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { SearchBar } from "../../components/tables/SearchBar";
import { MODULES } from "../../config/adminPermissions";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const PERMISSIONS = [
  ["createQuestions", "Create Questions"],
  ["editQuestions", "Edit Questions"],
  ["deleteQuestions", "Delete Questions"],
  ["viewQuestions", "View Questions"],
  ["bulkUploadQuestions", "Bulk Upload Questions"],
  ["createManualQuestions", "Create Manual Questions"],
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  isActive: true,
  employeePermissions: Object.fromEntries(PERMISSIONS.map(([key]) => [key, false])),
  modulePermissions: Object.fromEntries(MODULES.map((module) => [module.key, { view: false, create: false, edit: false, delete: false, bulkUpload: false }])),
};

export function EmployeesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(term));
  }, [items, search]);

  async function load() {
    setLoading(true);
    try {
      const response = await employeeService.list({ limit: 100, search });
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      email: item.email || "",
      password: "",
      isActive: item.isActive !== false,
      employeePermissions: { ...emptyForm.employeePermissions, ...(item.employeePermissions || {}) },
      modulePermissions: {
        ...emptyForm.modulePermissions,
        ...(item.modulePermissions || {}),
      },
    });
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      employeePermissions: { ...form.employeePermissions },
      modulePermissions: { ...form.modulePermissions },
    };
    if (editing && !payload.password) delete payload.password;
    try {
      if (editing) {
        await employeeService.update(editing.id, payload);
        toast.success("Employee updated");
      } else {
        await employeeService.create(payload);
        toast.success("Employee created");
      }
      startCreate();
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function confirmDelete() {
    try {
      await employeeService.remove(deleteItem.id);
      toast.success("Employee deleted");
      setDeleteItem(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deactivate(item) {
    try {
      await employeeService.deactivate(item.id);
      toast.success("Employee deactivated");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Employee Management</div>
            <p className={ui.muted}>Create, edit, deactivate, and delete employee admin accounts.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={startCreate}><PlusIcon size={16} /> New Employee</button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
        <div className="mt-4 overflow-x-auto rounded-sm border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Permissions</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3"><strong>{item.name}</strong><div className="text-xs text-slate-500">{item.email}</div></td>
                  <td className="px-4 py-3">{item.isActive !== false ? "Active" : "Deactivated"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{MODULES.filter((module) => item.modulePermissions?.[module.key]?.view).map((module) => module.label).join(", ") || "No modules"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => startEdit(item)}><EditIcon size={16} /> Edit</button>
                      {item.isActive !== false ? <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => deactivate(item)}>Deactivate</button> : null}
                      <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(item)}><TrashIcon size={16} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredItems.length === 0 ? <tr><td className="px-4 py-6 text-slate-500" colSpan={4}>No employees found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <form className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60" onSubmit={submit}>
        <div className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">{editing ? "Edit Employee" : "Create Employee"}</div>
        <div className="space-y-4">
          <label className={ui.field}><span>Name</span><input className={ui.input} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></label>
          <label className={ui.field}><span>Email</span><input className={ui.input} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></label>
          <label className={ui.field}><span>Password</span><input className={ui.input} type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required={!editing} placeholder={editing ? "Leave blank to keep current password" : ""} /></label>
          <ToggleSwitch checked={form.isActive} onChange={(value) => setForm((current) => ({ ...current, isActive: value }))} label="Employee Active" />
          <div className="space-y-3">
            {MODULES.map((module) => {
              const permission = form.modulePermissions[module.key] || {};
              return (
                <div key={module.key} className="rounded-sm border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-black text-slate-900">{module.label}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {["view", "create", "edit", "delete"].map((action) => (
                      <ToggleSwitch
                        key={action}
                        checked={Boolean(permission[action])}
                        onChange={(value) => setForm((current) => ({
                          ...current,
                          modulePermissions: {
                            ...current.modulePermissions,
                            [module.key]: { ...(current.modulePermissions[module.key] || {}), [action]: value },
                          },
                        }))}
                        label={`${action.slice(0, 1).toUpperCase()}${action.slice(1)}`}
                      />
                    ))}
                    {module.key === "questions" ? (
                      <ToggleSwitch
                        checked={Boolean(permission.bulkUpload)}
                        onChange={(value) => setForm((current) => ({
                          ...current,
                          employeePermissions: { ...current.employeePermissions, bulkUploadQuestions: value },
                          modulePermissions: {
                            ...current.modulePermissions,
                            questions: { ...(current.modulePermissions.questions || {}), bulkUpload: value },
                          },
                        }))}
                        label="Bulk Upload"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary, "w-full justify-center")} type="submit">{editing ? "Save Employee" : "Create Employee"}</button>
        </div>
      </form>

      <ConfirmDeleteModal open={Boolean(deleteItem)} title="Delete Employee" description="This removes the employee account permanently." onCancel={() => setDeleteItem(null)} onConfirm={confirmDelete} />
    </div>
  );
}
