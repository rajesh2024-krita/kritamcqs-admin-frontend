import { useEffect, useMemo, useState } from "react";
import { employeeService } from "../../api/employeeService";
import { followUpService } from "../../api/followUpService";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EditIcon, PlusIcon, TrashIcon } from "../../components/common/AdminIcons";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { SearchBar } from "../../components/tables/SearchBar";
import { MODULES } from "../../config/adminPermissions";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import {
  Users,
  UserPlus,
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Briefcase,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Settings,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  X,
  Plus
} from "lucide-react";

const PERMISSIONS = [
  ["createQuestions", "Create Questions"],
  ["editQuestions", "Edit Questions"],
  ["deleteQuestions", "Delete Questions"],
  ["viewQuestions", "View Questions"],
  ["bulkUploadQuestions", "Bulk Upload Questions"],
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
  const [followUpSummary, setFollowUpSummary] = useState({});

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
      const summary = await followUpService.employeeSummary();
      setFollowUpSummary(Object.fromEntries((summary.data || []).map((item) => [item.id, item])));
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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  const activeCount = items.filter(item => item.isActive !== false).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Users size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Employees</h1>
              <p className="text-xs text-slate-500">Manage employee accounts and permissions</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[8px] font-medium text-emerald-700">
              {activeCount} active
            </span>
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {items.length} employees
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={startCreate}>
              <UserPlus size={10} /> New
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        {/* Employees List */}
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex-1 mr-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors flex-shrink-0" onClick={() => load()}>
              <RefreshCw size={9} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-1">
                <Users size={24} className="text-slate-300" />
                <span className="text-[10px] text-slate-500">No employees found</span>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const summary = followUpSummary[item.id] || {};
                const isActive = item.isActive !== false;
                return (
                  <div key={item.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900">{item.name}</span>
                            <span className={cn(
                              "inline-flex px-1.5 py-0.5 rounded text-[6px] font-medium",
                              isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="text-[8px] text-slate-400">{item.email}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-0.5">
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => startEdit(item)}>
                          <Edit size={11} />
                        </button>
                        {isActive && (
                          <button className="p-0.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" onClick={() => deactivate(item)}>
                            <Lock size={11} />
                          </button>
                        )}
                        <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => setDeleteItem(item)}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-2 sm:grid-cols-4">
                      <div className="bg-slate-50 rounded border border-slate-200/50 px-2 py-1">
                        <span className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Follow-ups</span>
                        <div className="text-xs font-bold text-slate-900">{summary.totalFollowUps || 0}</div>
                      </div>
                      <div className="bg-slate-50 rounded border border-slate-200/50 px-2 py-1">
                        <span className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Pending</span>
                        <div className="text-xs font-bold text-amber-600">{summary.followUpCounts?.Pending || 0}</div>
                      </div>
                      <div className="bg-slate-50 rounded border border-slate-200/50 px-2 py-1">
                        <span className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Progress</span>
                        <div className="text-xs font-bold text-blue-600">{summary.followUpCounts?.Progress || 0}</div>
                      </div>
                      <div className="bg-slate-50 rounded border border-slate-200/50 px-2 py-1">
                        <span className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Completed</span>
                        <div className="text-xs font-bold text-emerald-600">{summary.followUpCounts?.Completed || 0}</div>
                      </div>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-0.5">
                      {MODULES.filter((module) => item.modulePermissions?.[module.key]?.view).slice(0, 4).map((module) => (
                        <span key={module.key} className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[6px] font-medium text-indigo-700">
                          {module.label}
                        </span>
                      ))}
                      {MODULES.filter((module) => item.modulePermissions?.[module.key]?.view).length > 4 && (
                        <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[6px] font-medium text-slate-500">
                          +{MODULES.filter((module) => item.modulePermissions?.[module.key]?.view).length - 4}
                        </span>
                      )}
                      {MODULES.filter((module) => item.modulePermissions?.[module.key]?.view).length === 0 && (
                        <span className="text-[7px] text-slate-400">No modules assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Sidebar */}
        <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-2 h-fit" onSubmit={submit}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            {editing ? <Edit size={14} className="text-indigo-600" /> : <UserPlus size={14} className="text-indigo-600" />}
            <h2 className="text-xs font-semibold text-slate-900">{editing ? "Edit Employee" : "Create Employee"}</h2>
            {editing && (
              <button type="button" className="ml-auto p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors" onClick={startCreate}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Name</label>
              <input className={compactInput} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Email</label>
              <input className={compactInput} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Password</label>
              <input className={compactInput} type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required={!editing} placeholder={editing ? "Leave blank to keep" : "Min 8 characters"} />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-0.5">
              <ToggleSwitch checked={form.isActive} onChange={(value) => setForm((current) => ({ ...current, isActive: value }))} label="" size="sm" />
              <span className="text-[8px] font-medium text-slate-700">Employee Active</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 max-h-[300px] overflow-y-auto space-y-1.5">
            <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider block">Module Permissions</span>
            {MODULES.map((module) => {
              const permission = form.modulePermissions[module.key] || {};
              return (
                <div key={module.key} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                  <div className="text-[8px] font-semibold text-slate-700 mb-1">{module.label}</div>
                  <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
                    {["view", "create", "edit", "delete"].map((action) => (
                      <div key={action} className="flex items-center gap-0.5">
                        <ToggleSwitch
                          checked={Boolean(permission[action])}
                          onChange={(value) => setForm((current) => ({
                            ...current,
                            modulePermissions: {
                              ...current.modulePermissions,
                              [module.key]: { ...(current.modulePermissions[module.key] || {}), [action]: value },
                            },
                          }))}
                          label=""
                          size="sm"
                        />
                        <span className="text-[6px] font-medium text-slate-500">{action.slice(0, 1).toUpperCase()}{action.slice(1)}</span>
                      </div>
                    ))}
                    {module.key === "questions" && (
                      <div className="flex items-center gap-0.5">
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
                          label=""
                          size="sm"
                        />
                        <span className="text-[6px] font-medium text-slate-500">Bulk</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button className={cn(
            "w-full inline-flex items-center justify-center gap-1 px-3 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
          )} type="submit">
            <Save size={10} /> {editing ? "Update" : "Create"}
          </button>
        </form>
      </div>

      {/* Delete Modal */}
      <ConfirmDeleteModal open={Boolean(deleteItem)} title="Delete Employee" description="This removes the employee account permanently." onCancel={() => setDeleteItem(null)} onConfirm={confirmDelete} />
    </div>
  );
}