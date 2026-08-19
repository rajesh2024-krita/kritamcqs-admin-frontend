import { useEffect, useState } from "react";
import { followUpService } from "../../api/followUpService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { cn, ui } from "../../ui";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Crown,
  Shield,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Briefcase
} from "lucide-react";

const statuses = ["Pending", "Progress", "Completed", "Cancelled"];
const fmt = (v) => v ? new Date(v).toLocaleString() : "—";

export function UserManagementPage() {
  const toast = useToast();
  const { admin } = useAuth();
  const employeeAccount = admin?.adminRole === "employee";
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    examMode: "",
    plan: "",
    followUpStatus: "",
    employeeId: "",
    from: "",
    to: "",
    page: 1,
    limit: 20,
  });

  const load = async (next = filters) => {
    setLoading(true);
    try {
      const r = await followUpService.users(next);
      setItems(r.data || []);
      setMeta(r.meta || {});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    followUpService.employees()
      .then(r => setEmployees(r.data || []))
      .catch(() => setEmployees([]));
  }, []);

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 }));
  const apply = (e) => { e.preventDefault(); void load({ ...filters, page: 1 }); };

  const assign = async (user, employeeId) => {
    if (!employeeAccount && !employeeId) return;
    try {
      await followUpService.assign(user.id, employeeAccount ? admin.id : employeeId);
      toast.success(employeeAccount ? "User assigned to you" : user.followUp ? "Follow-up reassigned" : "User added to follow-up");
      setAssigning(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

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
              <h1 className="text-sm font-semibold text-slate-900">User Management</h1>
              <p className="text-xs text-slate-500">Manage users and follow-up assignments</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta.total || 0} users
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => void load()} type="button">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <form onSubmit={apply} className="flex flex-col gap-1.5">
          {/* Filter Row 1 */}
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-0.5 flex-1 min-w-[120px]">
              <Search size={10} className="text-slate-400 absolute left-2" />
              <input className={cn(compactInput, "pl-6")} placeholder="Name" value={filters.name} onChange={e => set("name", e.target.value)} />
            </div>
            <input className={cn(compactInput, "flex-1 min-w-[120px]")} placeholder="Email" value={filters.email} onChange={e => set("email", e.target.value)} />
            <select className={cn(compactSelect, "flex-1 min-w-[80px]")} value={filters.examMode} onChange={e => set("examMode", e.target.value)}>
              <option value="">All exams</option>
              <option>NEET</option>
              <option>JEE</option>
              <option>Both</option>
            </select>
            <select className={cn(compactSelect, "flex-1 min-w-[80px]")} value={filters.plan} onChange={e => set("plan", e.target.value)}>
              <option value="">All plans</option>
              <option>Free</option>
              <option>Premium</option>
            </select>
            <select className={cn(compactSelect, "flex-1 min-w-[100px]")} value={filters.followUpStatus} onChange={e => set("followUpStatus", e.target.value)}>
              <option value="">All follow-ups</option>
              <option>Unassigned</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Filter Row 2 */}
          <div className="flex flex-wrap items-center gap-1">
            {!employeeAccount && (
              <select className={cn(compactSelect, "flex-1 min-w-[120px]")} value={filters.employeeId} onChange={e => set("employeeId", e.target.value)}>
                <option value="">All employees</option>
                {employees.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            )}
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">From:</span>
              <input className={cn(compactInput, "w-28")} type="date" value={filters.from} onChange={e => set("from", e.target.value)} />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">To:</span>
              <input className={cn(compactInput, "w-28")} type="date" value={filters.to} onChange={e => set("to", e.target.value)} />
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-medium rounded transition-colors" type="submit">
              <Filter size={9} /> Apply
            </button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-medium rounded transition-colors" type="button" onClick={() => {
              setFilters({ name: "", email: "", examMode: "", plan: "", followUpStatus: "", employeeId: "", from: "", to: "", page: 1, limit: 20 });
              void load({ ...filters, page: 1, name: "", email: "", examMode: "", plan: "", followUpStatus: "", employeeId: "", from: "", to: "" });
            }}>
              <X size={9} /> Clear
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                {["User", "Contact", "Device", "Exam", "Plan", "Created", "Follow-Up", "Actions"].map(x => (
                  <th key={x} className="px-2.5 py-1.5 text-left">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                        {(u.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-900">{u.name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="text-[9px] text-slate-600">{u.mobile || "—"}</div>
                    <div className="text-[8px] text-slate-400">{u.email || "—"}</div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="text-[9px] text-slate-600">{u.deviceName || "—"}</span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">
                      {u.examMode || "—"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                      u.isPremium ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {u.isPremium ? "Premium" : "Free"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="text-[8px] text-slate-500">{fmt(u.createdAt)}</div>
                    <div className="text-[7px] text-slate-400">Last: {fmt(u.lastLoginAt)}</div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    {u.followUp ? (
                      <div>
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                          u.followUp.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          u.followUp.status === "Progress" ? "bg-blue-50 text-blue-700" :
                          u.followUp.status === "Pending" ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {u.followUp.status}
                        </span>
                        <div className="text-[7px] text-slate-400">{u.followUp.assignedEmployee?.employeeName}</div>
                      </div>
                    ) : (
                      <span className="text-[8px] text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => setDetail(u)}>
                        <Eye size={11} />
                      </button>
                      {employeeAccount ? (
                        u.followUp ? (
                          <span className="text-[7px] font-medium text-emerald-600">Assigned</span>
                        ) : (
                          <button className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" onClick={() => void assign(u)}>
                            <UserPlus size={11} />
                          </button>
                        )
                      ) : (
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => setAssigning(u)}>
                          <Briefcase size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !items.length && (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500">No users match these filters</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1">
        <span className="text-[8px] text-slate-400">{meta.total || 0} users</span>
        <div className="flex items-center gap-1">
          <button
            disabled={meta.page <= 1}
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded transition-colors text-[8px] font-medium",
              meta.page <= 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"
            )}
            onClick={() => { const n = { ...filters, page: meta.page - 1 }; setFilters(n); void load(n); }}
          >
            <ChevronLeft size={10} /> Prev
          </button>
          <span className="text-[8px] text-slate-500 px-1">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded transition-colors text-[8px] font-medium",
              meta.page >= meta.totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"
            )}
            onClick={() => { const n = { ...filters, page: meta.page + 1 }; setFilters(n); void load(n); }}
          >
            Next <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* Assign Modal */}
      {!employeeAccount && assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setAssigning(null)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Assign {assigning.name || "user"}</h2>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setAssigning(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-slate-500 mb-3">Choose the employee responsible for this follow-up.</p>
              <select className={compactSelect} defaultValue="" onChange={e => void assign(assigning, e.target.value)}>
                <option value="" disabled>Select employee</option>
                {employees.map(x => (
                  <option key={x.id} value={x.id}>{x.name} — {x.email}</option>
                ))}
              </select>
              <button className="mt-3 px-3 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded-lg transition-colors" onClick={() => setAssigning(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {(detail.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{detail.name || "Unnamed"}</h2>
                  <p className="text-[10px] text-slate-500">{detail.email || detail.mobile || "No contact"}</p>
                </div>
              </div>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setDetail(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-72px)]">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["Name", detail.name],
                  ["Mobile", detail.mobile],
                  ["Email", detail.email],
                  ["Address", [detail.address, detail.city, detail.state, detail.country].filter(Boolean).join(", ")],
                  ["Device", detail.deviceName],
                  ["Exam Mode", detail.examMode],
                  ["Level", detail.level],
                  ["Plan", detail.isPremium ? `Premium${detail.premiumExpiresAt ? ` until ${fmt(detail.premiumExpiresAt)}` : ""}` : "Free"],
                  ["Created", fmt(detail.createdAt)],
                  ["Last Login", fmt(detail.lastLoginAt)],
                  ["Assigned Employee", detail.followUp?.assignedEmployee?.employeeName || "Unassigned"],
                  ["Follow-up Status", detail.followUp?.status || "Not added"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                    <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{k}</div>
                    <div className="text-[10px] text-slate-900 mt-0.5">{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}