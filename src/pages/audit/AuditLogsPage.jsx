import { useEffect, useState } from "react";
import { auditService } from "../../api/auditService";
import { SearchBar } from "../../components/tables/SearchBar";
import { Pagination } from "../../components/tables/Pagination";
import { cn, ui } from "../../ui";
import {
  Shield,
  Activity,
  LogIn,
  LogOut,
  User,
  Mail,
  Calendar,
  Clock,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
  Edit,
  Trash2,
  Plus,
  Key,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Database,
  Server,
  Users,
  Globe,
  MapPin,
  Smartphone
} from "lucide-react";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function JsonCell({ value }) {
  if (!value) return <span className="text-slate-400 text-[8px]">-</span>;
  return <pre className="max-h-24 max-w-xs overflow-auto rounded bg-slate-50 p-1.5 text-[8px] text-slate-700 font-mono">{JSON.stringify(value, null, 2)}</pre>;
}

export function AuditLogsPage() {
  const [tab, setTab] = useState("activity");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 25 });

  async function load(nextQuery = query) {
    setLoading(true);
    try {
      const params = { 
        ...nextQuery,
        limit: nextQuery.limit || 25,
        search, 
        dateFrom, 
        dateTo 
      };
      const response = tab === "activity"
        ? await auditService.questionActivity({ ...params, action })
        : await auditService.loginHistory({ ...params, loginStatus: status });
      setRows(response.data || []);
      setMeta(response.meta || null);
    } catch (error) {
      // Error handled by service
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(query);
  }, [tab, query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => ({ ...current, page: 1 }));
      void load({ ...query, page: 1 });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, action, status, dateFrom, dateTo]);

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  const actionColors = {
    create: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    edit: "bg-blue-50 text-blue-700 border border-blue-200",
    delete: "bg-rose-50 text-rose-700 border border-rose-200",
    view: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  };

  const actionIcons = {
    create: Plus,
    edit: Edit,
    delete: Trash2,
    view: Eye,
  };

  const getActionBadge = (action) => {
    const Icon = actionIcons[action] || FileText;
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
        actionColors[action] || "bg-slate-100 text-slate-600 border border-slate-200"
      )}>
        <Icon size={8} />
        {action}
      </span>
    );
  };

  const handleLimitChange = (event) => {
    const limit = Number(event.target.value);
    setQuery((current) => ({ ...current, limit, page: 1 }));
    void load({ ...query, limit, page: 1 });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Audit Logs</h1>
              <p className="text-xs text-slate-500">Security monitoring and activity tracking</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || rows.length} records
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => load(query)} disabled={loading}>
              <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-1 shadow-sm inline-flex">
        {[
          { key: "activity", label: "Question Activity", icon: Activity },
          { key: "logins", label: "Login History", icon: LogIn },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => setTab(item.key)}
            >
              <Icon size={12} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee or IP..." />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {tab === "activity" ? (
              <div className="flex items-center gap-0.5">
                <Filter size={9} className="text-slate-400" />
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Action:</span>
                <select className={cn(compactSelect, "w-24")} value={action} onChange={(event) => setAction(event.target.value)}>
                  <option value="">All</option>
                  <option value="create">Create</option>
                  <option value="edit">Edit</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <Filter size={9} className="text-slate-400" />
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
                <select className={cn(compactSelect, "w-24")} value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-0.5">
              <Calendar size={9} className="text-slate-400" />
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">From:</span>
              <input className={cn(compactInput, "w-28")} type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="flex items-center gap-0.5">
              <Calendar size={9} className="text-slate-400" />
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">To:</span>
              <input className={cn(compactInput, "w-28")} type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Rows:</span>
              <select className={cn(compactSelect, "w-16")} value={query.limit} onChange={handleLimitChange}>
                {[10, 25, 50, 100].map((limit) => (
                  <option key={limit} value={limit}>{limit}</option>
                ))}
              </select>
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => load({ ...query, page: 1 })}>
              <Search size={9} /> Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "activity" ? (
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Employee", "Action", "Question ID", "Date", "Previous", "Updated"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                          {(row.employeeName || "E").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-900">{row.employeeName || "-"}</div>
                          <div className="text-[7px] text-slate-400">{row.employeeEmail || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      {getActionBadge(row.action)}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="text-[9px] font-mono text-slate-600">{row.questionId || "-"}</span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={8} className="text-slate-400" />
                        <span className="text-[8px] text-slate-500">{formatDate(row.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <JsonCell value={row.previousValue} />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <JsonCell value={row.updatedValue} />
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Shield size={20} className="text-slate-300" />
                        <span className="text-[10px] text-slate-500">No activity logs found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Employee", "Role", "Login", "Logout", "IP", "Status"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                          {(row.employeeName || "E").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-900">{row.employeeName || "-"}</div>
                          <div className="text-[7px] text-slate-400">{row.employeeEmail || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">
                        {row.role || "-"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <LogIn size={8} className="text-emerald-500" />
                        <span className="text-[8px] text-slate-500">{formatDate(row.loginTime)}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <LogOut size={8} className="text-rose-500" />
                        <span className="text-[8px] text-slate-500">{formatDate(row.logoutTime)}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <Globe size={8} className="text-slate-400" />
                        <span className="text-[8px] text-slate-500 font-mono">{row.ipAddress || "-"}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
                        row.loginStatus === "success" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}>
                        {row.loginStatus === "success" ? (
                          <CheckCircle size={8} />
                        ) : (
                          <XCircle size={8} />
                        )}
                        {row.loginStatus || "-"}
                        {row.failureReason && (
                          <span className="text-[6px] text-rose-500 ml-0.5">({row.failureReason})</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Shield size={20} className="text-slate-300" />
                        <span className="text-[10px] text-slate-500">No login history found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[8px] text-slate-400">
          Showing {rows.length} of {meta?.total || 0} records
        </span>
        <Pagination meta={meta} onChange={(page) => {
          setQuery((current) => ({ ...current, page }));
          void load({ ...query, page });
        }} />
      </div>
    </div>
  );
}