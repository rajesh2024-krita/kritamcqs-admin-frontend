import { useEffect, useState } from "react";
import { insightsService } from "../api/insightsService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { 
  TrendingDown, 
  Users, 
  Target, 
  Award, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  BarChart3,
  BookOpen,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Zap,
  Layers,
  User,
  Crown,
  Clock,
  Activity
} from "lucide-react";

const blankCategory = { name: "", description: "", isActive: true };

export function WeakAreaManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [category, setCategory] = useState(blankCategory);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setData(await insightsService.getWeakAreas());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCategory(event) {
    event.preventDefault();
    try {
      if (editingId) await insightsService.updateWeakAreaCategory(editingId, category);
      else await insightsService.createWeakAreaCategory(category);
      setCategory(blankCategory);
      setEditingId(null);
      toast.success("Weak area category saved");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteCategory(id) {
    try {
      await insightsService.deleteWeakAreaCategory(id);
      toast.success("Weak area category removed");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading && !data) return <LoadingSpinner label="Loading weak area management..." />;

  const summary = data?.summary || {};
  const categories = data?.categories || [];

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactTextarea = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[50px]";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <TrendingDown size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Weak Area Management</h1>
              <p className="text-xs text-slate-500">Monitor weak areas, topic trends, and improvement analytics</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={load} type="button">
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Tracked Areas", value: summary.trackedAreas || 0, icon: Layers, color: "blue" },
          { label: "Active Weak Areas", value: summary.totalWeakAreas || 0, icon: AlertCircle, color: "amber" },
          { label: "Users Affected", value: summary.usersAffected || 0, icon: Users, color: "rose" },
          { label: "Mastered Areas", value: summary.masteredAreas || 0, icon: Award, color: "emerald" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            rose: "bg-rose-50 text-rose-600",
            emerald: "bg-emerald-50 text-emerald-600",
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

      {/* Two Column Layout */}
      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        {/* Common Weak Topics Table */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <BarChart3 size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Most Common Weak Topics</h2>
            <span className="text-[8px] text-slate-400">({data?.commonWeakTopics?.length || 0})</span>
          </div>
          {data?.commonWeakTopics?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Topic</span></th>
                    <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Subject</span></th>
                    <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Users</span></th>
                    <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Wrong</span></th>
                    <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.commonWeakTopics || []).map((row) => (
                    <tr key={row.chapterId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2 py-1 text-[9px] text-slate-700 font-medium">{row.chapterName}</td>
                      <td className="px-2 py-1 text-[9px] text-slate-600">{row.subjectName}</td>
                      <td className="px-2 py-1 text-[9px] text-slate-600">{row.affectedUsers}</td>
                      <td className="px-2 py-1 text-[9px] text-rose-600 font-medium">{row.wrongCount}</td>
                      <td className="px-2 py-1">
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[8px] font-medium",
                          row.averageAccuracy >= 70 ? "bg-emerald-50 text-emerald-700" :
                          row.averageAccuracy >= 40 ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {row.averageAccuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No weak topics found" description="Weak topics will appear as users answer questions incorrectly." />
          )}
        </div>

        {/* Categories Form */}
        <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3" onSubmit={saveCategory}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Weak Area Categories</h2>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Category Name</label>
              <input className={compactInput} value={category.name} onChange={(event) => setCategory((current) => ({ ...current, name: event.target.value }))} placeholder="Enter category name" />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Description</label>
              <textarea className={compactTextarea} rows={2} value={category.description} onChange={(event) => setCategory((current) => ({ ...current, description: event.target.value }))} placeholder="Enter description" />
            </div>
            <label className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600">
              <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={category.isActive} onChange={(event) => setCategory((current) => ({ ...current, isActive: event.target.checked }))} />
              Active
            </label>
          </div>

          <div className="flex gap-1.5 pt-1">
            <button className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
              editingId ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25"
            )} type="submit">
              {editingId ? <Edit size={10} /> : <Plus size={10} />}
              {editingId ? "Update" : "Add"} Category
            </button>
            {editingId && (
              <button className="inline-flex items-center px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded-lg transition-colors" type="button" onClick={() => { setEditingId(null); setCategory(blankCategory); }}>
                Cancel
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 max-h-[280px] overflow-y-auto">
            {categories.map((item) => (
              <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-900">{item.name}</span>
                      <span className={cn(
                        "inline-flex px-1 py-0.5 rounded text-[6px] font-medium uppercase tracking-wider",
                        item.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[8px] text-slate-500 truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" type="button" onClick={() => { setEditingId(item.id); setCategory({ name: item.name, description: item.description || "", isActive: item.isActive !== false }); }}>
                      <Edit size={10} />
                    </button>
                    <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" type="button" onClick={() => deleteCategory(item.id)}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!categories.length && (
              <div className="text-[9px] text-slate-400 text-center py-2">No categories added yet</div>
            )}
          </div>
        </form>
      </div>

      {/* User-wise Weak Area Analytics */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <Users size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">User-wise Weak Area Analytics</h2>
          <span className="text-[8px] text-slate-400">({data?.userAnalytics?.length || 0})</span>
        </div>
        {data?.userAnalytics?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">User</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Plan</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Subject</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Chapter</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Attempts</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Wrong</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Incorrect IDs</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.userAnalytics.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[7px] font-bold">
                          {(row.userName || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-[9px] font-medium text-slate-900">{row.userName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                        row.isPremium ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"
                      )}>
                        {row.isPremium ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.subjectName}</td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.chapterName}</td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.attempts}</td>
                    <td className="px-2 py-1.5 text-[9px] text-rose-600 font-medium">{row.wrongCount}</td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[8px] font-medium",
                        row.accuracy >= 70 ? "bg-emerald-50 text-emerald-700" :
                        row.accuracy >= 40 ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      )}>
                        {row.accuracy}%
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[8px] text-slate-400 font-mono">
                      {(row.incorrectQuestionIds || []).slice(0, 3).join(", ")}
                      {(row.incorrectQuestionIds || []).length > 3 && ` +${(row.incorrectQuestionIds || []).length - 3} more`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No weak areas" description="Weak areas will appear after users answer questions incorrectly." />
        )}
      </div>

      {/* Improvement Trends */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <TrendingUp size={14} className="text-emerald-600" />
          <h2 className="text-xs font-semibold text-slate-900">Improvement Trends</h2>
          <span className="text-[8px] text-slate-400">({data?.improvementTrends?.length || 0})</span>
        </div>
        {data?.improvementTrends?.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.improvementTrends || []).map((item) => (
              <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5 hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold">
                      {(item.userName || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-900">{item.userName}</div>
                      <div className="text-[8px] text-slate-500">{item.subjectName} / {item.chapterName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">+{item.improvementPercentage}%</div>
                    <div className="text-[7px] text-slate-400">{item.accuracy}% accuracy</div>
                  </div>
                </div>
                <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${Math.min(item.improvementPercentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No improvement trends" description="Improvement data will appear as users progress." />
        )}
      </div>
    </div>
  );
}