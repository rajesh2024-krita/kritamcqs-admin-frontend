import { useEffect, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { formatDate } from "../utils/format";
import {
  Activity,
  Clock,
  Users,
  FileText,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  BookOpen,
  Layers,
  Zap,
  Award,
  TrendingUp,
  BarChart3,
  User,
  Mail,
  Phone,
  ChevronRight,
  Eye
} from "lucide-react";

export function SessionsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  async function load(nextQuery = query) {
    setLoading(true);
    try {
      const response = await subscriptionService.listSessions({ ...nextQuery, search });
      setItems(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(query);
  }, [query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => load({ ...query, page: 1 }), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // Session type colors and icons
  const typeConfig = {
    "practice": { icon: BookOpen, color: "blue" },
    "revision": { icon: RefreshCw, color: "emerald" },
    "daily": { icon: Zap, color: "amber" },
    "mock": { icon: Award, color: "purple" },
    "smart": { icon: TrendingUp, color: "indigo" },
    "custom": { icon: Layers, color: "slate" },
  };

  const getTypeBadge = (type) => {
    const config = typeConfig[type] || typeConfig.custom;
    const Icon = config.icon;
    const colorClasses = {
      blue: "bg-blue-50 text-blue-700 border border-blue-200",
      emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      amber: "bg-amber-50 text-amber-700 border border-amber-200",
      purple: "bg-purple-50 text-purple-700 border border-purple-200",
      indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      slate: "bg-slate-100 text-slate-600 border border-slate-200",
    };
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
        colorClasses[config.color] || colorClasses.slate
      )}>
        <Icon size={8} />
        {type || "Custom"}
      </span>
    );
  };

  // Origin type badges
  const getOriginBadge = (origin) => {
    const colors = {
      "manual": "bg-slate-100 text-slate-600 border border-slate-200",
      "auto": "bg-indigo-50 text-indigo-700 border border-indigo-200",
      "system": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
    return (
      <span className={cn(
        "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
        colors[origin] || colors.manual
      )}>
        {origin || "Manual"}
      </span>
    );
  };

  // Compact input class
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const totalQuestions = items.reduce((sum, item) => sum + (item.questionIds?.length || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Sessions</h1>
              <p className="text-xs text-slate-500">Review learning and test sessions</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || items.length} sessions
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-medium text-emerald-700">
              {totalQuestions} questions
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total Sessions", value: meta?.total || items.length, icon: Activity, color: "blue" },
          { label: "Questions", value: totalQuestions, icon: FileText, color: "emerald" },
          { label: "Types", value: Object.keys(items.reduce((acc, item) => ({ ...acc, [item.type]: true }), {})).length || 0, icon: Layers, color: "purple" },
          { label: "Users", value: new Set(items.map(item => item.userId)).size || 0, icon: Users, color: "indigo" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            purple: "bg-purple-50 text-purple-600",
            indigo: "bg-indigo-50 text-indigo-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1 rounded ${colorClasses[stat.color]}`}>
                  <Icon size={12} className={colorClasses[stat.color]} />
                </div>
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search sessions by title..." />
          </div>
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => load({ ...query, page: 1 })}>
            <RefreshCw size={9} /> Refresh
          </button>
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading && <LoadingSpinner />}
      {!loading && !items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Activity size={32} className="text-slate-300" />
            <p className="text-[10px] text-slate-500">No sessions found</p>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {!loading && items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Title", "User", "Type", "Origin", "Questions", "Created"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[7px] text-slate-400">
                        {item.subtitle || "—"}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                          {(item.user?.name || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-900">{item.user?.name || item.user?.mobile || "User"}</div>
                          <div className="text-[7px] text-slate-400 truncate max-w-[100px]">{item.user?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="px-2.5 py-1.5">
                      {getOriginBadge(item.origin)}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-medium text-slate-600">
                        <FileText size={8} />
                        {item.questionIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1">
                        <Calendar size={8} className="text-slate-400" />
                        <span className="text-[7px] text-slate-400">{formatDate(item.createdAt)}</span>
                      </div>
                    </td>
                    {/* <td className="px-2.5 py-1.5">
                      <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                        <Eye size={11} />
                      </button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      )}
    </div>
  );
}