import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { followUpService } from "../../api/followUpService";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Crown,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  UserCheck,
  UserX,
  ChevronRight,
  Filter,
  RefreshCw,
  MessageSquare,
  Activity,
  Zap,
  TrendingUp,
  BarChart3
} from "lucide-react";

const tabs = ["All", "Pending", "Progress", "Completed", "Cancelled"];
const fmt = v => v ? new Date(v).toLocaleString() : "—";

const statusColors = {
  Pending: "bg-amber-50 border-amber-200 text-amber-700",
  Progress: "bg-blue-50 border-blue-200 text-blue-700",
  Completed: "bg-emerald-50 border-emerald-200 text-emerald-700",
  Cancelled: "bg-rose-50 border-rose-200 text-rose-700",
};

const statusIcons = {
  Pending: ClockIcon,
  Progress: Activity,
  Completed: CheckCircle,
  Cancelled: UserX,
};

export function FollowUpsPage() {
  const toast = useToast();
  const [status, setStatus] = useState("All");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ counts: {} });
  const [loading, setLoading] = useState(false);

  const load = async (s = status) => {
    setLoading(true);
    try {
      const r = await followUpService.list({ status: s === "All" ? undefined : s, limit: 50 });
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
  }, [status]);

  const getStatusBadge = (status) => {
    const Icon = statusIcons[status] || AlertCircle;
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-medium border",
        statusColors[status] || "bg-slate-50 border-slate-200 text-slate-600"
      )}>
        <Icon size={8} />
        {status}
      </span>
    );
  };

  // Calculate statistics
  const totalCount = items.length;
  const statusCounts = {
    Pending: meta.counts?.Pending || 0,
    Progress: meta.counts?.Progress || 0,
    Completed: meta.counts?.Completed || 0,
    Cancelled: meta.counts?.Cancelled || 0,
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <MessageSquare size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Employee Follow-Ups</h1>
              <p className="text-xs text-slate-500">One connected history for every assigned user</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {totalCount} follow-ups
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => void load()} type="button">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Total", value: totalCount, color: "indigo" },
          { label: "Pending", value: statusCounts.Pending, color: "amber" },
          { label: "Progress", value: statusCounts.Progress, color: "blue" },
          { label: "Completed", value: statusCounts.Completed, color: "emerald" },
          { label: "Cancelled", value: statusCounts.Cancelled, color: "rose" },
        ].map((stat) => {
          const colorClasses = {
            indigo: "bg-indigo-50 text-indigo-600",
            amber: "bg-amber-50 text-amber-600",
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            rose: "bg-rose-50 text-rose-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-2 py-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold", colorClasses[stat.color])}>
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map(t => {
            const count = t === "All" ? totalCount : meta.counts?.[t] || 0;
            const isActive = status === t;
            return (
              <button
                key={t}
                onClick={() => setStatus(t)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                )}
              >
                {t}
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[16px] px-1 py-0.5 rounded text-[8px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                {["User", "Contact", "Employee", "Exam", "Plan", "Last Follow-Up", "Next Follow-Up", "Conv.", "Status", "Actions"].map(x => (
                  <th key={x} className="px-2.5 py-1.5 text-left">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                        {(f.user?.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-900">{f.user?.name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="text-[9px] text-slate-600">{f.user?.mobile || "—"}</div>
                    <div className="text-[8px] text-slate-400">{f.user?.email || "—"}</div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1">
                      <Briefcase size={9} className="text-slate-400" />
                      <span className="text-[9px] text-slate-600">{f.assignedEmployee?.employeeName || "—"}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">
                      {f.user?.examMode || "—"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                      f.user?.isPremium ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {f.user?.isPremium ? "Premium" : "Free"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1">
                      <Clock size={8} className="text-slate-400" />
                      <span className="text-[8px] text-slate-500">{fmt(f.lastFollowUpAt)}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar size={8} className="text-slate-400" />
                      <span className="text-[8px] text-slate-500">{fmt(f.nextFollowUpAt)}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-medium text-slate-600">
                      <MessageSquare size={8} />
                      {f.conversationCount || 0}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    {getStatusBadge(f.status)}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <Link
                      to={`/follow-ups/${f.id}`}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-medium rounded-lg transition-colors shadow-sm shadow-indigo-500/25"
                    >
                      Open <ChevronRight size={9} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan="10" className="px-4 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500">No follow-ups in this status</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 py-1">
          <span className="text-[8px] text-slate-400">
            Showing {items.length} follow-up{items.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3 text-[8px] text-slate-400">
            <span>Status: <span className="font-medium text-slate-600">{status}</span></span>
            <span className="text-slate-300">|</span>
            <span>Total: <span className="font-medium text-slate-600">{totalCount}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}