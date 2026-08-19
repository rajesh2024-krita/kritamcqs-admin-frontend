import { useEffect, useMemo, useState } from "react";
import { revisionService } from "../../api/revisionService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import {
  RefreshCw,
  Save,
  Zap,
  Layers,
  Target,
  Clock,
  Calendar,
  TrendingUp,
  User,
  Mail,
  BookOpen,
  CheckCircle,
  Settings,
  BarChart3,
  Repeat,
  Brain,
  Sparkles
} from "lucide-react";

const defaultSettings = {
  wrong_question_limit: 10,
  old_question_limit: 5,
  daily_revision_limit: 20,
  revision_enabled: true,
  include_wrong_questions: true,
  include_skipped_questions: true,
  include_low_accuracy_questions: true,
  include_weak_area_questions: true,
  accuracy_threshold: 80,
  minimum_correct_answers: 1,
  completion_attempt_count: 1,
  difficulty_mode: "mixed",
  schedule_mode: "daily",
  auto_generated_revision_tests: true,
  spaced_days: [1, 2, 5, 10],
};

export function RevisionManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [manualInput, setManualInput] = useState({ email_id: "", exam_mode: "NEET" });
  const [generatedPool, setGeneratedPool] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const settingsResponse = await revisionService.getSettings();
      setSettings({
        wrong_question_limit: settingsResponse.data?.wrong_question_limit ?? 10,
        old_question_limit: settingsResponse.data?.old_question_limit ?? 5,
        daily_revision_limit: settingsResponse.data?.daily_revision_limit ?? 20,
        revision_enabled: Boolean(settingsResponse.data?.revision_enabled ?? true),
        include_wrong_questions: settingsResponse.data?.include_wrong_questions !== false,
        include_skipped_questions: settingsResponse.data?.include_skipped_questions !== false,
        include_low_accuracy_questions: settingsResponse.data?.include_low_accuracy_questions !== false,
        include_weak_area_questions: settingsResponse.data?.include_weak_area_questions !== false,
        accuracy_threshold: settingsResponse.data?.accuracy_threshold ?? 80,
        minimum_correct_answers: settingsResponse.data?.minimum_correct_answers ?? 1,
        completion_attempt_count: settingsResponse.data?.completion_attempt_count ?? 1,
        difficulty_mode: settingsResponse.data?.difficulty_mode ?? "mixed",
        schedule_mode: settingsResponse.data?.schedule_mode ?? "daily",
        auto_generated_revision_tests: settingsResponse.data?.auto_generated_revision_tests !== false,
        spaced_days: Array.isArray(settingsResponse.data?.spaced_days)
          ? settingsResponse.data.spaced_days.slice(0, 4)
          : [1, 2, 5, 10],
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

  const normalizedSpacedDays = useMemo(() => {
    const source = Array.isArray(settings.spaced_days) ? settings.spaced_days : [1, 2, 5, 10];
    const limited = source.slice(0, 4);
    while (limited.length < 4) limited.push(limited.length ? limited[limited.length - 1] + 1 : 1);
    return limited;
  }, [settings.spaced_days]);

  async function handleSaveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        wrong_question_limit: Number(settings.wrong_question_limit || 10),
        old_question_limit: Number(settings.old_question_limit || 5),
        daily_revision_limit: Number(settings.daily_revision_limit || 20),
        revision_enabled: Boolean(settings.revision_enabled),
        include_wrong_questions: Boolean(settings.include_wrong_questions),
        include_skipped_questions: Boolean(settings.include_skipped_questions),
        include_low_accuracy_questions: Boolean(settings.include_low_accuracy_questions),
        include_weak_area_questions: Boolean(settings.include_weak_area_questions),
        accuracy_threshold: Number(settings.accuracy_threshold || 80),
        minimum_correct_answers: Number(settings.minimum_correct_answers || 1),
        completion_attempt_count: Number(settings.completion_attempt_count || 1),
        difficulty_mode: settings.difficulty_mode || "mixed",
        schedule_mode: settings.schedule_mode || "daily",
        auto_generated_revision_tests: Boolean(settings.auto_generated_revision_tests),
        spaced_days: normalizedSpacedDays.map((value) => Number(value || 1)),
      };
      const response = await revisionService.saveSettings(payload);
      setSettings({
        wrong_question_limit: response.data?.wrong_question_limit ?? payload.wrong_question_limit,
        old_question_limit: response.data?.old_question_limit ?? payload.old_question_limit,
        daily_revision_limit: response.data?.daily_revision_limit ?? payload.daily_revision_limit,
        revision_enabled: Boolean(response.data?.revision_enabled ?? payload.revision_enabled),
        include_wrong_questions: response.data?.include_wrong_questions !== false,
        include_skipped_questions: response.data?.include_skipped_questions !== false,
        include_low_accuracy_questions: response.data?.include_low_accuracy_questions !== false,
        include_weak_area_questions: response.data?.include_weak_area_questions !== false,
        accuracy_threshold: response.data?.accuracy_threshold ?? payload.accuracy_threshold,
        minimum_correct_answers: response.data?.minimum_correct_answers ?? payload.minimum_correct_answers,
        completion_attempt_count: response.data?.completion_attempt_count ?? payload.completion_attempt_count,
        difficulty_mode: response.data?.difficulty_mode ?? payload.difficulty_mode,
        schedule_mode: response.data?.schedule_mode ?? payload.schedule_mode,
        auto_generated_revision_tests: response.data?.auto_generated_revision_tests !== false,
        spaced_days: Array.isArray(response.data?.spaced_days) ? response.data.spaced_days.slice(0, 4) : payload.spaced_days,
      });
      toast.success("Revision settings saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePool() {
    setGenerating(true);
    try {
      const payload = {
        email_id: manualInput.email_id.trim() || undefined,
        exam_mode: manualInput.exam_mode,
      };
      const response = await revisionService.generatePool(payload);
      setGeneratedPool(response.data || null);
      toast.success("Revision pool generated for testing");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading revision management..." />;

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Repeat size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Revision Management</h1>
              <p className="text-xs text-slate-500">Configure revision generation and spaced repetition settings</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex px-2 py-0.5 rounded text-[9px] font-medium",
              settings.revision_enabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              {settings.revision_enabled ? "Active" : "Disabled"}
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
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Wrong Question Count</label>
            <input className={compactInput} type="number" min={1} max={100} value={settings.wrong_question_limit} onChange={(event) => setSettings((current) => ({ ...current, wrong_question_limit: Number(event.target.value || 1) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Old Question Count</label>
            <input className={compactInput} type="number" min={1} max={100} value={settings.old_question_limit} onChange={(event) => setSettings((current) => ({ ...current, old_question_limit: Number(event.target.value || 1) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Daily Revision Limit</label>
            <input className={compactInput} type="number" min={1} max={200} value={settings.daily_revision_limit} onChange={(event) => setSettings((current) => ({ ...current, daily_revision_limit: Number(event.target.value || 1) }))} />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Enable Revision</label>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1">
              <ToggleSwitch checked={Boolean(settings.revision_enabled)} onChange={(value) => setSettings((current) => ({ ...current, revision_enabled: value }))} label="" size="sm" />
              <span className="text-[8px] font-medium text-slate-700">Active for users</span>
            </div>
          </div>
        </div>

        {/* Include Options */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Include Questions From</h4>
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["include_wrong_questions", "Wrong Questions"],
              ["include_skipped_questions", "Skipped Questions"],
              ["include_low_accuracy_questions", "Low Accuracy"],
              ["include_weak_area_questions", "Weak Areas"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1">
                <ToggleSwitch checked={Boolean(settings[key])} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} label="" size="sm" />
                <span className="text-[8px] font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1">
            <ToggleSwitch checked={Boolean(settings.auto_generated_revision_tests)} onChange={(value) => setSettings((current) => ({ ...current, auto_generated_revision_tests: value }))} label="" size="sm" />
            <span className="text-[8px] font-medium text-slate-700">Auto-generated revision tests</span>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Target size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Accuracy & Attempt Settings</h4>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Accuracy Threshold %</label>
              <input className={compactInput} type="number" min={0} max={100} value={settings.accuracy_threshold} onChange={(event) => setSettings((current) => ({ ...current, accuracy_threshold: Number(event.target.value || 0) }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Min Correct Answers</label>
              <input className={compactInput} type="number" min={0} max={200} value={settings.minimum_correct_answers} onChange={(event) => setSettings((current) => ({ ...current, minimum_correct_answers: Number(event.target.value || 0) }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Attempts Required</label>
              <input className={compactInput} type="number" min={1} max={20} value={settings.completion_attempt_count} onChange={(event) => setSettings((current) => ({ ...current, completion_attempt_count: Number(event.target.value || 1) }))} />
            </div>
          </div>
        </div>

        {/* Mode Settings */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Difficulty Mode</label>
              <select className={compactSelect} value={settings.difficulty_mode} onChange={(event) => setSettings((current) => ({ ...current, difficulty_mode: event.target.value }))}>
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Schedule Mode</label>
              <select className={compactSelect} value={settings.schedule_mode} onChange={(event) => setSettings((current) => ({ ...current, schedule_mode: event.target.value }))}>
                <option value="daily">Daily Revision</option>
                <option value="weekly">Weekly Revision</option>
                <option value="custom">Custom Revision Sets</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spaced Repetition */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar size={12} className="text-indigo-600" />
            <h4 className="text-[10px] font-semibold text-slate-900">Spaced Repetition</h4>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {["Day 1", "Day 2", "Day 5", "Day 10"].map((label, index) => (
              <div key={label} className="flex flex-col gap-0.5">
                <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
                <input
                  className={compactInput}
                  type="number"
                  min={1}
                  value={normalizedSpacedDays[index]}
                  onChange={(event) =>
                    setSettings((current) => {
                      const next = [...normalizedSpacedDays];
                      next[index] = Number(event.target.value || 1);
                      return { ...current, spaced_days: next };
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* Manual Trigger Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-600" />
            <h3 className="text-xs font-semibold text-slate-900">Manual Trigger</h3>
            <span className="text-[8px] text-slate-400">Generate revision pool for testing</span>
          </div>
          <button className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-medium rounded-lg transition-all",
            "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
            generating && "opacity-50 cursor-not-allowed"
          )} disabled={generating} onClick={handleGeneratePool} type="button">
            <Sparkles size={10} className={generating ? "animate-spin" : ""} />
            {generating ? "Generating..." : "Generate Pool"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mt-2 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Email (optional)</label>
            <input className={compactInput} type="email" value={manualInput.email_id} onChange={(event) => setManualInput((current) => ({ ...current, email_id: event.target.value }))} placeholder="Leave empty for latest" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Exam Mode</label>
            <select className={compactSelect} value={manualInput.exam_mode} onChange={(event) => setManualInput((current) => ({ ...current, exam_mode: event.target.value }))}>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="BOTH">BOTH</option>
            </select>
          </div>
        </div>

        {/* Generated Pool Results */}
        {generatedPool && (
          <div className="mt-3 bg-slate-50 rounded-lg border border-slate-200/50 p-3 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Wrong</div>
                <div className="text-base font-bold text-slate-900">{generatedPool.wrong_count ?? 0}</div>
              </div>
              <div>
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Old</div>
                <div className="text-base font-bold text-slate-900">{generatedPool.old_count ?? 0}</div>
              </div>
              <div>
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Total</div>
                <div className="text-base font-bold text-slate-900">{generatedPool.total_count ?? 0}</div>
              </div>
              <div>
                <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">User</div>
                <div className="text-[9px] font-semibold text-slate-900 truncate">{generatedPool.userId || "-"}</div>
              </div>
            </div>
            {generatedPool.topTopics?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-[8px] font-medium text-slate-500 uppercase tracking-wider mb-1">Top Topics</div>
                <div className="flex flex-wrap gap-1">
                  {generatedPool.topTopics.map((topic) => (
                    <span key={topic} className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}