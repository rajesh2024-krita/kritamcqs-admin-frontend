import { useEffect, useMemo, useState } from "react";
import { revisionService } from "../../api/revisionService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

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

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={ui.eyebrow}>Revision Control</div>
            <p className={ui.muted}>Control app revision generation limits, spaced repetition cadence, and module activation.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadData} type="button">
            Refresh
          </button>
        </div>
      </section>

      <form className={ui.panel} onSubmit={handleSaveSettings}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Generation Settings</h3>
            <p className={ui.muted}>Update wrong and old question limits used in revision pool generation.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Wrong Question Revision Count</span>
            <input
              className={ui.input}
              type="number"
              min={1}
              max={100}
              value={settings.wrong_question_limit}
              onChange={(event) => setSettings((current) => ({ ...current, wrong_question_limit: Number(event.target.value || 1) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Old Question Revision Count</span>
            <input
              className={ui.input}
              type="number"
              min={1}
              max={100}
              value={settings.old_question_limit}
              onChange={(event) => setSettings((current) => ({ ...current, old_question_limit: Number(event.target.value || 1) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Daily Revision Limit</span>
            <input
              className={ui.input}
              type="number"
              min={1}
              max={200}
              value={settings.daily_revision_limit}
              onChange={(event) => setSettings((current) => ({ ...current, daily_revision_limit: Number(event.target.value || 1) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Enable Revision Module</span>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <ToggleSwitch checked={Boolean(settings.revision_enabled)} onChange={(value) => setSettings((current) => ({ ...current, revision_enabled: value }))} label="Revision module is active for app users" />
            </div>
          </label>
          <label className={ui.field}>
            <span>Difficulty Mode</span>
            <select className={ui.input} value={settings.difficulty_mode} onChange={(event) => setSettings((current) => ({ ...current, difficulty_mode: event.target.value }))}>
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className={ui.field}>
            <span>Schedule</span>
            <select className={ui.input} value={settings.schedule_mode} onChange={(event) => setSettings((current) => ({ ...current, schedule_mode: event.target.value }))}>
              <option value="daily">Daily Revision</option>
              <option value="weekly">Weekly Revision</option>
              <option value="custom">Custom Revision Sets</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ["include_wrong_questions", "Include wrong questions"],
            ["include_skipped_questions", "Include skipped questions"],
            ["include_low_accuracy_questions", "Include low accuracy questions"],
            ["include_weak_area_questions", "Include weak area questions"],
            ["auto_generated_revision_tests", "Auto-generated revision tests"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <ToggleSwitch checked={Boolean(settings[key])} onChange={(value) => setSettings((current) => ({ ...current, [key]: value }))} label={label} />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className={ui.field}>
            <span>Completion Accuracy %</span>
            <input className={ui.input} type="number" min={0} max={100} value={settings.accuracy_threshold} onChange={(event) => setSettings((current) => ({ ...current, accuracy_threshold: Number(event.target.value || 0) }))} />
          </label>
          <label className={ui.field}>
            <span>Minimum Correct Answers</span>
            <input className={ui.input} type="number" min={0} max={200} value={settings.minimum_correct_answers} onChange={(event) => setSettings((current) => ({ ...current, minimum_correct_answers: Number(event.target.value || 0) }))} />
          </label>
          <label className={ui.field}>
            <span>Attempt Count Required</span>
            <input className={ui.input} type="number" min={1} max={20} value={settings.completion_attempt_count} onChange={(event) => setSettings((current) => ({ ...current, completion_attempt_count: Number(event.target.value || 1) }))} />
          </label>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-bold text-slate-900">Spaced Repetition Settings</h4>
          <p className="mb-3 text-sm text-slate-500">Configure spaced intervals for Day 1, Day 2, Day 5, and Day 10 stages.</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {["Day 1", "Day 2", "Day 5", "Day 10"].map((label, index) => (
              <label className={ui.field} key={label}>
                <span>{label}</span>
                <input
                  className={ui.input}
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
              </label>
            ))}
          </div>
        </div>
      </form>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Manual Trigger</h3>
            <p className={ui.muted}>Generate revision pool on-demand for QA/testing.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={generating} onClick={handleGeneratePool} type="button">
            {generating ? "Generating..." : "Generate Revision Pool for Testing"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Email ID (optional)</span>
            <input
              className={ui.input}
              type="email"
              value={manualInput.email_id}
              onChange={(event) => setManualInput((current) => ({ ...current, email_id: event.target.value }))}
              placeholder="Leave empty to auto-pick latest learner"
            />
          </label>
          <label className={ui.field}>
            <span>Exam Mode</span>
            <select
              className={ui.input}
              value={manualInput.exam_mode}
              onChange={(event) => setManualInput((current) => ({ ...current, exam_mode: event.target.value }))}
            >
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="BOTH">BOTH</option>
            </select>
          </label>
        </div>

        {generatedPool ? (
          <div className="mt-6 rounded-sm border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div><span className={ui.metricLabel}>Wrong</span><strong className="mt-1 block text-2xl font-black text-slate-900">{generatedPool.wrong_count ?? 0}</strong></div>
              <div><span className={ui.metricLabel}>Old</span><strong className="mt-1 block text-2xl font-black text-slate-900">{generatedPool.old_count ?? 0}</strong></div>
              <div><span className={ui.metricLabel}>Total</span><strong className="mt-1 block text-2xl font-black text-slate-900">{generatedPool.total_count ?? 0}</strong></div>
              <div><span className={ui.metricLabel}>User</span><strong className="mt-1 block text-sm font-bold text-slate-900">{generatedPool.userId || "-"}</strong></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">Most Revised Topics</p>
              <div className="flex flex-wrap gap-2">
                {(generatedPool.topTopics || []).map((topic) => (
                  <span className={ui.pill} key={topic}>{topic}</span>
                ))}
                {!(generatedPool.topTopics || []).length ? <span className="text-sm text-slate-500">No topic tags generated.</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
