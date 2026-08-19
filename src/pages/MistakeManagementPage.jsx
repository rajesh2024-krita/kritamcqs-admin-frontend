import { useEffect, useState } from "react";
import { insightsService } from "../api/insightsService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { MathText } from "../components/common/MathText";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { 
  AlertCircle, 
  RefreshCw, 
  Users, 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  Target,
  Zap,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Crown,
  Layers
} from "lucide-react";

export function MistakeManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setData(await insightsService.getMistakes());
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading && !data) return <LoadingSpinner label="Loading mistake management..." />;

  const summary = data?.summary || {};

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg shadow-lg shadow-rose-500/25">
              <AlertCircle size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Mistake Management</h1>
              <p className="text-xs text-slate-500">Track frequently incorrect questions and user mistake analytics</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => { setLoading(true); insightsService.getMistakes().then(setData).catch(toast.error).finally(() => setLoading(false)); }} type="button">
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Active Mistakes", value: summary.activeMistakes || 0, icon: AlertCircle, color: "rose" },
          { label: "Repeated Mistakes", value: summary.repeatedMistakes || 0, icon: RefreshCw, color: "amber" },
          { label: "Weak Mistakes", value: summary.weakMistakes || 0, icon: AlertTriangle, color: "orange" },
          { label: "Tracked Questions", value: summary.trackedQuestions || 0, icon: BookOpen, color: "blue" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            rose: "bg-rose-50 text-rose-600",
            amber: "bg-amber-50 text-amber-600",
            orange: "bg-orange-50 text-orange-600",
            blue: "bg-blue-50 text-blue-600",
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

      {/* Frequently Incorrect Questions */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertTriangle size={14} className="text-rose-600" />
          <h2 className="text-xs font-semibold text-slate-900">Frequently Incorrect Questions</h2>
          <span className="text-[8px] text-slate-400">({data?.frequentIncorrectQuestions?.length || 0})</span>
        </div>
        {data?.frequentIncorrectQuestions?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Question</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Subject</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Chapter</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Difficulty</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Attempts</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Wrong</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Wrong %</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.frequentIncorrectQuestions.map((row) => (
                  <tr key={row.questionId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-1.5">
                      <MathText className="text-[9px] text-slate-700 line-clamp-2 max-w-xs">{row.question}</MathText>
                    </td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.subjectName}</td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.chapterName}</td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                        row.difficulty === "easy" ? "bg-emerald-50 text-emerald-700" :
                        row.difficulty === "medium" ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700"
                      )}>
                        {row.difficulty}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.attempts}</td>
                    <td className="px-2 py-1.5 text-[9px] text-rose-600 font-medium">{row.wrong}</td>
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[8px] font-medium",
                        row.wrongRate >= 60 ? "bg-rose-50 text-rose-700" :
                        row.wrongRate >= 30 ? "bg-amber-50 text-amber-700" :
                        "bg-emerald-50 text-emerald-700"
                      )}>
                        {row.wrongRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No mistake data" description="Incorrect question analytics will appear after submissions." />
        )}
      </div>

      {/* Two Column Layout - Topic Reports & Difficulty Analysis */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Topic-wise Mistake Reports */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <Layers size={14} className="text-indigo-600" />
            <h2 className="text-xs font-semibold text-slate-900">Topic-wise Mistake Reports</h2>
            <span className="text-[8px] text-slate-400">({data?.topicReports?.length || 0})</span>
          </div>
          {data?.topicReports?.length ? (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {data.topicReports.map((item) => (
                <div key={item.chapterId} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-slate-900">{item.chapterName}</div>
                      <div className="text-[8px] text-slate-500">{item.subjectName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-600">{item.wrong} / {item.attempts}</span>
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                          item.wrongRate >= 60 ? "bg-rose-50 text-rose-700" :
                          item.wrongRate >= 30 ? "bg-amber-50 text-amber-700" :
                          "bg-emerald-50 text-emerald-700"
                        )}>
                          {item.wrongRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        item.wrongRate >= 60 ? "bg-rose-500" :
                        item.wrongRate >= 30 ? "bg-amber-500" :
                        "bg-emerald-500"
                      )}
                      style={{ width: `${item.wrongRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No topic reports" description="Topic-wise data will appear as users attempt questions." />
          )}
        </div>

        {/* Difficulty-level Analysis */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <BarChart3 size={14} className="text-purple-600" />
            <h2 className="text-xs font-semibold text-slate-900">Difficulty-level Analysis</h2>
            <span className="text-[8px] text-slate-400">({data?.difficultyReports?.length || 0})</span>
          </div>
          {data?.difficultyReports?.length ? (
            <div className="space-y-1.5">
              {data.difficultyReports.map((item) => {
                const colors = {
                  easy: "bg-emerald-50 border-emerald-200 text-emerald-700",
                  medium: "bg-amber-50 border-amber-200 text-amber-700",
                  hard: "bg-rose-50 border-rose-200 text-rose-700",
                };
                const iconColors = {
                  easy: "text-emerald-600",
                  medium: "text-amber-600",
                  hard: "text-rose-600",
                };
                return (
                  <div key={item.difficulty} className={`rounded-lg border p-2.5 ${colors[item.difficulty] || colors.medium}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${colors[item.difficulty]}`}>
                          {item.difficulty === "easy" ? <Zap size={12} className={iconColors[item.difficulty]} /> :
                           item.difficulty === "medium" ? <Target size={12} className={iconColors[item.difficulty]} /> :
                           <AlertCircle size={12} className={iconColors[item.difficulty]} />}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold capitalize">{item.difficulty}</div>
                          <div className="text-[8px] opacity-75">{item.questions} flagged questions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{item.wrongRate}%</div>
                        <div className="text-[7px] opacity-75">wrong rate</div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          item.difficulty === "easy" ? "bg-emerald-500" :
                          item.difficulty === "medium" ? "bg-amber-500" :
                          "bg-rose-500"
                        )}
                        style={{ width: `${item.wrongRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No difficulty data" description="Difficulty analysis will appear after submissions." />
          )}
        </div>
      </div>

      {/* User Mistake Analytics */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <Users size={14} className="text-indigo-600" />
          <h2 className="text-xs font-semibold text-slate-900">User Mistake Analytics</h2>
          <span className="text-[8px] text-slate-400">({data?.userMistakeAnalytics?.length || 0})</span>
        </div>
        {data?.userMistakeAnalytics?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">User</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Plan</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Chapter</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Attempts</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Status</span></th>
                  <th className="px-2 py-1 text-left"><span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Correction</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.userMistakeAnalytics.map((row) => (
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
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.chapterName}</td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-600">{row.attempts}</td>
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
                    <td className="px-2 py-1.5">
                      <span className={cn(
                        "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                        row.status === "improving" ? "bg-emerald-50 text-emerald-700" :
                        row.status === "stable" ? "bg-blue-50 text-blue-700" :
                        row.status === "declining" ? "bg-rose-50 text-rose-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {row.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[8px] text-slate-500 max-w-[200px]">
                      Review question, explanation, and answer key in Question Management.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No user mistake analytics" description="User mistake data will appear after submissions." />
        )}
      </div>
    </div>
  );
}