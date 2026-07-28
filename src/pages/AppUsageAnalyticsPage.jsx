import { useEffect, useState } from "react";
import { Activity, Download, RefreshCw, Trash2 } from "lucide-react";
import { appUsageService } from "../api/appUsageService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { Pagination } from "../components/tables/Pagination";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const retentionOptions = [7, 15, 30, 60, 90, 180, 365];
const dateRangeOptions = [1, 2, 7, 30, 90, 365];

function formatSeconds(value) {
  const seconds = Math.max(0, Number(value || 0));
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${rest}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function AppUsageAnalyticsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(7);
  const [filters, setFilters] = useState({ platform: "all", plan: "all", screen: "", eventType: "all" });
  const [settings, setSettings] = useState({ enabled: false, automaticCleanupEnabled: false, retentionDays: 90, sessionTimeoutMinutes: 30 });
  const [analytics, setAnalytics] = useState({ summary: {}, pages: [], clicks: [], dailyActive: [], hourly: [], platform: [], users: [], recent: [] });
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState(null);
  const [usersQuery, setUsersQuery] = useState({ page: 1, limit: 20 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeline, setTimeline] = useState({ dates: [], events: [] });
  const [selectedDate, setSelectedDate] = useState("");

  const query = { days, ...filters };

  async function loadData() {
    setLoading(true);
    try {
      const [settingsResponse, analyticsResponse, usersResponse] = await Promise.all([
        appUsageService.settings(),
        appUsageService.analytics(query),
        appUsageService.users({ ...query, ...usersQuery }),
      ]);
      setSettings((current) => ({ ...current, ...(settingsResponse.data || {}) }));
      setAnalytics(analyticsResponse.data || {});
      setUsers(usersResponse.data || []);
      setUsersMeta(usersResponse.meta || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [days, filters.platform, filters.plan, filters.eventType, usersQuery.page, usersQuery.limit]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setUsersQuery((current) => ({ ...current, page: 1 }));
  }

  async function saveSettings(nextSettings) {
    setSettings(nextSettings);
    setSaving(true);
    try {
      const response = await appUsageService.saveSettings(nextSettings);
      setSettings({ ...nextSettings, ...(response.data || {}) });
      toast.success(response.message || "App usage settings updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function loadTimeline(user, date = "") {
    setSelectedUser(user);
    setSelectedDate(date);
    try {
      const response = await appUsageService.userTimeline(user._id || user.userId, date ? { date } : {});
      setTimeline(response.data || { dates: [], events: [] });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteLogs(payload) {
    if (!window.confirm("Delete matching app usage logs? This cannot be undone.")) return;
    try {
      const response = await appUsageService.deleteLogs(payload);
      toast.success(response.message || "Logs deleted");
      await loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <LoadingSpinner label="Loading app usage analytics..." />;

  const summary = analytics.summary || {};
  const cards = [
    ["Today's Active Users", summary.todaysActiveUsers],
    ["Total Sessions", summary.totalSessions],
    ["Avg Session Duration", formatSeconds(summary.averageSessionDuration)],
    ["Total Screen Views", summary.totalScreenViews],
    ["Total Clicks", summary.totalClicks],
    ["Premium Users", summary.premiumUsers],
    ["Free Users", summary.freeUsers],
    ["Android Users", summary.androidUsers],
    ["iOS Users", summary.iosUsers],
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>App Usage Monitoring</div>
            <h2 className="text-xl font-black text-slate-950">In-house Analytics</h2>
            <p className={ui.muted}>Sessions, screens, clicks, devices, timelines, exports, and retention controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleSwitch checked={Boolean(settings.enabled)} disabled={saving} onChange={(enabled) => void saveSettings({ ...settings, enabled })} label={settings.enabled ? "Tracking enabled" : "Tracking disabled"} />
            <select className={ui.input} value={days} onChange={(event) => {
              setDays(Number(event.target.value));
              setUsersQuery((current) => ({ ...current, page: 1 }));
            }}>
              {dateRangeOptions.map((daysOption) => (
                <option key={daysOption} value={daysOption}>Last {daysOption} {daysOption === 1 ? "day" : "days"}</option>
              ))}
            </select>
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadData}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className={ui.input} value={filters.platform} onChange={(event) => updateFilters({ platform: event.target.value })}>
            <option value="all">All platforms</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="web">Web</option>
          </select>
          <select className={ui.input} value={filters.plan} onChange={(event) => updateFilters({ plan: event.target.value })}>
            <option value="all">All plans</option>
            <option value="Free">Free</option>
            <option value="Premium">Premium</option>
          </select>
          <select className={ui.input} value={filters.eventType} onChange={(event) => updateFilters({ eventType: event.target.value })}>
            <option value="all">All event types</option>
            <option value="Login">Login</option>
            <option value="ScreenView">Screen views</option>
            <option value="Click">Clicks</option>
            <option value="Navigation">Navigation</option>
            <option value="Background">Background</option>
            <option value="Foreground">Foreground</option>
          </select>
          <input className={ui.input} value={filters.screen} placeholder="Screen filter" onChange={(event) => updateFilters({ screen: event.target.value })} onBlur={loadData} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className={ui.metricCard}>
            <span className={ui.metricLabel}>{label}</span>
            <strong className="mt-2 block text-2xl font-black text-slate-950">{value ?? 0}</strong>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsTable title="Most Used Screens" rows={analytics.pages || []} columns={["Screen", "Visits", "Users", "Total Time", "Avg Time"]} render={(row) => [row.path || "-", row.visits, row.users, formatSeconds(row.totalSeconds), formatSeconds(row.averageSeconds)]} />
        <AnalyticsTable title="Most Clicked Components" rows={analytics.clicks || []} columns={["Component", "Type", "Screen", "Clicks", "Last Clicked"]} render={(row) => [row.componentName, row.componentType, row.screen || "-", row.count, formatDateTime(row.lastClickedAt)]} />
        <AnalyticsTable title="Daily Active Users" rows={analytics.dailyActive || []} columns={["Date", "Users", "Events"]} render={(row) => [row.date, row.users, row.events]} />
        <AnalyticsTable title="Platform Distribution" rows={analytics.platform || []} columns={["Platform", "Users", "Events"]} render={(row) => [row.platform, row.users, row.events]} />
      </div>

      <AnalyticsTable
        title="Recent Events"
        rows={analytics.recent || []}
        columns={["Time", "User", "Event", "Screen", "Method", "Platform"]}
        render={(row) => [
          formatDateTime(row.timestamp),
          row.userName || row.email || row.userId || "-",
          row.eventType || "-",
          row.screen || row.componentName || "-",
          row.loginMethod || row.metadata?.loginProvider || "-",
          row.platform || "-",
        ]}
      />

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-lg font-black text-slate-950">Users</h3>
            <p className={ui.muted}>Click a user to inspect access dates and full timelines.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Rows
              <select className={ui.input} value={usersQuery.limit} onChange={(event) => setUsersQuery({ page: 1, limit: Number(event.target.value) })}>
                {[10, 20, 50, 100].map((limit) => <option key={limit} value={limit}>{limit}</option>)}
              </select>
            </label>
            <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={appUsageService.exportUrl({ ...query, dataset: "events", format: "csv" })}><Download size={16} /> CSV</a>
            <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={appUsageService.exportUrl({ ...query, dataset: "sessions", format: "xlsx" })}><Download size={16} /> Excel</a>
            <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={appUsageService.exportUrl({ ...query, dataset: "events", format: "pdf" })}><Download size={16} /> PDF</a>
          </div>
        </div>
        <div className={cn(ui.tableWrap, "mt-4")}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Email</th><th className={ui.tableHead}>Platform</th><th className={ui.tableHead}>Method</th><th className={ui.tableHead}>Plan</th><th className={ui.tableHead}>Sessions</th><th className={ui.tableHead}>Last Active</th><th className={ui.tableHead}>Avg Duration</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className={ui.tableCell}><button className="font-bold text-sky-700" onClick={() => void loadTimeline(user)}>{user.userName || user._id}</button></td>
                    <td className={ui.tableCell}>{user.email || "-"}</td>
                    <td className={ui.tableCell}>{user.platform || "-"}</td>
                    <td className={ui.tableCell}>{user.loginMethod || "-"}</td>
                    <td className={ui.tableCell}>{user.userType || "-"}</td>
                    <td className={ui.tableCell}>{user.totalSessions || 0}</td>
                    <td className={ui.tableCell}>{formatDateTime(user.lastActive)}</td>
                    <td className={ui.tableCell}>{formatSeconds(user.averageSessionDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination meta={usersMeta} onChange={(page) => setUsersQuery((current) => ({ ...current, page }))} />
      </section>

      {selectedUser ? (
        <section className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-lg font-black text-slate-950">{selectedUser.userName || selectedUser.email || selectedUser._id}</h3>
              <p className={ui.muted}>Activity dates and selected-day timeline.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(timeline.dates || []).map((item) => (
              <button key={item.date} className={cn(ui.buttonBase, selectedDate === item.date ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => void loadTimeline(selectedUser, item.date)}>
                {item.date}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {(timeline.events || []).map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-slate-950">{formatDateTime(event.timestamp)} - {event.eventType}</strong>
                  <span className={ui.pill}>{event.platform || "unknown"} / {event.deviceModel || "device"}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{event.screen || "-"} {event.componentName ? `- ${event.componentName}` : ""} {event.durationSeconds ? `(${formatSeconds(event.durationSeconds)})` : ""}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-lg font-black text-slate-950">Retention & Delete</h3>
            <p className={ui.muted}>Cleanup runs automatically in the app backend when enabled. Manual deletes require confirmation.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <ToggleSwitch checked={Boolean(settings.automaticCleanupEnabled)} disabled={saving} onChange={(automaticCleanupEnabled) => void saveSettings({ ...settings, automaticCleanupEnabled })} label="Automatic cleanup" />
          <select className={ui.input} value={settings.retentionDays || 90} onChange={(event) => void saveSettings({ ...settings, retentionDays: Number(event.target.value) })}>
            {retentionOptions.map((daysOption) => <option key={daysOption} value={daysOption}>{daysOption} days</option>)}
          </select>
          <input className={ui.input} type="number" min="5" max="240" value={settings.sessionTimeoutMinutes || 30} onChange={(event) => setSettings((current) => ({ ...current, sessionTimeoutMinutes: Number(event.target.value) }))} onBlur={() => void saveSettings(settings)} />
          <button className={cn(ui.buttonBase, ui.buttonDanger)} type="button" onClick={() => void deleteLogs({ ...query })}>
            <Trash2 size={16} /> Delete Filtered Logs
          </button>
        </div>
      </section>
    </div>
  );
}

function AnalyticsTable({ title, rows, columns, render }) {
  return (
    <section className={ui.panel}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-sky-100 p-2 text-sky-700"><Activity size={18} /></div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
      </div>
      <div className={ui.tableWrap}>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead><tr>{columns.map((column) => <th key={column} className={ui.tableHead}>{column}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => <tr key={index}>{render(row).map((value, valueIndex) => <td key={valueIndex} className={ui.tableCell}>{value}</td>)}</tr>)}
              {!rows.length ? <tr><td className={ui.tableCell} colSpan={columns.length}>No data for this period.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
