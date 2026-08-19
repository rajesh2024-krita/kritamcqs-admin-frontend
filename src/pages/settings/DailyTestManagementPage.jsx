import { useEffect, useState } from "react";
import { dailyTestManagementService } from "../../api/dailyTestManagementService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import { 
  Settings, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  BarChart3, 
  Layers, 
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";

const defaultSettings = {
  exam_type: "BOTH",
  total_questions: 20,
  new_questions: 10,
  weak_questions: 5,
  revision_questions: 5,
  easy_percentage: 30,
  moderate_percentage: 40,
  hard_percentage: 30,
  enabled: true,
  allow_both_exams_same_day: false,
  subject_distribution: {
    NEET: { Biology: 0, Chemistry: 0, Physics: 0 },
    JEE: { Mathematics: 0, Chemistry: 0, Physics: 0 },
  },
  adaptive_mode_enabled: true,
  repeat_lookback_sessions: 5,
  max_repeated_questions: 2,
  low_performance_ratio: { easy: 70, moderate: 20, hard: 10 },
  medium_performance_ratio: { easy: 40, moderate: 40, hard: 20 },
  high_performance_ratio: { easy: 15, moderate: 45, hard: 40 },
  mixed_mode_ratio: { easy: 34, moderate: 33, hard: 33 },
};

export function DailyTestManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [resetInput, setResetInput] = useState({ email: "", date: "", exam_mode: "", reset_all: false });

  async function loadData() {
    setLoading(true);
    try {
      const settingsResponse = await dailyTestManagementService.getSettings();

      setSettings({
        exam_type: settingsResponse.data?.examType ?? settingsResponse.data?.exam_type ?? "BOTH",
        total_questions: settingsResponse.data?.total_questions ?? 20,
        new_questions: settingsResponse.data?.new_questions ?? 10,
        weak_questions: settingsResponse.data?.weak_questions ?? 5,
        revision_questions: settingsResponse.data?.revision_questions ?? 5,
        easy_percentage: settingsResponse.data?.easy_percentage ?? 30,
        moderate_percentage: settingsResponse.data?.moderate_percentage ?? 40,
        hard_percentage: settingsResponse.data?.hard_percentage ?? 30,
        enabled: Boolean(settingsResponse.data?.enabled ?? true),
        allow_both_exams_same_day: Boolean(settingsResponse.data?.allowBothExamsSameDay ?? settingsResponse.data?.allow_both_exams_same_day ?? false),
        subject_distribution: settingsResponse.data?.subjectDistribution ?? settingsResponse.data?.subject_distribution ?? defaultSettings.subject_distribution,
        adaptive_mode_enabled: Boolean(settingsResponse.data?.adaptive_mode_enabled ?? true),
        repeat_lookback_sessions: settingsResponse.data?.repeat_lookback_sessions ?? 5,
        max_repeated_questions: settingsResponse.data?.max_repeated_questions ?? 2,
        low_performance_ratio: settingsResponse.data?.lowPerformanceRatio ?? settingsResponse.data?.low_performance_ratio ?? { easy: 70, moderate: 20, hard: 10 },
        medium_performance_ratio: settingsResponse.data?.mediumPerformanceRatio ?? settingsResponse.data?.medium_performance_ratio ?? { easy: 40, moderate: 40, hard: 20 },
        high_performance_ratio: settingsResponse.data?.highPerformanceRatio ?? settingsResponse.data?.high_performance_ratio ?? { easy: 15, moderate: 45, hard: 40 },
        mixed_mode_ratio: settingsResponse.data?.mixedModeRatio ?? settingsResponse.data?.mixed_mode_ratio ?? { easy: 34, moderate: 33, hard: 33 },
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveSettings(event) {
    event.preventDefault();
    const totalMix = Number(settings.easy_percentage || 0) + Number(settings.moderate_percentage || 0) + Number(settings.hard_percentage || 0);
    if (totalMix !== 100) {
      toast.error("Easy, Moderate, and Hard percentages must total 100");
      return;
    }

    const countMix = Number(settings.new_questions || 0) + Number(settings.weak_questions || 0) + Number(settings.revision_questions || 0);
    if (countMix !== Number(settings.total_questions || 0)) {
      toast.error("New, Weak, and Revision counts must equal Total Daily Test Questions");
      return;
    }
    const ratioSets = [
      { name: "Low", value: settings.low_performance_ratio },
      { name: "Medium", value: settings.medium_performance_ratio },
      { name: "High", value: settings.high_performance_ratio },
      { name: "Mixed", value: settings.mixed_mode_ratio },
    ];
    for (const ratioSet of ratioSets) {
      const total = Number(ratioSet.value?.easy || 0) + Number(ratioSet.value?.moderate || 0) + Number(ratioSet.value?.hard || 0);
      if (total !== 100) {
        toast.error(`${ratioSet.name} adaptive ratio must total 100`);
        return;
      }
    }
    for (const [exam, group] of Object.entries(settings.subject_distribution || {})) {
      const total = Object.values(group || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      if (total > 0 && total !== Number(settings.total_questions || 0)) {
        toast.error(`${exam} subject-wise question counts must equal Total Daily Test Questions`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        examType: settings.exam_type || "BOTH",
        total_questions: Number(settings.total_questions || 20),
        new_questions: Number(settings.new_questions || 10),
        weak_questions: Number(settings.weak_questions || 5),
        revision_questions: Number(settings.revision_questions || 5),
        easy_percentage: Number(settings.easy_percentage || 30),
        moderate_percentage: Number(settings.moderate_percentage || 40),
        hard_percentage: Number(settings.hard_percentage || 30),
        enabled: Boolean(settings.enabled),
        allowBothExamsSameDay: Boolean(settings.allow_both_exams_same_day),
        subjectDistribution: {
          NEET: {
            Biology: Number(settings.subject_distribution?.NEET?.Biology || 0),
            Chemistry: Number(settings.subject_distribution?.NEET?.Chemistry || 0),
            Physics: Number(settings.subject_distribution?.NEET?.Physics || 0),
          },
          JEE: {
            Mathematics: Number(settings.subject_distribution?.JEE?.Mathematics || 0),
            Chemistry: Number(settings.subject_distribution?.JEE?.Chemistry || 0),
            Physics: Number(settings.subject_distribution?.JEE?.Physics || 0),
          },
        },
        adaptive_mode_enabled: Boolean(settings.adaptive_mode_enabled),
        repeat_lookback_sessions: Number(settings.repeat_lookback_sessions || 5),
        max_repeated_questions: Number(settings.max_repeated_questions || 2),
        lowPerformanceRatio: {
          easy: Number(settings.low_performance_ratio?.easy || 0),
          moderate: Number(settings.low_performance_ratio?.moderate || 0),
          hard: Number(settings.low_performance_ratio?.hard || 0),
        },
        mediumPerformanceRatio: {
          easy: Number(settings.medium_performance_ratio?.easy || 0),
          moderate: Number(settings.medium_performance_ratio?.moderate || 0),
          hard: Number(settings.medium_performance_ratio?.hard || 0),
        },
        highPerformanceRatio: {
          easy: Number(settings.high_performance_ratio?.easy || 0),
          moderate: Number(settings.high_performance_ratio?.moderate || 0),
          hard: Number(settings.high_performance_ratio?.hard || 0),
        },
        mixedModeRatio: {
          easy: Number(settings.mixed_mode_ratio?.easy || 0),
          moderate: Number(settings.mixed_mode_ratio?.moderate || 0),
          hard: Number(settings.mixed_mode_ratio?.hard || 0),
        },
      };
      const response = await dailyTestManagementService.saveSettings(payload);
      setSettings((current) => ({
        ...current,
          ...{
          exam_type: response.data?.examType ?? response.data?.exam_type ?? payload.examType,
          total_questions: response.data?.total_questions ?? payload.total_questions,
          new_questions: response.data?.new_questions ?? payload.new_questions,
          weak_questions: response.data?.weak_questions ?? payload.weak_questions,
          revision_questions: response.data?.revision_questions ?? payload.revision_questions,
          easy_percentage: response.data?.easy_percentage ?? payload.easy_percentage,
          moderate_percentage: response.data?.moderate_percentage ?? payload.moderate_percentage,
          hard_percentage: response.data?.hard_percentage ?? payload.hard_percentage,
          enabled: Boolean(response.data?.enabled ?? payload.enabled),
          allow_both_exams_same_day: Boolean(response.data?.allowBothExamsSameDay ?? response.data?.allow_both_exams_same_day ?? payload.allowBothExamsSameDay),
          subject_distribution: response.data?.subjectDistribution ?? response.data?.subject_distribution ?? payload.subjectDistribution,
          adaptive_mode_enabled: Boolean(response.data?.adaptive_mode_enabled ?? payload.adaptive_mode_enabled),
          repeat_lookback_sessions: response.data?.repeat_lookback_sessions ?? payload.repeat_lookback_sessions,
          max_repeated_questions: response.data?.max_repeated_questions ?? payload.max_repeated_questions,
          low_performance_ratio: response.data?.lowPerformanceRatio ?? payload.lowPerformanceRatio,
          medium_performance_ratio: response.data?.mediumPerformanceRatio ?? payload.mediumPerformanceRatio,
          high_performance_ratio: response.data?.highPerformanceRatio ?? payload.highPerformanceRatio,
          mixed_mode_ratio: response.data?.mixedModeRatio ?? payload.mixedModeRatio,
        },
      }));
      toast.success("Daily test settings saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDailyTests() {
    setResetting(true);
    try {
      const payload = {
        email: resetInput.email.trim() || undefined,
        date: resetInput.date || undefined,
        examMode: resetInput.exam_mode || undefined,
        reset_all: Boolean(resetInput.reset_all),
      };
      const response = await dailyTestManagementService.resetDailyTests(payload);
      toast.success(`Reset completed. Deleted ${response.data?.deleted_count ?? 0} test records.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading..." />;

  // Compact input class
  const compactInput = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Calendar size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Daily Test Management</h1>
              <p className="text-xs text-slate-500">Configure daily test generation and difficulty distribution</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded text-[9px] font-medium",
              settings.enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              {settings.enabled ? "Active" : "Disabled"}
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadData} type="button">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3" onSubmit={handleSaveSettings}>
        {/* Header with Save Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Generation Settings</h3>
          </div>
          <button className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25 disabled:opacity-50" disabled={saving} type="submit">
            <Save size={10} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Basic Settings Grid */}
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Exam Type</label>
            <select className={compactSelect} value={settings.exam_type} onChange={(event) => setSettings((current) => ({ ...current, exam_type: event.target.value }))}>
              <option value="BOTH">BOTH - NEET &amp; JEE</option>
              <option value="NEET">NEET only</option>
              <option value="JEE">JEE only</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Total Questions</label>
            <input className={compactInput} type="number" min={1} max={200} value={settings.total_questions} onChange={(event) => setSettings((current) => ({ ...current, total_questions: Number(event.target.value || 1) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">New Questions</label>
            <input className={compactInput} type="number" min={0} max={200} value={settings.new_questions} onChange={(event) => setSettings((current) => ({ ...current, new_questions: Number(event.target.value || 0) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Weak Questions</label>
            <input className={compactInput} type="number" min={0} max={200} value={settings.weak_questions} onChange={(event) => setSettings((current) => ({ ...current, weak_questions: Number(event.target.value || 0) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Revision Questions</label>
            <input className={compactInput} type="number" min={0} max={200} value={settings.revision_questions} onChange={(event) => setSettings((current) => ({ ...current, revision_questions: Number(event.target.value || 0) }))} />
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Subject Distribution</h4>
            <span className="text-[8px] text-slate-400">(Optional - leave 0 for adaptive)</span>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {[
              { exam: "NEET", subjects: ["Biology", "Chemistry", "Physics"] },
              { exam: "JEE", subjects: ["Mathematics", "Chemistry", "Physics"] },
            ].map((group) => {
              const total = group.subjects.reduce((sum, subject) => sum + Number(settings.subject_distribution?.[group.exam]?.[subject] || 0), 0);
              const isMatch = total === 0 || total === Number(settings.total_questions || 0);
              return (
                <div key={group.exam} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] font-semibold text-slate-700">{group.exam}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-medium",
                      isMatch ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {total}/{settings.total_questions}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.subjects.map((subject) => (
                      <div key={subject} className="flex flex-col gap-0.5">
                        <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{subject}</label>
                        <input className={compactInput} type="number" min={0} max={200} value={settings.subject_distribution?.[group.exam]?.[subject] ?? 0} onChange={(event) => setSettings((current) => ({
                          ...current,
                          subject_distribution: {
                            ...(current.subject_distribution || {}),
                            [group.exam]: {
                              ...(current.subject_distribution?.[group.exam] || {}),
                              [subject]: Number(event.target.value || 0),
                            },
                          },
                        }))} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Difficulty Distribution</h4>
            <span className="text-[8px] text-slate-400">(Must total 100%)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Easy %</label>
              <input className={compactInput} type="number" min={0} max={100} value={settings.easy_percentage} onChange={(event) => setSettings((current) => ({ ...current, easy_percentage: Number(event.target.value || 0) }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Moderate %</label>
              <input className={compactInput} type="number" min={0} max={100} value={settings.moderate_percentage} onChange={(event) => setSettings((current) => ({ ...current, moderate_percentage: Number(event.target.value || 0) }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Hard %</label>
              <input className={compactInput} type="number" min={0} max={100} value={settings.hard_percentage} onChange={(event) => setSettings((current) => ({ ...current, hard_percentage: Number(event.target.value || 0) }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-[8px] font-medium",
              Number(settings.easy_percentage) + Number(settings.moderate_percentage) + Number(settings.hard_percentage) === 100 ? "text-emerald-600" : "text-rose-600"
            )}>
              Total: {Number(settings.easy_percentage) + Number(settings.moderate_percentage) + Number(settings.hard_percentage)}%
              {Number(settings.easy_percentage) + Number(settings.moderate_percentage) + Number(settings.hard_percentage) !== 100 && " (Must equal 100)"}
            </span>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1.5">
              <ToggleSwitch checked={Boolean(settings.enabled)} onChange={(value) => setSettings((current) => ({ ...current, enabled: value }))} label="" size="sm" />
              <span className="text-[9px] font-medium text-slate-700">Daily test module is active</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1.5">
              <ToggleSwitch checked={Boolean(settings.allow_both_exams_same_day)} onChange={(value) => setSettings((current) => ({ ...current, allow_both_exams_same_day: value }))} label="" size="sm" />
              <span className="text-[9px] font-medium text-slate-700">Allow both exams same day</span>
            </div>
          </div>
          {!settings.allow_both_exams_same_day && (
            <p className="text-[8px] text-amber-600 mt-1">⚠️ Disabled: after completing one exam, the other is locked until tomorrow</p>
          )}
        </div>

        {/* Adaptive Randomization */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Adaptive Randomization</h4>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1.5">
              <ToggleSwitch checked={Boolean(settings.adaptive_mode_enabled)} onChange={(value) => setSettings((current) => ({ ...current, adaptive_mode_enabled: value }))} label="" size="sm" />
              <span className="text-[9px] font-medium text-slate-700">Adaptive Mode</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Lookback Sessions</label>
              <input className={compactInput} type="number" min={1} max={30} value={settings.repeat_lookback_sessions} onChange={(event) => setSettings((current) => ({ ...current, repeat_lookback_sessions: Number(event.target.value || 1) }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Max Repeated Questions</label>
              <input className={compactInput} type="number" min={0} max={200} value={settings.max_repeated_questions} onChange={(event) => setSettings((current) => ({ ...current, max_repeated_questions: Number(event.target.value || 0) }))} />
            </div>
          </div>

          {/* Adaptive Ratios */}
          <div className="grid grid-cols-1 gap-1.5 mt-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { key: "low_performance_ratio", label: "Low Performance", icon: TrendingUp },
              { key: "medium_performance_ratio", label: "Medium Performance", icon: Users },
              { key: "high_performance_ratio", label: "High Performance", icon: Shield },
              { key: "mixed_mode_ratio", label: "Mixed Mode", icon: Layers },
            ].map((item) => {
              const Icon = item.icon;
              const values = settings[item.key] || { easy: 0, moderate: 0, hard: 0 };
              const total = Number(values.easy || 0) + Number(values.moderate || 0) + Number(values.hard || 0);
              return (
                <div key={item.key} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={10} className="text-indigo-600" />
                    <span className="text-[8px] font-medium text-slate-700">{item.label}</span>
                    <span className={cn(
                      "ml-auto text-[7px] font-medium",
                      total === 100 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {total}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Easy</label>
                      <input className={compactInput} type="number" min={0} max={100} value={values.easy || 0} onChange={(event) => setSettings((current) => ({
                        ...current,
                        [item.key]: { ...(current[item.key] || {}), easy: Number(event.target.value || 0) },
                      }))} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Mod</label>
                      <input className={compactInput} type="number" min={0} max={100} value={values.moderate || 0} onChange={(event) => setSettings((current) => ({
                        ...current,
                        [item.key]: { ...(current[item.key] || {}), moderate: Number(event.target.value || 0) },
                      }))} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Hard</label>
                      <input className={compactInput} type="number" min={0} max={100} value={values.hard || 0} onChange={(event) => setSettings((current) => ({
                        ...current,
                        [item.key]: { ...(current[item.key] || {}), hard: Number(event.target.value || 0) },
                      }))} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>

      {/* Manual Reset Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-amber-600" />
            <h3 className="text-xs font-semibold text-slate-900">Manual Reset</h3>
            <span className="text-[8px] text-slate-400">Reset generated daily tests</span>
          </div>
          <button className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
            resetting && "opacity-50 cursor-not-allowed"
          )} disabled={resetting} onClick={handleResetDailyTests} type="button">
            <RotateCcw size={10} className={resetting ? "animate-spin" : ""} />
            {resetting ? "Resetting..." : "Reset Daily Tests"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Email (optional)</label>
            <input className={compactInput} type="email" value={resetInput.email} onChange={(event) => setResetInput((current) => ({ ...current, email: event.target.value }))} placeholder="Leave empty for all" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Date (optional)</label>
            <input className={compactInput} type="date" value={resetInput.date} onChange={(event) => setResetInput((current) => ({ ...current, date: event.target.value }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Exam Type (optional)</label>
            <select className={compactSelect} value={resetInput.exam_mode} onChange={(event) => setResetInput((current) => ({ ...current, exam_mode: event.target.value }))}>
              <option value="">All exam types</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="BOTH">BOTH</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1.5">
            <ToggleSwitch checked={Boolean(resetInput.reset_all)} onChange={(value) => setResetInput((current) => ({ ...current, reset_all: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Reset All Dates</span>
          </div>
        </div>
        {resetInput.reset_all && (
          <p className="text-[8px] text-amber-600 mt-1">⚠️ This will remove all generated tests regardless of date</p>
        )}
      </div>
    </div>
  );
}