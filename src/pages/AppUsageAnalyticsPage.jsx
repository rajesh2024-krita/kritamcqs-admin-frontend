import { memo, useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, Clock, Download, Filter, RefreshCw, Search, Trash2, Users, X } from "lucide-react";
import { appUsageService } from "../api/appUsageService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const dateRangeOptions = [1, 2, 7, 15, 30, 60, 90, 180, 365];
const retentionOptions = [1, 2, 7, 15, 30, 60, 90, 180, 365, "never"];
const pageSizeOptions = [10, 25, 50, 100];
const activityRanges = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Date Range" },
];
const providerOptions = ["Google", "Apple", "Email", "Phone", "Guest", "Facebook"];
const sessionStatusOptions = ["Active", "Completed", "Force Closed", "Crashed"];
const tabs = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "devices", label: "Devices" },
  { key: "sessions", label: "Sessions" },
  { key: "screens", label: "Screens" },
  { key: "events", label: "Events" },
  { key: "performance", label: "Performance" },
  { key: "logs", label: "Logs" },
];

const tableConfigs = {
  users: {
    service: appUsageService.users,
    defaultSortBy: "lastActive",
    columns: [
      { key: "userName", label: "User", sortable: true, fixed: true, render: (row) => row.userName || row._id || "-" },
      { key: "email", label: "Email", sortable: true, render: (row) => row.email || "-" },
      { key: "platform", label: "Platform", sortable: true, render: (row) => row.platform || "-" },
      { key: "loginMethod", label: "Method", render: (row) => row.loginMethod || "-" },
      { key: "userType", label: "Plan", render: (row) => <StatusBadge value={row.userType || "-"} /> },
      { key: "totalSessions", label: "Sessions", sortable: true },
      { key: "lastActive", label: "Last Active", sortable: true, render: (row) => formatDateTime(row.lastActive) },
      { key: "averageSessionDuration", label: "Avg Time", sortable: true, render: (row) => formatSeconds(row.averageSessionDuration) },
    ],
  },
  devices: {
    service: appUsageService.devices,
    defaultSortBy: "lastActive",
    columns: [
      { key: "deviceModel", label: "Device", sortable: true, fixed: true, render: (row) => row.deviceModel || "Unknown" },
      { key: "platform", label: "Platform", sortable: true, render: (row) => row.platform || "-" },
      { key: "appVersion", label: "App Version", sortable: true, render: (row) => row.appVersion || "-" },
      { key: "osVersion", label: "OS", render: (row) => row.osVersion || "-" },
      { key: "users", label: "Users", sortable: true },
      { key: "sessions", label: "Sessions", sortable: true },
      { key: "averageSessionDuration", label: "Avg Time", render: (row) => formatSeconds(row.averageSessionDuration) },
      { key: "lastActive", label: "Last Active", sortable: true, render: (row) => formatDateTime(row.lastActive) },
    ],
  },
  sessions: {
    service: appUsageService.sessions,
    defaultSortBy: "lastActiveAt",
    columns: [
      { key: "userName", label: "User", sortable: true, fixed: true, render: (row) => row.userName || row.userId || "-" },
      { key: "sessionId", label: "Session", render: (row) => <span className="font-mono text-xs">{row.sessionId}</span> },
      { key: "platform", label: "Platform", sortable: true },
      { key: "entryScreen", label: "Entry", render: (row) => row.entryScreen || "-" },
      { key: "exitScreen", label: "Exit", render: (row) => row.exitScreen || "-" },
      { key: "durationSeconds", label: "Duration", sortable: true, render: (row) => formatSeconds(row.durationSeconds) },
      { key: "screenViews", label: "Views", sortable: true },
      { key: "clicks", label: "Clicks", sortable: true },
      { key: "lastActiveAt", label: "Last Active", sortable: true, render: (row) => formatDateTime(row.lastActiveAt) },
    ],
  },
  screens: {
    service: appUsageService.screens,
    defaultSortBy: "lastSeen",
    columns: [
      { key: "screen", label: "Screen", sortable: true, fixed: true, render: (row) => row.screen || "-" },
      { key: "visits", label: "Visits", sortable: true },
      { key: "users", label: "Users", sortable: true },
      { key: "totalSeconds", label: "Total Time", sortable: true, render: (row) => formatSeconds(row.totalSeconds) },
      { key: "averageSeconds", label: "Avg Time", sortable: true, render: (row) => formatSeconds(row.averageSeconds) },
      { key: "lastSeen", label: "Last Seen", sortable: true, render: (row) => formatDateTime(row.lastSeen) },
    ],
  },
  events: {
    service: appUsageService.events,
    defaultSortBy: "timestamp",
    columns: [
      { key: "timestamp", label: "Time", sortable: true, fixed: true, render: (row) => formatDateTime(row.timestamp) },
      { key: "userName", label: "User", sortable: true, render: (row) => row.userName || row.email || row.userId || "-" },
      { key: "eventType", label: "Event", sortable: true, render: (row) => <StatusBadge value={row.eventType || "-"} /> },
      { key: "screen", label: "Screen", sortable: true, render: (row) => row.screen || "-" },
      { key: "componentName", label: "Component", sortable: true, render: (row) => row.componentName || "-" },
      { key: "componentType", label: "Type", render: (row) => row.componentType || "-" },
      { key: "platform", label: "Platform", sortable: true, render: (row) => row.platform || "-" },
      { key: "deviceModel", label: "Device", render: (row) => row.deviceModel || "-" },
    ],
  },
};

function formatSeconds(value) {
  const seconds = Math.max(0, Number(value || 0));
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${Math.round(seconds % 60)}s`;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function AppUsageAnalyticsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [settings, setSettings] = useState({ enabled: false, automaticCleanupEnabled: false, retentionDays: 90, retentionNeverDelete: false, sessionTimeoutMinutes: 30 });
  const [analytics, setAnalytics] = useState({ summary: {}, pages: [], clicks: [], dailyActive: [], hourly: [], platform: [], users: [], recent: [] });
  const [filters, setFilters] = useState({ days: 7, platform: "all", plan: "all", eventType: "all", screen: "" });
  const [tableSearch, setTableSearch] = useState("");
  const debouncedSearch = useDebouncedValue(tableSearch);
  const [tableState, setTableState] = useState(() => Object.fromEntries(Object.keys(tableConfigs).map((key) => [key, { rows: [], meta: null, page: 1, limit: 25, sortBy: tableConfigs[key].defaultSortBy, sortOrder: "desc" }])));
  const [activityUser, setActivityUser] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [activityFilters, setActivityFilters] = useState({ range: "today", from: "", to: "", platform: "all", appVersion: "", loginProvider: "all", deviceModel: "", sessionStatus: "all", search: "", page: 1, limit: 10 });
  const debouncedActivitySearch = useDebouncedValue(activityFilters.search);

  const query = useMemo(() => ({ ...filters }), [filters]);
  const summary = analytics.summary || {};
  const retentionRate = summary.activeUsers ? Math.round((Number(summary.todaysActiveUsers || 0) / Number(summary.activeUsers || 1)) * 100) : 0;
  const kpis = [
    { label: "Total Users", value: summary.activeUsers ?? 0, icon: Users },
    { label: "Active Users", value: summary.todaysActiveUsers ?? 0, icon: Activity },
    { label: "New Users", value: summary.newUsers ?? 0, icon: Users },
    { label: "Premium Users", value: summary.premiumUsers ?? 0, icon: Users },
    { label: "Free Users", value: summary.freeUsers ?? 0, icon: Users },
    { label: "Sessions", value: summary.totalSessions ?? 0, icon: Activity },
    { label: "Avg Session Time", value: formatSeconds(summary.averageSessionDuration), icon: Clock },
    { label: "Retention Rate", value: `${retentionRate}%`, icon: Activity },
  ];

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const [settingsResponse, analyticsResponse] = await Promise.all([
        appUsageService.settings(),
        appUsageService.analytics(query),
      ]);
      setSettings((current) => ({ ...current, ...(settingsResponse.data || {}) }));
      setAnalytics(analyticsResponse.data || {});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadTable(tab = activeTab, patch = {}) {
    const config = tableConfigs[tab];
    if (!config) return;
    const next = { ...tableState[tab], ...patch };
    setTableLoading(true);
    try {
      const response = await config.service({ ...query, page: next.page, limit: next.limit, sortBy: next.sortBy, sortOrder: next.sortOrder, search: debouncedSearch });
      setTableState((current) => ({ ...current, [tab]: { ...next, rows: response.data || [], meta: response.meta || null } }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, [query.days, query.platform, query.plan, query.eventType, query.screen]);

  useEffect(() => {
    if (!tableConfigs[activeTab]) return;
    void loadTable(activeTab, { page: 1 });
  }, [activeTab, query.days, query.platform, query.plan, query.eventType, query.screen, debouncedSearch]);

  useEffect(() => {
    if (!activityUser) return;
    void loadUserActivity(activityUser);
  }, [activityUser, activityFilters.range, activityFilters.from, activityFilters.to, activityFilters.platform, activityFilters.appVersion, activityFilters.loginProvider, activityFilters.deviceModel, activityFilters.sessionStatus, activityFilters.page, activityFilters.limit, debouncedActivitySearch]);

  async function saveSettings(nextSettings) {
    setSettings(nextSettings);
    try {
      const response = await appUsageService.saveSettings(nextSettings);
      setSettings({ ...nextSettings, ...(response.data || {}) });
      toast.success(response.message || "App usage settings updated");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteLogs() {
    if (!window.confirm("Delete matching app usage logs? This cannot be undone.")) return;
    try {
      const response = await appUsageService.deleteLogs(query);
      toast.success(response.message || "Logs deleted");
      await loadOverview();
      if (tableConfigs[activeTab]) await loadTable(activeTab);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setTableState((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, { ...value, page: 1 }])));
  }

  function openUserActivity(row) {
    const userId = row?._id || row?.userId || row?.id;
    if (!userId) return;
    setActivityUser({ id: userId, userName: row.userName || "", email: row.email || "", loginMethod: row.loginMethod || "" });
    setActivityFilters((current) => ({ ...current, page: 1 }));
  }

  function updateActivityFilters(patch) {
    setActivityFilters((current) => ({ ...current, ...patch, page: patch.page || 1 }));
  }

  async function loadUserActivity(user) {
    setActivityLoading(true);
    try {
      const response = await appUsageService.userActivity(user.id, { ...activityFilters, search: debouncedActivitySearch });
      setActivityData(response);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActivityLoading(false);
    }
  }

  if (overviewLoading && !analytics.summary) return <LoadingSpinner label="Loading app usage analytics..." />;

  return (
    <div className="flex flex-col gap-5">
      <section className={cn(ui.panel, "overflow-hidden")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={ui.eyebrow}>App Usage Monitoring</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Usage Dashboard</h2>
            <p className={ui.muted}>Compact analytics, paginated tables, retention controls, and exports.</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:w-auto">
            <select className={ui.input} value={filters.days} onChange={(event) => updateFilters({ days: Number(event.target.value) })}>
              {dateRangeOptions.map((days) => <option key={days} value={days}>Last {days} {days === 1 ? "day" : "days"}</option>)}
            </select>
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
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => {
              void loadOverview();
              if (tableConfigs[activeTab]) void loadTable(activeTab);
            }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700"><Filter size={16} /> More filters</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select className={ui.input} value={filters.eventType} onChange={(event) => updateFilters({ eventType: event.target.value })}>
              <option value="all">All event types</option>
              <option value="Login">Login</option>
              <option value="ScreenView">Screen views</option>
              <option value="Click">Clicks</option>
              <option value="Navigation">Navigation</option>
              <option value="Background">Background</option>
              <option value="Foreground">Foreground</option>
            </select>
            <input className={ui.input} value={filters.screen} placeholder="Screen contains..." onChange={(event) => updateFilters({ screen: event.target.value })} />
            <ToggleSwitch checked={Boolean(settings.enabled)} onChange={(enabled) => void saveSettings({ ...settings, enabled })} label={settings.enabled ? "Tracking enabled" : "Tracking disabled"} />
          </div>
        </details>
      </section>

      <KpiGrid cards={kpis} />

      <nav className="sticky top-28 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        {tabs.map((tab) => (
          <button key={tab.key} className={cn("shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition", activeTab === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? <OverviewTab analytics={analytics} /> : null}
      {activeTab === "performance" ? <PerformanceTab analytics={analytics} /> : null}
      {activeTab === "logs" ? <LogsTab settings={settings} query={query} saveSettings={saveSettings} deleteLogs={deleteLogs} /> : null}
      {tableConfigs[activeTab] ? (
        <ServerTable
          config={tableConfigs[activeTab]}
          loading={tableLoading}
          search={tableSearch}
          setSearch={setTableSearch}
          state={tableState[activeTab]}
          onChange={(patch) => void loadTable(activeTab, patch)}
          exportQuery={query}
          tabKey={activeTab}
          onRowClick={activeTab === "users" ? openUserActivity : undefined}
        />
      ) : null}
      <UserActivityDrawer
        open={Boolean(activityUser)}
        user={activityUser}
        loading={activityLoading}
        data={activityData}
        filters={activityFilters}
        onFilterChange={updateActivityFilters}
        onClose={() => {
          setActivityUser(null);
          setActivityData(null);
        }}
      />
    </div>
  );
}

const KpiGrid = memo(function KpiGrid({ cards }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className={cn(ui.metricCard, "transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200")}>
          <div className="flex items-start justify-between gap-3">
            <span className={ui.metricLabel}>{label}</span>
            <span className="rounded-lg bg-sky-50 p-2 text-sky-700"><Icon size={18} /></span>
          </div>
          <strong className="mt-3 block text-2xl font-black tracking-tight text-slate-950">{value}</strong>
        </div>
      ))}
    </section>
  );
});

function OverviewTab({ analytics }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <MiniChart title="Daily Active Users" rows={analytics.dailyActive || []} labelKey="date" valueKey="users" />
      <MiniChart title="Platform Distribution" rows={analytics.platform || []} labelKey="platform" valueKey="events" />
      <CompactList title="Most Used Screens" rows={analytics.pages || []} render={(row) => `${row.path || "-"} - ${row.visits || 0} visits`} />
      <CompactList title="Most Clicked Components" rows={analytics.clicks || []} render={(row) => `${row.componentName || "Unknown"} - ${row.count || 0} clicks`} />
    </div>
  );
}

function PerformanceTab({ analytics }) {
  const summary = analytics.summary || {};
  const rows = [
    ["Screen views", summary.totalScreenViews || 0],
    ["Clicks", summary.totalClicks || 0],
    ["Average session", formatSeconds(summary.averageSessionDuration)],
    ["Android users", summary.androidUsers || 0],
    ["iOS users", summary.iosUsers || 0],
  ];
  return <CompactList title="Performance Snapshot" rows={rows} render={(row) => `${row[0]} - ${row[1]}`} />;
}

function LogsTab({ settings, query, saveSettings, deleteLogs }) {
  const retentionValue = settings.retentionNeverDelete ? "never" : Number(settings.retentionDays || 90);
  return (
    <section className={ui.panel}>
      <div className={ui.sectionHead}>
        <div>
          <h3 className="text-lg font-black text-slate-950">Retention & Data Deletion</h3>
          <p className={ui.muted}>Current manual delete filter: last {query.days} days, {query.platform}, {query.plan}.</p>
        </div>
        <button className={cn(ui.buttonBase, ui.buttonDanger)} type="button" onClick={deleteLogs}><Trash2 size={16} /> Delete Filtered Logs</button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ToggleSwitch checked={Boolean(settings.automaticCleanupEnabled) && !settings.retentionNeverDelete} disabled={settings.retentionNeverDelete} onChange={(automaticCleanupEnabled) => void saveSettings({ ...settings, automaticCleanupEnabled })} label="Automatic cleanup" />
        <select className={ui.input} value={retentionValue} onChange={(event) => {
          const value = event.target.value;
          void saveSettings({ ...settings, retentionNeverDelete: value === "never", automaticCleanupEnabled: value === "never" ? false : settings.automaticCleanupEnabled, retentionDays: value === "never" ? 365 : Number(value) });
        }}>
          {retentionOptions.map((option) => <option key={option} value={option}>{option === "never" ? "Never Delete" : `${option} ${option === 1 ? "Day" : "Days"}`}</option>)}
        </select>
        <input className={ui.input} type="number" min="5" max="240" value={settings.sessionTimeoutMinutes || 30} onChange={(event) => void saveSettings({ ...settings, sessionTimeoutMinutes: Number(event.target.value) })} />
      </div>
    </section>
  );
}

function UserActivityDrawer({ open, user, loading, data, filters, onFilterChange, onClose }) {
  if (!open) return null;
  const payload = data?.data || {};
  const summary = payload.summary || {};
  const sessionsByDay = payload.sessionsByDay || [];
  const meta = data?.meta;
  const displayUser = payload.user || user || {};
  const metricCards = [
    ["Total Sessions", summary.totalSessions || 0],
    ["Total Time Spent", formatSeconds(summary.totalTimeSpent)],
    ["Average Session", formatSeconds(summary.averageSessionDuration)],
    ["Longest Session", formatSeconds(summary.longestSession)],
    ["Shortest Session", formatSeconds(summary.shortestSession)],
    ["Last Active", formatDateTime(summary.lastActiveDateTime)],
    ["First Login", formatDateTime(summary.firstLoginDate)],
    ["App Opens", summary.totalAppOpens || 0],
    ["Screen Views", summary.totalScreenViews || 0],
    ["Active Days", summary.activeDays || 0],
    ["Inactive Days", summary.inactiveDays || 0],
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <button type="button" className="hidden flex-1 lg:block" aria-label="Close activity drawer" onClick={onClose} />
      <aside className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl lg:max-w-6xl">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={ui.eyebrow}>User Activity Details</div>
              <h3 className="truncate text-xl font-black text-slate-950">{displayUser.name || displayUser.userName || user?.userName || "Selected User"}</h3>
              <p className="truncate text-sm text-slate-500">{displayUser.email || user?.email || displayUser.id}</p>
            </div>
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary, "shrink-0 px-3")} onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select className={ui.input} value={filters.range} onChange={(event) => onFilterChange({ range: event.target.value })}>
              {activityRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
            <select className={ui.input} value={filters.platform} onChange={(event) => onFilterChange({ platform: event.target.value })}>
              <option value="all">All platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
            <select className={ui.input} value={filters.loginProvider} onChange={(event) => onFilterChange({ loginProvider: event.target.value })}>
              <option value="all">All providers</option>
              {providerOptions.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
            <select className={ui.input} value={filters.sessionStatus} onChange={(event) => onFilterChange({ sessionStatus: event.target.value })}>
              <option value="all">All statuses</option>
              {sessionStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {filters.range === "custom" ? (
              <>
                <input className={ui.input} type="date" value={filters.from} onChange={(event) => onFilterChange({ from: event.target.value })} />
                <input className={ui.input} type="date" value={filters.to} onChange={(event) => onFilterChange({ to: event.target.value })} />
              </>
            ) : null}
            <input className={ui.input} value={filters.appVersion} placeholder="App version" onChange={(event) => onFilterChange({ appVersion: event.target.value })} />
            <input className={ui.input} value={filters.deviceModel} placeholder="Device" onChange={(event) => onFilterChange({ deviceModel: event.target.value })} />
            <label className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className={cn(ui.input, "pl-9")} value={filters.search} placeholder="Search screens or events..." onChange={(event) => onFilterChange({ search: event.target.value })} />
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="block text-xs font-bold uppercase text-slate-500">{label}</span>
                <strong className="mt-1 block truncate text-base font-black text-slate-950">{value}</strong>
              </div>
            ))}
          </section>

          <section className={cn(ui.panel, "mt-5")}>
            <h4 className="text-base font-black text-slate-950">Most Visited Screens</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(summary.mostVisitedScreens || []).map((screen) => (
                <div key={screen.screen} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <strong className="block truncate text-slate-900">{screen.screen}</strong>
                  <span className="text-slate-500">{screen.views} views, {formatSeconds(screen.totalSeconds)}</span>
                </div>
              ))}
              {!(summary.mostVisitedScreens || []).length ? <p className={ui.muted}>No screen visits found.</p> : null}
            </div>
          </section>

          <section className="mt-5 space-y-4">
            {loading ? <ActivitySkeleton /> : null}
            {!loading && sessionsByDay.map((day) => (
              <div key={day.date}>
                <h4 className="mb-2 text-sm font-black text-slate-700">{day.date}</h4>
                <div className="space-y-3">
                  {day.sessions.map((session) => <SessionCard key={session.sessionId} session={session} />)}
                </div>
              </div>
            ))}
            {!loading && !sessionsByDay.length ? <div className={cn(ui.panel, "text-sm text-slate-500")}>No activity found for these filters.</div> : null}
          </section>
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select className={cn(ui.input, "sm:w-36")} value={filters.limit} onChange={(event) => onFilterChange({ limit: Number(event.target.value) })}>
              {pageSizeOptions.map((limit) => <option key={limit} value={limit}>{limit} sessions</option>)}
            </select>
            <Pagination meta={meta} onChange={(page) => onFilterChange({ page })} />
          </div>
        </footer>
      </aside>
    </div>
  );
}

function SessionCard({ session }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-slate-950">{formatDateTime(session.startedAt)}</strong>
            <StatusBadge value={session.status || "Active"} />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{session.platform || "-"} / {session.appVersion || "-"} / {session.deviceModel || "Unknown device"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm font-bold text-slate-700">
          {formatSeconds(session.durationSeconds)}
          <ChevronDown size={16} />
        </div>
      </summary>
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Start Time" value={formatDateTime(session.startedAt)} />
        <InfoItem label="End Time" value={formatDateTime(session.endedAt)} />
        <InfoItem label="Login Provider" value={session.loginMethod || "-"} />
        <InfoItem label="IP Address" value={session.ipAddress || "-"} />
        <InfoItem label="Platform" value={session.platform || "-"} />
        <InfoItem label="App Version" value={session.appVersion || "-"} />
        <InfoItem label="Device" value={session.deviceModel || "-"} />
        <InfoItem label="OS" value={session.osVersion || "-"} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex min-w-max items-center gap-2 text-sm font-bold text-slate-700">
          {(session.navigationFlow || []).map((screen, index) => (
            <span key={`${screen}-${index}`} className="flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">{screen}</span>
              {index < session.navigationFlow.length - 1 ? <span className="text-slate-400">-&gt;</span> : null}
            </span>
          ))}
          {!(session.navigationFlow || []).length ? <span className="text-slate-500">No navigation flow captured.</span> : null}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {(session.screens || []).map((screen, index) => (
          <div key={`${screen.screenName}-${index}`} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm text-slate-950">{screen.screenName}</strong>
              <span className="text-xs font-bold text-slate-500">{formatSeconds(screen.durationSeconds)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(screen.entryTime)} to {formatDateTime(screen.exitTime)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(screen.actions || []).map((action, actionIndex) => (
                <span key={actionIndex} className={cn(ui.pill, "max-w-full truncate")}>{action.componentName || action.action || action.eventType}</span>
              ))}
              {!(screen.actions || []).length ? <span className="text-xs text-slate-400">No actions captured on this screen.</span> : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs font-bold uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block truncate text-slate-900">{value}</strong>
    </div>
  );
}

function ActivitySkeleton() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
  ));
}

function ServerTable({ config, loading, search, setSearch, state, onChange, exportQuery, tabKey, onRowClick }) {
  const sortLabel = state.sortOrder === "asc" ? "ASC" : "DESC";
  return (
    <section className={ui.panel}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className={cn(ui.input, "pl-9")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search table..." />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select className={ui.input} value={state.limit} onChange={(event) => onChange({ page: 1, limit: Number(event.target.value) })}>
            {pageSizeOptions.map((limit) => <option key={limit} value={limit}>{limit} rows</option>)}
          </select>
          <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={appUsageService.exportUrl({ ...exportQuery, dataset: tabKey === "sessions" ? "sessions" : "events", format: "csv" })}><Download size={16} /> Export</a>
        </div>
      </div>
      <div className={cn(ui.tableWrap, "mt-4")}>
        <div className="max-h-[62vh] overflow-auto">
          <table className={cn(ui.table, "min-w-[980px]")}>
            <thead className="sticky top-0 z-10">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key} className={cn(ui.tableHead, column.fixed && "sticky left-0 z-20 min-w-48 bg-slate-50")}>
                    <button type="button" disabled={!column.sortable} className="flex items-center gap-1 disabled:cursor-default" onClick={() => onChange({ page: 1, sortBy: column.key, sortOrder: state.sortBy === column.key && state.sortOrder === "desc" ? "asc" : "desc" })}>
                      {column.label} {state.sortBy === column.key ? sortLabel : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows colSpan={config.columns.length} /> : null}
              {!loading && state.rows.map((row, index) => (
                <tr key={row.id || row._id || row.sessionId || `${index}`} className={cn(onRowClick && "cursor-pointer hover:bg-sky-50")} onClick={() => onRowClick?.(row)}>
                  {config.columns.map((column) => (
                    <td key={column.key} className={cn(ui.tableCell, column.fixed && "sticky left-0 z-0 min-w-48 bg-white font-bold text-slate-900", onRowClick && column.fixed && "hover:bg-sky-50")}>
                      {column.render ? column.render(row) : row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && !state.rows.length ? <tr><td className={ui.tableCell} colSpan={config.columns.length}>No data found for this filter.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination meta={state.meta} onChange={(page) => onChange({ page })} />
    </section>
  );
}

function SkeletonRows({ colSpan }) {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index}><td className={ui.tableCell} colSpan={colSpan}><div className="h-4 w-full animate-pulse rounded bg-slate-100" /></td></tr>
  ));
}

function StatusBadge({ value }) {
  return <span className={cn(ui.pill, String(value).toLowerCase().includes("premium") ? "border-amber-200 bg-amber-50 text-amber-700" : "")}>{value}</span>;
}

function MiniChart({ title, rows, labelKey, valueKey }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <section className={ui.panel}>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.slice(0, 10).map((row) => (
          <div key={row[labelKey]} className="grid grid-cols-[minmax(80px,140px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate font-semibold text-slate-700">{row[labelKey] || "Unknown"}</span>
            <span className="h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, (Number(row[valueKey] || 0) / max) * 100)}%` }} /></span>
            <strong>{row[valueKey] || 0}</strong>
          </div>
        ))}
        {!rows.length ? <p className={ui.muted}>No chart data for this period.</p> : null}
      </div>
    </section>
  );
}

function CompactList({ title, rows, render }) {
  return (
    <section className={ui.panel}>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.slice(0, 8).map((row, index) => <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{render(row)}</div>)}
        {!rows.length ? <p className={ui.muted}>No data for this period.</p> : null}
      </div>
    </section>
  );
}
