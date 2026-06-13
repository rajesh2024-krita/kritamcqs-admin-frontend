import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { appUsageService } from "../api/appUsageService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

function formatSeconds(value) {
  const seconds = Math.max(0, Number(value || 0));
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export function AppUsageAnalyticsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(7);
  const [enabled, setEnabled] = useState(false);
  const [analytics, setAnalytics] = useState({ pages: [], recent: [] });

  async function loadData() {
    setLoading(true);
    try {
      const [settingsResponse, analyticsResponse] = await Promise.all([
        appUsageService.settings(),
        appUsageService.analytics({ days }),
      ]);
      setEnabled(Boolean(settingsResponse.data?.enabled));
      setAnalytics(analyticsResponse.data || { pages: [], recent: [] });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [days]);

  async function toggleTracking(value) {
    setEnabled(value);
    setSaving(true);
    try {
      const response = await appUsageService.saveSettings({ enabled: value });
      setEnabled(Boolean(response.data?.enabled));
      toast.success(response.message || "Usage tracking updated");
    } catch (error) {
      setEnabled(!value);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading app usage analytics..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>App Usage Tracking</div>
            <h2 className="text-xl font-black text-slate-950">Screen Time Analytics</h2>
            <p className={ui.muted}>Enable collection to track which app screens users visit and how many seconds they stay.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleSwitch checked={enabled} disabled={saving} onChange={(value) => void toggleTracking(value)} label={enabled ? "Tracking enabled" : "Tracking disabled"} />
            <select className={ui.input} value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={1}>Last 1 day</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadData}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-sky-100 p-2 text-sky-700"><Activity size={18} /></div>
          <h3 className="text-lg font-black text-slate-950">Most Held Screens</h3>
        </div>
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Screen</th>
                  <th className={ui.tableHead}>Visits</th>
                  <th className={ui.tableHead}>Users</th>
                  <th className={ui.tableHead}>Total Time</th>
                  <th className={ui.tableHead}>Average Time</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.pages || []).map((row) => (
                  <tr key={row.path}>
                    <td className={ui.tableCell}><span className="font-bold text-slate-900">{row.path}</span></td>
                    <td className={ui.tableCell}>{row.visits}</td>
                    <td className={ui.tableCell}>{row.users}</td>
                    <td className={ui.tableCell}>{formatSeconds(row.totalSeconds)}</td>
                    <td className={ui.tableCell}>{formatSeconds(row.averageSeconds)}</td>
                  </tr>
                ))}
                {!analytics.pages?.length ? (
                  <tr><td className={ui.tableCell} colSpan={5}>No usage events collected for this period.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
