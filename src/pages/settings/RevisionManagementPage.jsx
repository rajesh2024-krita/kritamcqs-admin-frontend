import { useEffect, useMemo, useState } from "react";
import { revisionService } from "../../api/revisionService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const defaultSettings = {
  wrong_question_limit: 10,
  old_question_limit: 5,
  revision_enabled: true,
  spaced_days: [1, 2, 5, 10],
};

export function RevisionManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [analytics, setAnalytics] = useState(null);
  const [manualInput, setManualInput] = useState({ user_id: "", exam_mode: "NEET" });
  const [generatedPool, setGeneratedPool] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsResponse, analyticsResponse] = await Promise.all([
        revisionService.getSettings(),
        revisionService.getAnalytics(),
      ]);
      setSettings({
        wrong_question_limit: settingsResponse.data?.wrong_question_limit ?? 10,
        old_question_limit: settingsResponse.data?.old_question_limit ?? 5,
        revision_enabled: Boolean(settingsResponse.data?.revision_enabled ?? true),
        spaced_days: Array.isArray(settingsResponse.data?.spaced_days)
          ? settingsResponse.data.spaced_days.slice(0, 4)
          : [1, 2, 5, 10],
      });
      setAnalytics(analyticsResponse.data || null);
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
        revision_enabled: Boolean(settings.revision_enabled),
        spaced_days: normalizedSpacedDays.map((value) => Number(value || 1)),
      };
      const response = await revisionService.saveSettings(payload);
      setSettings({
        wrong_question_limit: response.data?.wrong_question_limit ?? payload.wrong_question_limit,
        old_question_limit: response.data?.old_question_limit ?? payload.old_question_limit,
        revision_enabled: Boolean(response.data?.revision_enabled ?? payload.revision_enabled),
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
        user_id: manualInput.user_id.trim() || undefined,
        exam_mode: manualInput.exam_mode,
      };
      const response = await revisionService.generatePool(payload);
      setGeneratedPool(response.data || null);
      toast.success("Revision pool generated for testing");
      const analyticsResponse = await revisionService.getAnalytics();
      setAnalytics(analyticsResponse.data || null);
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
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Revision Settings</h1>
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
            <span>Enable Revision Module</span>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <input
                className={ui.checkbox}
                type="checkbox"
                checked={Boolean(settings.revision_enabled)}
                onChange={(event) => setSettings((current) => ({ ...current, revision_enabled: event.target.checked }))}
              />
              <span className="text-sm text-slate-700">Revision module is active for app users</span>
            </div>
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

      <section className={ui.compactPanel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Analytics Dashboard</h3>
            <p className={ui.muted}>Live revision trends and top revised topics across the learner base.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={ui.tile}><span className={ui.metricLabel}>Total Revision Attempts</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.total_attempts ?? 0}</strong></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Completed Revisions</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.completed_count ?? 0}</strong></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Pending Revisions</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.pending_count ?? 0}</strong></div>
          <div className={ui.tile}>
            <span className={ui.metricLabel}>Most Revised Topics</span>
            <div className="mt-3 space-y-1">
              {(analytics?.top_topics || []).slice(0, 4).map((topic) => (
                <div key={topic} className="text-sm font-semibold text-slate-700">{topic}</div>
              ))}
              {!(analytics?.top_topics || []).length ? <div className="text-sm text-slate-500">No topics yet</div> : null}
            </div>
          </div>
        </div>
      </section>

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
            <span>User ID (optional)</span>
            <input
              className={ui.input}
              value={manualInput.user_id}
              onChange={(event) => setManualInput((current) => ({ ...current, user_id: event.target.value }))}
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

