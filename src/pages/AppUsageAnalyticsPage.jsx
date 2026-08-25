import { Fragment, memo, useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, Clock, Download, Filter, RefreshCw, Search, Trash2, Users, X, BarChart3, PieChart, TrendingUp, UserCheck, Smartphone, Globe, Zap, Shield, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
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
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "userAnalytics", label: "User Analytics", icon: Users },
  { key: "users", label: "Users", icon: UserCheck },
  { key: "devices", label: "Devices", icon: Smartphone },
  { key: "sessions", label: "Sessions", icon: Activity },
  { key: "screens", label: "Screens", icon: Globe },
  { key: "events", label: "Events", icon: Zap },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "logs", label: "Logs", icon: Shield },
];

const tableConfigs = {
  userAnalytics: {
    service: appUsageService.userAnalytics,
    defaultSortBy: "timestamp",
    columns: [
      { key: "eventTimestamp", label: "Activity Date & Time", sortable: true, fixed: true, render: (row) => formatDateTime(row.eventTimestamp) },
      { key: "name", label: "User", sortable: true, render: (row) => row.name || row.userId || "-" },
      { key: "email", label: "Email", sortable: true, render: (row) => row.email || "-" },
      { key: "mobile", label: "Mobile", render: (row) => row.mobile || "-" },
      { key: "eventType", label: "Activity", sortable: true, render: (row) => <StatusBadge value={row.eventType || "-"} /> },
      { key: "screen", label: "Page / Screen", sortable: true, render: (row) => row.screen || "-" },
      { key: "action", label: "Action", render: (row) => row.action || row.componentName || "-" },
      { key: "visitCount", label: "Visits", sortable: false },
      { key: "totalSessions", label: "Sessions", sortable: false },
      { key: "totalTimeSpentSeconds", label: "Time Spent", render: (row) => formatSeconds(row.totalTimeSpentSeconds) },
      { key: "totalSpent", label: "Total Spent", render: (row) => `${row.currency || ""} ${Number(row.totalSpent || 0).toFixed(2)}`.trim() },
      { key: "transactionCount", label: "Transactions" },
      { key: "latestTransactionId", label: "Latest Transaction", render: (row) => row.latestTransactionId || "-" },
      { key: "latestTransactionAt", label: "Transaction Time", render: (row) => formatDateTime(row.latestTransactionAt) },
      { key: "platform", label: "Platform", render: (row) => row.platform || "-" },
      { key: "deviceModel", label: "Device", render: (row) => row.deviceModel || "-" },
      { key: "registeredAt", label: "Registered", render: (row) => formatDateTime(row.registeredAt) },
      { key: "lastLoginAt", label: "Last Login", render: (row) => formatDateTime(row.lastLoginAt) },
      { key: "userType", label: "Plan", render: (row) => <StatusBadge value={row.userType || "-"} /> },
    ],
  },
  users: {
    service: appUsageService.users,
    defaultSortBy: "lastActive",
    columns: [
      { key: "userName", label: "User", sortable: true, fixed: true, render: (row) => row.userName || row._id || "-" },
      { key: "email", label: "Email", sortable: true, render: (row) => row.email || "-" },
      { key: "mobile", label: "Mobile", render: (row) => row.mobile || "-" },
      { key: "platform", label: "Platform", sortable: true, render: (row) => row.platform || "-" },
      { key: "loginMethod", label: "Method", render: (row) => row.loginMethod || "-" },
      { key: "userStatus", label: "Status", render: (row) => <StatusBadge value={row.userStatus || "Existing User"} /> },
      { key: "userType", label: "Plan", render: (row) => <StatusBadge value={row.userType || "-"} /> },
      { key: "totalSessions", label: "Sessions", sortable: true },
      { key: "totalTimeSpent", label: "Total Time", sortable: true, render: (row) => formatSeconds(row.totalTimeSpent) },
      { key: "lastLogin", label: "Last Login", render: (row) => formatDateTime(row.lastLogin) },
      { key: "lastActive", label: "Last Active", sortable: true, render: (row) => formatDateTime(row.lastActive) },
      { key: "averageSessionDuration", label: "Avg Time", sortable: true, render: (row) => formatSeconds(row.averageSessionDuration) },
    ],
  },
  devices: {
    service: appUsageService.devices,
    defaultSortBy: "lastActive",
    columns: [
      { key: "deviceModel", label: "Device", sortable: true, fixed: true, render: (row) => row.deviceModel || "Unknown" },
      { key: "deviceBrand", label: "Brand", sortable: true, render: (row) => row.deviceBrand || "-" },
      { key: "platform", label: "Platform", sortable: true, render: (row) => row.platform || "-" },
      { key: "appVersion", label: "App Version", sortable: true, render: (row) => row.appVersion || "-" },
      { key: "osVersion", label: "OS", render: (row) => row.osVersion || "-" },
      { key: "androidVersion", label: "Android", render: (row) => row.androidVersion || "-" },
      { key: "networkType", label: "Network", render: (row) => row.networkType || "-" },
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
      { key: "deviceBrand", label: "Brand", render: (row) => row.deviceBrand || "-" },
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
      { key: "deviceBrand", label: "Brand", render: (row) => row.deviceBrand || "-" },
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

function dateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function activityRangeFromDays(days) {
  const numericDays = Number(days || 7);
  if (numericDays === 1) return { range: "today", from: "", to: "" };
  if (numericDays === 7) return { range: "last7", from: "", to: "" };
  if (numericDays === 30) return { range: "last30", from: "", to: "" };
  const to = new Date();
  const from = new Date(Date.now() - numericDays * 24 * 60 * 60 * 1000);
  return { range: "custom", from: dateInputValue(from), to: dateInputValue(to) };
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
  const [filters, setFilters] = useState({ days: 7, from: "", to: "", platform: "all", plan: "all", eventType: "all", screen: "", appVersion: "", androidVersion: "", deviceBrand: "", deviceModel: "", networkType: "", sessionStatus: "all" });
  const [tableSearch, setTableSearch] = useState("");
  const debouncedSearch = useDebouncedValue(tableSearch);
  const [tableState, setTableState] = useState(() => Object.fromEntries(Object.keys(tableConfigs).map((key) => [key, { rows: [], meta: null, page: 1, limit: 25, sortBy: tableConfigs[key].defaultSortBy, sortOrder: "desc" }])));
  const [activityUser, setActivityUser] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [activityFilters, setActivityFilters] = useState({ range: "last7", from: "", to: "", platform: "all", appVersion: "", loginProvider: "all", deviceModel: "", sessionStatus: "all", search: "", page: 1, limit: 10 });
  const debouncedActivitySearch = useDebouncedValue(activityFilters.search);

  const query = useMemo(() => ({ ...filters }), [filters]);
  const summary = analytics.summary || {};
  const retentionRate = summary.activeUsers ? Math.round((Number(summary.todaysActiveUsers || 0) / Number(summary.activeUsers || 1)) * 100) : 0;
  const kpis = [
    { label: "Total Active Users", value: summary.activeUsers ?? 0, icon: Users },
    { label: "Online Users", value: summary.onlineUsers ?? summary.todaysActiveUsers ?? 0, icon: Activity },
    { label: "Daily Active Users", value: summary.todaysActiveUsers ?? 0, icon: Activity },
    { label: "Monthly Active Users", value: summary.monthlyActiveUsers ?? summary.activeUsers ?? 0, icon: Activity },
    { label: "New Users", value: summary.newUsers ?? 0, icon: Users },
    { label: "Returning Users", value: summary.returningUsers ?? 0, icon: Users },
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
  }, [query.days, query.from, query.to, query.platform, query.plan, query.eventType, query.screen, query.appVersion, query.androidVersion, query.deviceBrand, query.deviceModel, query.networkType, query.sessionStatus]);

  useEffect(() => {
    if (!tableConfigs[activeTab]) return;
    void loadTable(activeTab, { page: 1 });
  }, [activeTab, query.days, query.from, query.to, query.platform, query.plan, query.eventType, query.screen, query.appVersion, query.androidVersion, query.deviceBrand, query.deviceModel, query.networkType, query.sessionStatus, debouncedSearch]);

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
    const userId = row?.email || row?._id || row?.userId || row?.id;
    if (!userId) return;
    setActivityUser({ id: userId, userName: row.userName || "", email: row.email || "", loginMethod: row.loginMethod || "", userStatus: row.userStatus || "" });
    setActivityFilters((current) => ({
      ...current,
      ...activityRangeFromDays(filters.days),
      platform: filters.platform,
      page: 1,
    }));
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
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">App Usage Analytics</h1>
              <p className="text-xs text-slate-500">Monitor app performance and user activity</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {summary.activeUsers ?? 0} active
            </span>
            <button type="button" className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={() => { void loadOverview(); if (tableConfigs[activeTab]) void loadTable(activeTab); }}>
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Period:</span>
            <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.days} onChange={(event) => updateFilters({ days: Number(event.target.value), from: "", to: "" })}>
              {dateRangeOptions.map((days) => <option key={days} value={days}>Last {days}d</option>)}
            </select>
            <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Platform:</span>
            <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.platform} onChange={(event) => updateFilters({ platform: event.target.value })}>
              <option value="all">All</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
            <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Plan:</span>
            <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.plan} onChange={(event) => updateFilters({ plan: event.target.value })}>
              <option value="all">All</option>
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => {
              const details = document.querySelector('details');
              if (details) details.open = !details.open;
            }}>
              <Filter size={9} /> More
            </button>
          </div>

          {/* More Filters - Collapsible */}
          <details className="border-t border-slate-100 pt-2">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">From</label>
                <input className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="datetime-local" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">To</label>
                <input className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="datetime-local" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Event</label>
                <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.eventType} onChange={(event) => updateFilters({ eventType: event.target.value })}>
                  <option value="all">All</option>
                  <option value="Login">Login</option>
                  <option value="ScreenView">Screen views</option>
                  <option value="Click">Clicks</option>
                  <option value="Navigation">Navigation</option>
                  <option value="API Failure">API failures</option>
                  <option value="Network Failure">Network failures</option>
                  <option value="JS Error">JS errors</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Screen</label>
                <input className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.screen} placeholder="Contains..." onChange={(event) => updateFilters({ screen: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">App Version</label>
                <input className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.appVersion} placeholder="Version" onChange={(event) => updateFilters({ appVersion: event.target.value })} />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[6px] font-medium text-slate-400 uppercase tracking-wider">Device</label>
                <input className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.deviceModel} placeholder="Model" onChange={(event) => updateFilters({ deviceModel: event.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
              <ToggleSwitch checked={Boolean(settings.enabled)} onChange={(enabled) => void saveSettings({ ...settings, enabled })} label="" size="sm" />
              <span className="text-[8px] font-medium text-slate-600">{settings.enabled ? "Tracking enabled" : "Tracking disabled"}</span>
            </div>
          </details>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.slice(0, 6).map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200/60 px-2.5 py-2 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
              <Icon size={10} className="text-slate-400" />
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav className="bg-white rounded-lg border border-slate-200/60 p-1 shadow-sm flex flex-wrap gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-medium rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={10} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Content Sections */}
      {activeTab === "overview" && <OverviewTab analytics={analytics} />}
      {activeTab === "performance" && <PerformanceTab analytics={analytics} />}
      {activeTab === "logs" && <LogsTab settings={settings} query={query} saveSettings={saveSettings} deleteLogs={deleteLogs} />}
      {tableConfigs[activeTab] && (
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
      )}
      
      <UserActivityDrawer
        open={Boolean(activityUser)}
        user={activityUser}
        loading={activityLoading}
        data={activityData}
        filters={activityFilters}
        onFilterChange={updateActivityFilters}
        onClose={() => { setActivityUser(null); setActivityData(null); }}
      />
    </div>
  );
}

function OverviewTab({ analytics }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Daily Active Users</h3>
        <div className="space-y-1.5">
          {(analytics.dailyActive || []).slice(0, 10).map((row) => (
            <div key={row.date} className="flex items-center gap-2">
              <span className="text-[8px] text-slate-600 w-20 truncate">{row.date}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (row.users || 0) / Math.max(1, (analytics.dailyActive || [])[0]?.users || 1) * 100)}%` }} />
              </div>
              <span className="text-[8px] font-medium text-slate-700 w-8 text-right">{row.users || 0}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Platform Distribution</h3>
        <div className="space-y-1.5">
          {(analytics.platform || []).slice(0, 5).map((row) => (
            <div key={row.platform} className="flex items-center gap-2">
              <span className="text-[8px] text-slate-600 w-16 truncate">{row.platform || "Unknown"}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (row.events || 0) / Math.max(1, (analytics.platform || [])[0]?.events || 1) * 100)}%` }} />
              </div>
              <span className="text-[8px] font-medium text-slate-700 w-8 text-right">{row.events || 0}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Most Used Screens</h3>
        <div className="space-y-1.5">
          {(analytics.pages || []).slice(0, 8).map((row, index) => (
            <div key={index} className="flex items-center justify-between text-[8px]">
              <span className="text-slate-600 truncate max-w-[120px]">{row.path || "-"}</span>
              <span className="font-medium text-slate-700">{row.visits || 0} visits</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Most Clicked Components</h3>
        <div className="space-y-1.5">
          {(analytics.clicks || []).slice(0, 8).map((row, index) => (
            <div key={index} className="flex items-center justify-between text-[8px]">
              <span className="text-slate-600 truncate max-w-[120px]">{row.componentName || "Unknown"}</span>
              <span className="font-medium text-slate-700">{row.count || 0} clicks</span>
            </div>
          ))}
        </div>
      </div>
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
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Performance Snapshot</h3>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {rows.map((row) => (
          <div key={row[0]} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
            <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{row[0]}</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">{row[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab({ settings, query, saveSettings, deleteLogs }) {
  const retentionValue = settings.retentionNeverDelete ? "never" : Number(settings.retentionDays || 90);
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">Retention & Data Deletion</h3>
          <p className="text-[8px] text-slate-500">Current filter: last {query.days} days</p>
        </div>
        <button className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 text-[8px] font-medium rounded-lg transition-all", "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200")} type="button" onClick={deleteLogs}>
          <Trash2 size={10} /> Delete Filtered Logs
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200/50 px-3 py-1">
          <ToggleSwitch checked={Boolean(settings.automaticCleanupEnabled) && !settings.retentionNeverDelete} disabled={settings.retentionNeverDelete} onChange={(automaticCleanupEnabled) => void saveSettings({ ...settings, automaticCleanupEnabled })} label="" size="sm" />
          <span className="text-[8px] font-medium text-slate-700">Auto cleanup</span>
        </div>
        <select className="px-2 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={retentionValue} onChange={(event) => {
          const value = event.target.value;
          void saveSettings({ ...settings, retentionNeverDelete: value === "never", automaticCleanupEnabled: value === "never" ? false : settings.automaticCleanupEnabled, retentionDays: value === "never" ? 365 : Number(value) });
        }}>
          {retentionOptions.map((option) => <option key={option} value={option}>{option === "never" ? "Never Delete" : `${option} ${option === 1 ? "Day" : "Days"}`}</option>)}
        </select>
        <input className="px-2 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" min="5" max="240" value={settings.sessionTimeoutMinutes || 30} onChange={(event) => void saveSettings({ ...settings, sessionTimeoutMinutes: Number(event.target.value) })} placeholder="Timeout min" />
      </div>
    </div>
  );
}

function ServerTable({ config, loading, search, setSearch, state, onChange, exportQuery, tabKey, onRowClick }) {
  const sortLabel = state.sortOrder === "asc" ? "ASC" : "DESC";
  const [exporting, setExporting] = useState(false);
  
  async function exportComplete() {
    setExporting(true);
    try {
      await appUsageService.exportFile({ ...exportQuery, search, dataset: tabKey === "sessions" ? "sessions" : tabKey === "userAnalytics" || tabKey === "users" ? "user-analytics" : "events", format: "xlsx" });
    } finally {
      setExporting(false);
    }
  }
  
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-7 pr-2 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={state.limit} onChange={(event) => onChange({ page: 1, limit: Number(event.target.value) })}>
            {pageSizeOptions.map((limit) => <option key={limit} value={limit}>{limit} rows</option>)}
          </select>
          <button type="button" disabled={exporting} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors disabled:opacity-50" onClick={() => void exportComplete()}>
            <Download size={10} /> {exporting ? "..." : "Export"}
          </button>
        </div>
      </div>
      
      <div className="mt-2 overflow-x-auto">
        <table className="w-full divide-y divide-slate-100 text-[9px]">
          <thead className="bg-slate-50/50">
            <tr>
              {config.columns.map((column) => (
                <th key={column.key} className={cn("px-2 py-1 text-left font-medium text-slate-500", column.fixed && "sticky left-0 bg-slate-50 z-10 min-w-[120px]")}>
                  <button type="button" disabled={!column.sortable} className="flex items-center gap-1 disabled:cursor-default hover:text-slate-700" onClick={() => onChange({ page: 1, sortBy: column.key, sortOrder: state.sortBy === column.key && state.sortOrder === "desc" ? "asc" : "desc" })}>
                    {column.label}
                    {state.sortBy === column.key && <span className="text-[8px] text-indigo-600">{sortLabel}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={config.columns.length} className="px-2 py-2">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : state.rows.map((row, index) => (
              <tr key={row.id || row._id || row.sessionId || `${index}`} className={cn("hover:bg-slate-50/50 transition-colors", onRowClick && "cursor-pointer hover:bg-indigo-50/50")} onClick={() => onRowClick?.(row)}>
                {config.columns.map((column) => (
                  <td key={column.key} className={cn("px-2 py-1.5 text-slate-700", column.fixed && "sticky left-0 bg-white font-medium")}>
                    {column.render ? column.render(row) : row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && !state.rows.length && (
              <tr>
                <td colSpan={config.columns.length} className="px-2 py-4 text-center text-[9px] text-slate-400">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={state.meta} onChange={(page) => onChange({ page })} />
    </div>
  );
}

function StatusBadge({ value }) {
  const isPremium = String(value).toLowerCase().includes("premium");
  return (
    <span className={cn(
      "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
      isPremium ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-slate-100 text-slate-600"
    )}>
      {value || "-"}
    </span>
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
    ["Total Time", formatSeconds(summary.totalTimeSpent)],
    ["Avg Session", formatSeconds(summary.averageSessionDuration)],
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
      <button type="button" className="hidden flex-1 lg:block" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl lg:max-w-4xl">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-wider text-indigo-600">User Activity</div>
              <h3 className="text-sm font-semibold text-slate-900 truncate">{displayUser.name || displayUser.userName || user?.userName || "Selected User"}</h3>
              <p className="text-[9px] text-slate-500 truncate">{displayUser.email || user?.email || displayUser.id}</p>
            </div>
            <button type="button" className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
            <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.range} onChange={(event) => onFilterChange({ range: event.target.value })}>
              {activityRanges.map((range) => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
            <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.platform} onChange={(event) => onFilterChange({ platform: event.target.value })}>
              <option value="all">All platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
            <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.loginProvider} onChange={(event) => onFilterChange({ loginProvider: event.target.value })}>
              <option value="all">All providers</option>
              {providerOptions.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
            </select>
            <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.sessionStatus} onChange={(event) => onFilterChange({ sessionStatus: event.target.value })}>
              <option value="all">All statuses</option>
              {sessionStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          {filters.range === "custom" && (
            <div className="mt-1 grid grid-cols-2 gap-1">
              <input className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="date" value={filters.from} onChange={(event) => onFilterChange({ from: event.target.value })} />
              <input className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="date" value={filters.to} onChange={(event) => onFilterChange({ to: event.target.value })} />
            </div>
          )}
          <div className="mt-1 flex gap-1">
            <input className="flex-1 px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.appVersion} placeholder="App version" onChange={(event) => onFilterChange({ appVersion: event.target.value })} />
            <input className="flex-1 px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.deviceModel} placeholder="Device" onChange={(event) => onFilterChange({ deviceModel: event.target.value })} />
            <div className="relative flex-1">
              <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full pl-5 pr-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.search} placeholder="Search..." onChange={(event) => onFilterChange({ search: event.target.value })} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {metricCards.slice(0, 8).map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-lg border border-slate-200/50 p-1.5">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                <div className="text-[9px] font-bold text-slate-900 mt-0.5 truncate">{value}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : sessionsByDay.length > 0 ? (
            <div className="mt-3 space-y-3">
              {sessionsByDay.map((day) => (
                <div key={day.date}>
                  <h4 className="text-[9px] font-semibold text-slate-700 mb-1">{day.date}</h4>
                  {day.sessions.map((session) => (
                    <details key={session.sessionId} className="mb-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                      <summary className="flex cursor-pointer items-center justify-between gap-2 text-[9px]">
                        <span className="font-medium text-slate-900">{formatDateTime(session.startedAt)}</span>
                        <span className="flex items-center gap-2 text-slate-600">
                          {formatSeconds(session.durationSeconds)}
                          <ChevronDown size={12} />
                        </span>
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
                        <InfoItem label="Platform" value={session.platform || "-"} />
                        <InfoItem label="App Version" value={session.appVersion || "-"} />
                        <InfoItem label="Device" value={session.deviceModel || "-"} />
                        <InfoItem label="Status" value={session.status || "-"} />
                      </div>
                      <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-indigo-700">Navigation Flow</p>
                        {session.navigationFlow?.length ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {session.navigationFlow.map((screen, index) => (
                              <Fragment key={`${session.sessionId}-flow-${screen}-${index}`}>
                                {index > 0 ? <ChevronRight size={10} className="shrink-0 text-indigo-400" /> : null}
                                <span className="rounded border border-indigo-200 bg-white px-1.5 py-0.5 text-[8px] font-medium text-indigo-800">{screen}</span>
                              </Fragment>
                            ))}
                          </div>
                        ) : <p className="mt-1 text-[8px] text-slate-400">No navigation flow recorded</p>}
                      </div>

                      <div className="mt-2">
                        <p className="text-[7px] font-bold uppercase tracking-wider text-slate-600">Screen & Action Logs</p>
                        {session.screens?.length ? (
                          <div className="mt-1 space-y-1.5">
                            {session.screens.map((screen, screenIndex) => (
                              <div key={`${session.sessionId}-screen-${screenIndex}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <span className="text-[8px] font-semibold text-slate-900">{screen.screenName || "Unknown screen"}</span>
                                  <span className="text-[7px] text-slate-500">{formatSeconds(screen.durationSeconds)} · {formatDateTime(screen.entryTime)} → {formatDateTime(screen.exitTime)}</span>
                                </div>
                                {screen.actions?.length ? (
                                  <div className="mt-1 space-y-1 border-l border-slate-300 pl-2">
                                    {screen.actions.map((action, actionIndex) => (
                                      <div key={`${session.sessionId}-action-${screenIndex}-${actionIndex}`} className="flex flex-wrap items-center justify-between gap-1 text-[8px]">
                                        <span className="text-slate-700"><strong>{action.eventType || "Event"}</strong>{action.action ? ` · ${action.action}` : ""}{action.componentName ? ` · ${action.componentName}` : ""}{action.componentType ? ` (${action.componentType})` : ""}</span>
                                        <span className="text-[7px] text-slate-400">{formatDateTime(action.timestamp)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : <p className="mt-1 text-[8px] text-slate-400">No actions recorded on this screen</p>}
                              </div>
                            ))}
                          </div>
                        ) : session.events?.length ? (
                          <div className="mt-1 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                            {session.events.map((event, eventIndex) => (
                              <div key={event.id || `${session.sessionId}-event-${eventIndex}`} className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 pb-1 text-[8px] last:border-0 last:pb-0">
                                <span className="text-slate-700"><strong>{event.eventType || "Event"}</strong>{event.screen ? ` · ${event.screen}` : ""}{event.action ? ` · ${event.action}` : ""}{event.componentName ? ` · ${event.componentName}` : ""}</span>
                                <span className="text-[7px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="mt-1 text-[8px] text-slate-400">No screen or action logs recorded</p>}
                      </div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-center text-[9px] text-slate-400">No activity found</div>
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <select className="px-1.5 py-0.5 text-[8px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={filters.limit} onChange={(event) => onFilterChange({ limit: Number(event.target.value) })}>
              {pageSizeOptions.map((limit) => <option key={limit} value={limit}>{limit} sessions</option>)}
            </select>
            <Pagination meta={meta} onChange={(page) => onFilterChange({ page })} />
          </div>
        </footer>
      </aside>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-[8px] text-slate-900 truncate">{value || "-"}</div>
    </div>
  );
}
