import { useEffect, useState } from "react";
import { dailyTestManagementService } from "../../api/dailyTestManagementService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const defaultSettings = {
  total_questions: 20,
  new_questions: 10,
  weak_questions: 5,
  revision_questions: 5,
  easy_percentage: 30,
  moderate_percentage: 40,
  hard_percentage: 30,
  enabled: true,
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
  const [analytics, setAnalytics] = useState(null);
  const [resetInput, setResetInput] = useState({ user_id: "", date: "", reset_all: false });

  async function loadData() {
    setLoading(true);
    try {
      const [settingsResponse, analyticsResponse] = await Promise.all([
        dailyTestManagementService.getSettings(),
        dailyTestManagementService.getAnalytics(),
      ]);

      setSettings({
        total_questions: settingsResponse.data?.total_questions ?? 20,
        new_questions: settingsResponse.data?.new_questions ?? 10,
        weak_questions: settingsResponse.data?.weak_questions ?? 5,
        revision_questions: settingsResponse.data?.revision_questions ?? 5,
        easy_percentage: settingsResponse.data?.easy_percentage ?? 30,
        moderate_percentage: settingsResponse.data?.moderate_percentage ?? 40,
        hard_percentage: settingsResponse.data?.hard_percentage ?? 30,
        enabled: Boolean(settingsResponse.data?.enabled ?? true),
        adaptive_mode_enabled: Boolean(settingsResponse.data?.adaptive_mode_enabled ?? true),
        repeat_lookback_sessions: settingsResponse.data?.repeat_lookback_sessions ?? 5,
        max_repeated_questions: settingsResponse.data?.max_repeated_questions ?? 2,
        low_performance_ratio: settingsResponse.data?.lowPerformanceRatio ?? settingsResponse.data?.low_performance_ratio ?? { easy: 70, moderate: 20, hard: 10 },
        medium_performance_ratio: settingsResponse.data?.mediumPerformanceRatio ?? settingsResponse.data?.medium_performance_ratio ?? { easy: 40, moderate: 40, hard: 20 },
        high_performance_ratio: settingsResponse.data?.highPerformanceRatio ?? settingsResponse.data?.high_performance_ratio ?? { easy: 15, moderate: 45, hard: 40 },
        mixed_mode_ratio: settingsResponse.data?.mixedModeRatio ?? settingsResponse.data?.mixed_mode_ratio ?? { easy: 34, moderate: 33, hard: 33 },
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

    setSaving(true);
    try {
      const payload = {
        total_questions: Number(settings.total_questions || 20),
        new_questions: Number(settings.new_questions || 10),
        weak_questions: Number(settings.weak_questions || 5),
        revision_questions: Number(settings.revision_questions || 5),
        easy_percentage: Number(settings.easy_percentage || 30),
        moderate_percentage: Number(settings.moderate_percentage || 40),
        hard_percentage: Number(settings.hard_percentage || 30),
        enabled: Boolean(settings.enabled),
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
          total_questions: response.data?.total_questions ?? payload.total_questions,
          new_questions: response.data?.new_questions ?? payload.new_questions,
          weak_questions: response.data?.weak_questions ?? payload.weak_questions,
          revision_questions: response.data?.revision_questions ?? payload.revision_questions,
          easy_percentage: response.data?.easy_percentage ?? payload.easy_percentage,
          moderate_percentage: response.data?.moderate_percentage ?? payload.moderate_percentage,
          hard_percentage: response.data?.hard_percentage ?? payload.hard_percentage,
          enabled: Boolean(response.data?.enabled ?? payload.enabled),
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
        user_id: resetInput.user_id.trim() || undefined,
        date: resetInput.date || undefined,
        reset_all: Boolean(resetInput.reset_all),
      };
      const response = await dailyTestManagementService.resetDailyTests(payload);
      toast.success(`Reset completed. Deleted ${response.data?.deleted_count ?? 0} test records.`);
      const analyticsResponse = await dailyTestManagementService.getAnalytics();
      setAnalytics(analyticsResponse.data || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading daily test management..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={ui.eyebrow}>Daily Test Control</div>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Daily Test Settings</h1>
            <p className={ui.muted}>Configure daily test generation, question composition, and difficulty distribution from admin.</p>
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
            <p className={ui.muted}>Set total questions and split across new, weak area, and revision/mistake buckets.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Total Daily Test Questions</span>
            <input
              className={ui.input}
              type="number"
              min={1}
              max={200}
              value={settings.total_questions}
              onChange={(event) => setSettings((current) => ({ ...current, total_questions: Number(event.target.value || 1) }))}
            />
          </label>
          <label className={ui.field}>
            <span>New Question Count</span>
            <input
              className={ui.input}
              type="number"
              min={0}
              max={200}
              value={settings.new_questions}
              onChange={(event) => setSettings((current) => ({ ...current, new_questions: Number(event.target.value || 0) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Weak Question Count</span>
            <input
              className={ui.input}
              type="number"
              min={0}
              max={200}
              value={settings.weak_questions}
              onChange={(event) => setSettings((current) => ({ ...current, weak_questions: Number(event.target.value || 0) }))}
            />
          </label>
          <label className={ui.field}>
            <span>Revision Question Count</span>
            <input
              className={ui.input}
              type="number"
              min={0}
              max={200}
              value={settings.revision_questions}
              onChange={(event) => setSettings((current) => ({ ...current, revision_questions: Number(event.target.value || 0) }))}
            />
          </label>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-bold text-slate-900">Difficulty Distribution</h4>
          <p className="mb-3 text-sm text-slate-500">Set the daily test difficulty ratio in percentages.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className={ui.field}>
              <span>Easy %</span>
              <input
                className={ui.input}
                type="number"
                min={0}
                max={100}
                value={settings.easy_percentage}
                onChange={(event) => setSettings((current) => ({ ...current, easy_percentage: Number(event.target.value || 0) }))}
              />
            </label>
            <label className={ui.field}>
              <span>Moderate %</span>
              <input
                className={ui.input}
                type="number"
                min={0}
                max={100}
                value={settings.moderate_percentage}
                onChange={(event) => setSettings((current) => ({ ...current, moderate_percentage: Number(event.target.value || 0) }))}
              />
            </label>
            <label className={ui.field}>
              <span>Hard %</span>
              <input
                className={ui.input}
                type="number"
                min={0}
                max={100}
                value={settings.hard_percentage}
                onChange={(event) => setSettings((current) => ({ ...current, hard_percentage: Number(event.target.value || 0) }))}
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <label className={ui.field}>
            <span>Enable/Disable Daily Test</span>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <input
                className={ui.checkbox}
                type="checkbox"
                checked={Boolean(settings.enabled)}
                onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
              />
              <span className="text-sm text-slate-700">Daily test module is active for app users</span>
            </div>
          </label>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <h4 className="text-lg font-bold text-slate-900">Adaptive Randomization</h4>
          <p className="mb-3 text-sm text-slate-500">Control adaptive difficulty and repeat prevention for Daily/Weekly/Mock test generation.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className={ui.field}>
              <span>Adaptive Mode</span>
              <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
                <input
                  className={ui.checkbox}
                  type="checkbox"
                  checked={Boolean(settings.adaptive_mode_enabled)}
                  onChange={(event) => setSettings((current) => ({ ...current, adaptive_mode_enabled: event.target.checked }))}
                />
                <span className="text-sm text-slate-700">Auto-balance by learner capacity</span>
              </div>
            </label>
            <label className={ui.field}>
              <span>Repeat Lookback Sessions</span>
              <input
                className={ui.input}
                type="number"
                min={1}
                max={30}
                value={settings.repeat_lookback_sessions}
                onChange={(event) => setSettings((current) => ({ ...current, repeat_lookback_sessions: Number(event.target.value || 1) }))}
              />
            </label>
            <label className={ui.field}>
              <span>Max Repeated Questions Per Paper</span>
              <input
                className={ui.input}
                type="number"
                min={0}
                max={200}
                value={settings.max_repeated_questions}
                onChange={(event) => setSettings((current) => ({ ...current, max_repeated_questions: Number(event.target.value || 0) }))}
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { key: "low_performance_ratio", label: "Low Performance Ratio" },
              { key: "medium_performance_ratio", label: "Medium Performance Ratio" },
              { key: "high_performance_ratio", label: "High Performance Ratio" },
              { key: "mixed_mode_ratio", label: "Mixed Mode Ratio" },
            ].map((item) => (
              <div key={item.key} className="rounded-sm border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-bold text-slate-800">{item.label}</p>
                <div className="grid grid-cols-3 gap-3">
                  <label className={ui.field}>
                    <span>Easy %</span>
                    <input
                      className={ui.input}
                      type="number"
                      min={0}
                      max={100}
                      value={settings[item.key]?.easy ?? 0}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          [item.key]: { ...(current[item.key] || {}), easy: Number(event.target.value || 0) },
                        }))}
                    />
                  </label>
                  <label className={ui.field}>
                    <span>Moderate %</span>
                    <input
                      className={ui.input}
                      type="number"
                      min={0}
                      max={100}
                      value={settings[item.key]?.moderate ?? 0}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          [item.key]: { ...(current[item.key] || {}), moderate: Number(event.target.value || 0) },
                        }))}
                    />
                  </label>
                  <label className={ui.field}>
                    <span>Hard %</span>
                    <input
                      className={ui.input}
                      type="number"
                      min={0}
                      max={100}
                      value={settings[item.key]?.hard ?? 0}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          [item.key]: { ...(current[item.key] || {}), hard: Number(event.target.value || 0) },
                        }))}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      <section className={ui.compactPanel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Analytics Dashboard</h3>
            <p className={ui.muted}>Daily test usage summary, score quality, completion trend, and top users.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={ui.tile}><span className={ui.metricLabel}>Total Daily Tests Taken</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.total_attempts ?? 0}</strong></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Average Score</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.average_score ?? 0}</strong></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Completion Rate</span><strong className="mt-3 block text-3xl font-black text-slate-900">{analytics?.completion_rate ?? 0}%</strong></div>
        </div>

        <div className="mt-5 rounded-sm border border-slate-200 bg-white p-4">
          <h4 className="text-lg font-bold text-slate-900">Top Performing Users</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Attempts</th>
                  <th className="py-2 pr-3">Avg Score</th>
                  <th className="py-2 pr-3">Avg Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.top_performing_users || []).map((item) => (
                  <tr key={item.userId} className="border-t border-slate-100 text-slate-700">
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{item.name || "Unknown User"}</div>
                      {item.email ? <div className="text-xs text-slate-500">{item.email}</div> : null}
                    </td>
                    <td className="py-2 pr-3">{item.attempts ?? 0}</td>
                    <td className="py-2 pr-3">{item.avgScore ?? 0}</td>
                    <td className="py-2 pr-3">{item.avgAccuracy ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(analytics?.top_performing_users || []).length ? (
              <div className="py-4 text-sm text-slate-500">No top-performing users yet.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Manual Reset</h3>
            <p className={ui.muted}>Reset generated daily tests so users can receive a regenerated pool.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={resetting} onClick={handleResetDailyTests} type="button">
            {resetting ? "Resetting..." : "Reset Daily Tests"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className={ui.field}>
            <span>User ID (optional)</span>
            <input
              className={ui.input}
              value={resetInput.user_id}
              onChange={(event) => setResetInput((current) => ({ ...current, user_id: event.target.value }))}
              placeholder="Leave empty for all users"
            />
          </label>
          <label className={ui.field}>
            <span>Date (optional)</span>
            <input
              className={ui.input}
              type="date"
              value={resetInput.date}
              onChange={(event) => setResetInput((current) => ({ ...current, date: event.target.value }))}
            />
          </label>
          <label className={ui.field}>
            <span>Reset All Dates</span>
            <div className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-3">
              <input
                className={ui.checkbox}
                type="checkbox"
                checked={Boolean(resetInput.reset_all)}
                onChange={(event) => setResetInput((current) => ({ ...current, reset_all: event.target.checked }))}
              />
              <span className="text-sm text-slate-700">Ignore date filter and remove all generated tests</span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
}
