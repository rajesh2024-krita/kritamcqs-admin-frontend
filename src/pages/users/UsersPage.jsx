import { useEffect, useMemo, useRef, useState } from "react";
import { userService } from "../../api/userService";
import { modeService } from "../../api/modeService";
import { learningLevelService } from "../../api/learningLevelService";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { MathText } from "../../components/common/MathText";
import { EntityFormWrapper } from "../../components/forms/EntityFormWrapper";
import { Field } from "../../components/forms/Field";
import { SelectDropdown } from "../../components/forms/SelectDropdown";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { DataTable } from "../../components/tables/DataTable";
import { Pagination } from "../../components/tables/Pagination";
import { SearchBar } from "../../components/tables/SearchBar";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import { formatDate } from "../../utils/format";
import { DownloadIcon, EditIcon, EyeIcon, PlusIcon, RefreshIcon, TrashIcon, XIcon } from "../../components/common/AdminIcons";
import {
  Users,
  User,
  Mail,
  Phone,
  Crown,
  Shield,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  FileSpreadsheet,
  Database,
  Zap
} from "lucide-react";

const defaultForm = {
  mobile: "",
  email: "",
  name: "",
  password: "",
  address: "",
  country: "",
  state: "",
  district: "",
  city: "",
  userType: "student",
  profileImage: "",
  examMode: "",
  level: "",
  premiumExpiresAt: "",
  onboardingComplete: false,
  isPremium: false,
  isAdmin: false,
  isActive: true,
  isBlocked: false,
};

const loginProviderOptions = [
  { value: "", label: "All Providers" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "GOOGLE", label: "Google" },
  { value: "APPLE", label: "Apple" },
  { value: "GUEST", label: "Guest" },
  { value: "FACEBOOK", label: "Facebook" },
];

const loginProviderLabels = {
  EMAIL: "Email",
  PHONE: "Phone",
  GOOGLE: "Google",
  APPLE: "Apple",
  GUEST: "Guest",
  FACEBOOK: "Facebook",
};

const examAudienceOptions = [
  { value: "", label: "All Exams" },
  { value: "NEET", label: "NEET" },
  { value: "JEE", label: "JEE" },
];

const subscriptionStatusOptions = [
  { value: "", label: "All Users" },
  { value: "false", label: "Free Users" },
  { value: "true", label: "Premium Users" },
];

const exportOptions = [
  { value: "filtered", label: "Export Filtered Users" },
  { value: "all", label: "Export All Users" },
  { value: "selected", label: "Export Selected Users" },
  { value: "mobile", label: "Export Users with Mobile" },
  { value: "google", label: "Export Google Login Users" },
  { value: "email", label: "Export Email Users" },
  { value: "apple", label: "Export Apple Login Users" },
  { value: "neet", label: "Export NEET Users" },
  { value: "jee", label: "Export JEE Users" },
  { value: "date_range", label: "Export by Date Range" },
];

function resolveLoginProvider(user) {
  const explicit = String(user?.loginProvider || "").toUpperCase();
  if (explicit && explicit !== "EMAIL") return explicit;
  if (user?.isAppleLogin || user?.appleUserId || (Array.isArray(user?.authTypes) && user.authTypes.includes("apple"))) return "APPLE";
  if (user?.googleId || (Array.isArray(user?.authTypes) && user.authTypes.includes("google"))) return "GOOGLE";
  if (Array.isArray(user?.authTypes) && user.authTypes.includes("facebook")) return "FACEBOOK";
  if (Array.isArray(user?.authTypes) && user.authTypes.includes("guest")) return "GUEST";
  if (user?.mobile && !user?.email) return "PHONE";
  return "EMAIL";
}

function toDateTimeLocal(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function getWeakAreaExamType(item) {
  const normalized = String(item?.examType ?? item?.examMode ?? "").trim().toUpperCase();
  if (normalized.startsWith("JEE")) return "JEE";
  return "NEET";
}

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [loginProviderFilter, setLoginProviderFilter] = useState("");
  const [examAudienceFilter, setExamAudienceFilter] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("");
  const [mobileAvailableFilter, setMobileAvailableFilter] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportType, setExportType] = useState("filtered");
  const [exporting, setExporting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [deleteUser, setDeleteUser] = useState(null);
  const [truncateUser, setTruncateUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [migrationFile, setMigrationFile] = useState(null);
  const [migrationPreview, setMigrationPreview] = useState(null);
  const [migrationPreviewReady, setMigrationPreviewReady] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkSettings, setBulkSettings] = useState({ onboardingComplete: false, isPremium: false, isActive: true });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [migrationLogs, setMigrationLogs] = useState([]);
  const [modes, setModes] = useState([]);
  const [learningLevels, setLearningLevels] = useState([]);
  const liveRefreshPending = useRef(false);
  const normalizeOptionValue = (item) => String(item?.key ?? item?.id ?? item?._id ?? "").trim();
  const normalizeOptionLabel = (item) => String(item?.label ?? item?.name ?? "").trim();
  const modeOptions = modes
    .map((mode) => ({ label: normalizeOptionLabel(mode), value: normalizeOptionValue(mode) }))
    .filter((option) => option.value && option.label);
  const learningLevelOptions = learningLevels
    .map((level) => ({ label: normalizeOptionLabel(level), value: normalizeOptionValue(level) }))
    .filter((option) => option.value && option.label);
  const modeLabelMap = useMemo(() => {
    const map = new Map();
    modes.forEach((mode) => {
      const label = normalizeOptionLabel(mode);
      if (!label) return;
      [mode?.key, mode?.id, mode?._id].forEach((value) => {
        if (value) map.set(String(value), label);
      });
    });
    return map;
  }, [modes]);
  const levelLabelMap = useMemo(() => {
    const map = new Map();
    learningLevels.forEach((level) => {
      const label = normalizeOptionLabel(level);
      if (!label) return;
      [level?.key, level?.id, level?._id].forEach((value) => {
        if (value) map.set(String(value), label);
      });
    });
    return map;
  }, [learningLevels]);
  const resolveModeValue = (value) => {
    if (!value) return "";
    const raw = String(value);
    const match = modes.find((mode) => String(mode?.key || "") === raw || String(mode?.id || "") === raw || String(mode?._id || "") === raw);
    return normalizeOptionValue(match) || raw;
  };
  const resolveLevelValue = (value) => {
    if (!value) return "";
    const raw = String(value);
    const match = learningLevels.find((level) => String(level?.key || "") === raw || String(level?.id || "") === raw || String(level?._id || "") === raw);
    return normalizeOptionValue(match) || raw;
  };
  const revisionTotalCount = overview?.revisionSummary?.totalCount ?? overview?.revisionSummary?.revisionPendingCount ?? 0;
  const revisionWrongCount = overview?.revisionSummary?.wrongQuestionCount ?? 0;
  const revisionOldCorrectCount = overview?.revisionSummary?.oldCorrectQuestionCount ?? 0;
  const hasProcessingMigration = migrationLogs.some((log) => log.status === "processing");

  const summaryCards = useMemo(() => {
    if (!overview) return [];
    return [
      ["Attendance", overview.performance.attendanceCount],
      ["Reports", overview.performance.reportCount],
      ["Submissions", overview.performance.submissionCount],
      ["Mistakes", overview.mistakeSummary.total],
      ["Revision Due", revisionTotalCount],
      ["Weak Areas", overview.weakAreas.length],
      ["Avg Accuracy", `${overview.performance.averageAccuracy || 0}%`],
    ];
  }, [overview, revisionTotalCount]);

  function userListParams(
    nextQuery = query,
    nextSearch = search,
    nextProvider = loginProviderFilter,
    nextExamAudience = examAudienceFilter,
    nextSubscriptionStatus = subscriptionStatusFilter,
    nextMobileAvailable = mobileAvailableFilter,
    nextFromDate = fromDate,
    nextToDate = toDate,
  ) {
    const provider = String(nextProvider || "").trim();
    const params = {
      ...nextQuery,
      search: nextSearch,
      loginProvider: provider || undefined,
      provider: provider || undefined,
    };
    if (nextExamAudience) params.examAudience = nextExamAudience;
    if (nextSubscriptionStatus !== "") params.isPremium = nextSubscriptionStatus;
    if (nextMobileAvailable) params.mobileAvailable = true;
    if (nextFromDate) params.fromDate = nextFromDate;
    if (nextToDate) params.toDate = nextToDate;
    return params;
  }

  async function loadUsers(
    nextQuery = query,
    nextSearch = search,
    nextProvider = loginProviderFilter,
    nextExamAudience = examAudienceFilter,
    nextSubscriptionStatus = subscriptionStatusFilter,
    nextMobileAvailable = mobileAvailableFilter,
    nextFromDate = fromDate,
    nextToDate = toDate,
  ) {
    setLoading(true);
    try {
      const response = await userService.list(userListParams(nextQuery, nextSearch, nextProvider, nextExamAudience, nextSubscriptionStatus, nextMobileAvailable, nextFromDate, nextToDate));
      setUsers(response.data || []);
      setMeta(response.meta);
      setSelectedIds([]);
      if (!selectedUser && response.data?.length) {
        setSelectedUser(response.data[0]);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectUser(user) {
    setSelectedUser(user);
    setDetailsOpen(true);
    setOverviewLoading(true);
    try {
      const response = await userService.getOverview(user.id);
      setOverview(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(query);
    loadCatalogOptions();
    loadMigrationLogs();
  }, [query.page]);

  useEffect(() => {
    if (!hasProcessingMigration) return undefined;
    const interval = window.setInterval(async () => {
      await loadMigrationLogs();
      await loadUsers({ ...query, page: 1 });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [hasProcessingMigration, query.limit, query.page, search, loginProviderFilter, examAudienceFilter, subscriptionStatusFilter, mobileAvailableFilter, fromDate, toDate]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadUsers({ ...current, page: 1 });
        return current;
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search, loginProviderFilter, examAudienceFilter, subscriptionStatusFilter, mobileAvailableFilter, fromDate, toDate]);

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible" || liveRefreshPending.current) return;
      liveRefreshPending.current = true;
      try {
        const response = await userService.list(userListParams());
        setUsers(response.data || []);
        setMeta(response.meta);
      } catch {
        // Keep the current table during a transient background refresh failure.
      } finally {
        liveRefreshPending.current = false;
      }
    };
    const interval = window.setInterval(refresh, 5000);
    const handleVisibilityOrFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [query, search, loginProviderFilter, examAudienceFilter, subscriptionStatusFilter, mobileAvailableFilter, fromDate, toDate]);

  function openCreate() {
    setEditingUser(null);
    setFormState(defaultForm);
    setShowForm(true);
  }

  async function loadMigrationLogs() {
    try {
      const response = await userService.listMigrationLogs();
      setMigrationLogs(response.data || []);
    } catch {
      setMigrationLogs([]);
    }
  }

  async function loadCatalogOptions() {
    try {
      const [modesResponse, levelsResponse] = await Promise.all([
        modeService.list({ limit: 100, sortBy: "label", sortOrder: "asc" }),
        learningLevelService.list({ limit: 100, active: true, sortBy: "sortOrder", sortOrder: "asc" }),
      ]);
      setModes(modesResponse.data || []);
      setLearningLevels(levelsResponse.data || []);
    } catch {
      setModes([]);
      setLearningLevels([]);
    }
  }

  async function handlePreviewMigration() {
    if (!migrationFile) {
      toast.error("Select a .sql, .csv, or .xlsx file first");
      return;
    }
    setMigrationLoading(true);
    try {
      const response = await userService.previewMigration(migrationFile);
      setMigrationPreview(response.data);
      setMigrationPreviewReady(true);
      toast.success("Migration preview ready");
    } catch (error) {
      setMigrationPreviewReady(false);
      toast.error(error.message);
    } finally {
      setMigrationLoading(false);
    }
  }

  async function handleImportMigration() {
    if (!migrationFile) {
      toast.error("Select a migration file first");
      return;
    }
    setMigrationLoading(true);
    try {
      const response = await userService.importMigration(migrationFile);
      setMigrationPreview(response.data);
      setMigrationPreviewReady(false);
      if (response.data?.status === "processing") {
        toast.success("User import started. This page will refresh the migration log.");
      } else {
        toast.success(`Imported ${response.data?.importedUsers ?? 0} users`);
      }
      await Promise.all([loadUsers({ ...query, page: 1 }), loadMigrationLogs()]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMigrationLoading(false);
    }
  }

  function openEdit(user) {
    setEditingUser(user);
    setFormState({
      mobile: user.mobile || "",
      email: user.email || "",
      name: user.name || "",
      password: "",
      address: user.address || "",
      country: user.country || "",
      state: user.state || "",
      district: user.district || "",
      city: user.city || "",
      userType: user.userType || "student",
      profileImage: user.profileImage || "",
      examMode: resolveModeValue(user.examMode),
      level: resolveLevelValue(user.level),
      premiumExpiresAt: toDateTimeLocal(user.premiumExpiresAt),
      onboardingComplete: Boolean(user.onboardingComplete),
      isPremium: Boolean(user.isPremium),
      isAdmin: Boolean(user.isAdmin),
      isActive: user.isActive !== false,
      isBlocked: Boolean(user.isBlocked),
    });
    setShowForm(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    try {
      if (!editingUser) {
        const requiredFields = ["name", "email", "mobile", "password", "country", "state", "district", "examMode", "level"];
        const missing = requiredFields.filter((field) => !String(formState[field] || "").trim());
        if (missing.length) {
          toast.error(`Complete required profile fields: ${missing.join(", ")}`);
          return;
        }
      }
      const payload = {
        ...formState,
        premiumExpiresAt: formState.premiumExpiresAt ? new Date(formState.premiumExpiresAt).toISOString() : "",
      };
      if (editingUser) {
        if (!String(payload.password || "").trim()) delete payload.password;
        delete payload.isPremium;
        delete payload.premiumExpiresAt;
      }

      if (editingUser) {
        await userService.update(editingUser.id, payload);
        toast.success("User updated");
      } else {
        await userService.create(payload);
        toast.success("User created");
      }

      setShowForm(false);
      await loadUsers({ ...query, page: 1 });
      if (selectedUser) {
        const refreshed = await userService.getOverview(editingUser?.id || selectedUser.id);
        setOverview(refreshed.data);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete() {
    try {
      await userService.remove(deleteUser.id);
      toast.success("User deleted");
      setDeleteUser(null);
      setSelectedUser(null);
      setOverview(null);
      await loadUsers({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleTruncateUserData() {
    try {
      const response = await userService.truncateData(truncateUser.id);
      const result = response.data || response;
      toast.success(`User data reset (${Number(result.totalDeletedCount || 0)} records removed)`);
      const truncatedUserId = truncateUser.id;
      setTruncateUser(null);
      await loadUsers({ ...query, page: 1 });
      if (selectedUser?.id === truncatedUserId) {
        const refreshed = await userService.getOverview(truncatedUserId);
        setOverview(refreshed.data);
        setSelectedUser(refreshed.data?.profile || selectedUser);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) {
      setBulkDeleteOpen(false);
      return;
    }

    try {
      const response = await userService.removeMany(selectedIds);
      const result = response.data || response;
      const successCount = Number(result.deletedCount || 0);
      const failedCount = Number(result.failedCount || 0);

      if (successCount > 0) {
        toast.success(`${successCount} users deleted`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} users failed to delete`);
      }

      setBulkDeleteOpen(false);
      setSelectedIds([]);
      setSelectedUser(null);
      setOverview(null);
      await loadUsers({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  function toggleRowSelection(id, checked) {
    setSelectedIds((current) => {
      const has = current.includes(id);
      if (checked && !has) return [...current, id];
      if (!checked && has) return current.filter((item) => item !== id);
      return current;
    });
  }

  function toggleAllSelection(checked) {
    if (!checked) {
      const visibleIds = new Set(users.map((user) => String(user.id)));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...users.map((user) => String(user.id))])]);
  }

  function handleLimitChange(event) {
    const limit = Number(event.target.value);
    const nextQuery = { ...query, limit, page: 1 };
    setSelectedIds([]);
    setQuery(nextQuery);
    loadUsers(nextQuery);
  }

  function handleProviderChange(event) {
    const provider = event.target.value;
    const nextQuery = { ...query, page: 1 };
    setLoginProviderFilter(provider);
    setSelectedIds([]);
    setQuery(nextQuery);
    loadUsers(nextQuery, search, provider);
  }

  function applyFilters(overrides = {}) {
    const nextQuery = { ...query, page: 1 };
    setSelectedIds([]);
    setQuery(nextQuery);
    loadUsers(
      nextQuery,
      overrides.search ?? search,
      overrides.provider ?? loginProviderFilter,
      overrides.examAudience ?? examAudienceFilter,
      overrides.subscriptionStatus ?? subscriptionStatusFilter,
      overrides.mobileAvailable ?? mobileAvailableFilter,
      overrides.fromDate ?? fromDate,
      overrides.toDate ?? toDate,
    );
  }

  async function handleExportUsers() {
    if (exportType === "selected" && !selectedIds.length) {
      toast.error("Select at least one user to export");
      return;
    }
    if (exportType === "date_range" && !fromDate && !toDate) {
      toast.error("Select a from date or to date");
      return;
    }

    setExporting(true);
    try {
      const response = await userService.exportUsers({
        ...userListParams({ ...query, page: 1, limit: meta?.total || 500 }),
        exportType,
        selectedIds,
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `users-export-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Users export downloaded");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  }

  async function downloadUserTemplate(format) {
    try {
      const response = await userService.downloadBulkTemplate(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-profile-template.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || "Unable to download template");
    }
  }

  async function handleBulkUserUpload() {
    if (!bulkFile) {
      toast.error("Select a CSV or XLSX file");
      return;
    }
    setBulkUploading(true);
    try {
      const response = await userService.bulkImport(bulkFile, bulkSettings);
      setBulkResult(response.data);
      await loadUsers({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message || "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  }

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
              <Users size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">User Management</h1>
              <p className="text-xs text-slate-500">View and manage all learner accounts</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total ?? users.length} learners
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700" title="User data refreshes automatically every 5 seconds">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={openCreate}>
              <PlusIcon size={10} /> Create User
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2">
          {/* Search Bar */}
          <SearchBar value={search} onChange={setSearch} placeholder="Search users by name, mobile, or email..." />

          <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Filter Groups */}
            <div className="flex flex-wrap items-center gap-1">
              {/* Provider Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Provider:</span>
                <select className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer" value={loginProviderFilter} onChange={handleProviderChange}>
                  {loginProviderOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Exam Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Exam:</span>
                <select className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer" value={examAudienceFilter} onChange={(event) => {
                  const examAudience = event.target.value;
                  setExamAudienceFilter(examAudience);
                  applyFilters({ examAudience });
                }}>
                  {examAudienceOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Subscription Status Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
                <select className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer" value={subscriptionStatusFilter} onChange={(event) => {
                  const subscriptionStatus = event.target.value;
                  setSubscriptionStatusFilter(subscriptionStatus);
                  applyFilters({ subscriptionStatus });
                }}>
                  {subscriptionStatusOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Checkbox */}
              <label className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200/50 text-[8px] font-medium text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={mobileAvailableFilter} onChange={(event) => {
                  const mobileAvailable = event.target.checked;
                  setMobileAvailableFilter(mobileAvailable);
                  applyFilters({ mobileAvailable });
                }} />
                Mobile
              </label>

              {/* Date Range Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">From:</span>
                <input className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded w-20" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                <span className="text-[7px] text-slate-300">|</span>
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">To:</span>
                <input className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded w-20" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-1">
              {/* Bulk Delete */}
              {selectedIds.length > 0 && (
                <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[8px] font-medium rounded transition-colors" onClick={() => setBulkDeleteOpen(true)}>
                  <TrashIcon size={16} /> {selectedIds.length}
                </button>
              )}

              {/* Export Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Export:</span>
                <select className="px-1 py-0.5 text-[9px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer" value={exportType} onChange={(event) => setExportType(event.target.value)}>
                  {exportOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Rows Group */}
              <div className="flex items-center gap-0.5 bg-slate-50 rounded px-1.5 py-0.5 border border-slate-200/50">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Rows:</span>
                <select className="px-1 py-0.5 text-[8px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 rounded cursor-pointer" value={query.limit} onChange={handleLimitChange}>
                  {[10, 25, 50, 100, 200, 500].map((limit) => (
                    <option key={limit} value={limit}>{limit}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => {
                const nextQuery = { ...query, page: 1 };
                setQuery(nextQuery);
                loadUsers(nextQuery);
              }}>
                Search
              </button>
              <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[8px] font-medium rounded transition-colors" onClick={handleExportUsers} disabled={exporting}>
                <DownloadIcon size={9} /> {exporting ? "..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile-compatible bulk user upload */}
      <div className="rounded-lg border border-indigo-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Upload size={14} className="text-indigo-600" /><h3 className="text-xs font-semibold text-slate-900">Bulk User Upload</h3></div>
            <p className="mt-1 text-[9px] text-slate-500">Use the app-compatible profile template. Valid rows are inserted even when other rows fail.</p>
          </div>
          <div className="flex gap-1">
            <button type="button" className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700" onClick={() => void downloadUserTemplate("csv")}>CSV Template</button>
            <button type="button" className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700" onClick={() => void downloadUserTemplate("xlsx")}>XLSX Template</button>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_2fr_auto] lg:items-end">
          <label className={ui.field}><span>CSV/XLSX file</span><input className={compactInput} type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} /></label>
          <div className="flex flex-wrap gap-3 rounded border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-1.5"><ToggleSwitch checked={bulkSettings.isPremium} onChange={(isPremium) => setBulkSettings((current) => ({ ...current, isPremium }))} label="" size="sm" /><span className="text-[9px] text-slate-700">Premium</span></div>
            <div className="flex items-center gap-1.5"><ToggleSwitch checked={bulkSettings.isActive} onChange={(isActive) => setBulkSettings((current) => ({ ...current, isActive }))} label="" size="sm" /><span className="text-[9px] text-slate-700">Active</span></div>
            <div className="flex items-center gap-1.5"><ToggleSwitch checked={bulkSettings.onboardingComplete} onChange={(onboardingComplete) => setBulkSettings((current) => ({ ...current, onboardingComplete }))} label="" size="sm" /><span className="text-[9px] text-slate-700">Onboarding complete</span></div>
          </div>
          <button type="button" className="rounded bg-indigo-600 px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50" disabled={!bulkFile || bulkUploading} onClick={() => void handleBulkUserUpload()}>{bulkUploading ? "Processing..." : "Upload Users"}</button>
        </div>
      </div>

      {/* Legacy Migration Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-emerald-600" />
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Import MySQL Users</h3>
              <p className="text-[9px] text-slate-500">Upload exported users from MySQL</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <input className="px-2 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="file" accept=".sql,.csv,.xlsx,.xls" onChange={(event) => {
              setMigrationFile(event.target.files?.[0] || null);
              setMigrationPreview(null);
              setMigrationPreviewReady(false);
            }} />
            <button className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors disabled:opacity-50" disabled={migrationLoading} onClick={handlePreviewMigration}>
              {migrationLoading ? "..." : "Preview"}
            </button>
            <button className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-medium rounded transition-colors disabled:opacity-50" disabled={migrationLoading || !migrationPreviewReady || Number(migrationPreview?.importableUsers ?? 0) <= 0} onClick={handleImportMigration}>
              Start Import
            </button>
          </div>
        </div>

        {migrationPreview && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[
                ["Total", migrationPreview.totalUsers],
                ["Ready", migrationPreview.status === "processing" ? "Processing" : migrationPreview.importedUsers ?? migrationPreview.importableUsers],
                ["Duplicates", migrationPreview.duplicateUsers],
                ["Invalid", migrationPreview.invalidUsers],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded px-2 py-1">
                  <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                  <div className="text-xs font-bold text-slate-900">{value ?? 0}</div>
                </div>
              ))}
            </div>
            {migrationPreview.invalidRows?.length > 0 && (
              <div className="mt-2">
                <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Invalid Rows: {migrationPreview.invalidRows.length}</span>
              </div>
            )}
          </div>
        )}

        {migrationLogs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            {migrationLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="bg-slate-50 rounded px-2 py-1 text-[8px] text-slate-600">
                <strong className="text-slate-900">{formatDate(log.migrationDate)}</strong>
                {log.status === "processing" ? " Processing..." : ` ${log.importedUsers} imported | ${log.duplicateUsers} dup`}
                {log.status === "failed" && <span className="text-rose-600 ml-1">{log.errorMessage || "Failed"}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : null}
      {!loading && !users.length ? <EmptyState title="No users found" description="Try a different search or create a new user." /> : null}
      {!loading && users.length ? (
        <>
          <DataTable
            columns={[
              {
                key: "name",
                label: "User",
                render: (row) => (
                  <button className={cn(
                    "flex flex-col items-start gap-0.5 p-1.5 rounded-lg border transition-all text-left w-full",
                    selectedUser?.id === row.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )} onClick={() => handleSelectUser(row)}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                        {(row.name || row.mobile || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-900">{row.name || row.mobile}</span>
                    </div>
                    <span className="text-[8px] text-slate-500">{row.email || row.mobile}</span>
                  </button>
                ),
              },
              {
                key: "loginProvider",
                label: "Provider",
                render: (row) => {
                  const provider = resolveLoginProvider(row);
                  return <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-medium text-slate-600">{loginProviderLabels[provider] || provider}</span>;
                },
              },
              { key: "examMode", label: "Exam", render: (row) => <span className="text-[9px] text-slate-600">{modeLabelMap.get(String(row.examMode || "")) || "-"}</span> },
              { key: "level", label: "Level", render: (row) => <span className="text-[9px] text-slate-600">{levelLabelMap.get(String(row.level || "")) || "-"}</span> },
              {
                key: "flags",
                label: "Flags",
                render: (row) => (
                  <div className="flex flex-wrap gap-0.5">
                    {row.isPremium && <span className="inline-flex px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[7px] font-medium text-amber-700">Premium</span>}
                    {row.isAdmin && <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[7px] font-medium text-indigo-700">Admin</span>}
                    {row.onboardingComplete && <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[7px] font-medium text-emerald-700">Onboarded</span>}
                  </div>
                ),
              },
              { key: "createdAt", label: "Created", render: (row) => <span className="text-[8px] text-slate-500">{formatDate(row.createdAt)}</span> },
              { key: "lastLoginAt", label: "Last Login", render: (row) => <span className="text-[8px] text-slate-500">{row.lastLoginAt ? formatDate(row.lastLoginAt) : "-"}</span> },
            ]}
            rows={users}
            selectable
            selectedRowIds={selectedIds}
            onToggleRow={toggleRowSelection}
            onToggleAllRows={toggleAllSelection}
            renderActions={(row) => (
              <div className="flex items-center justify-end gap-0.5">
                <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => handleSelectUser(row)}>
                  <EyeIcon size={11} />
                </button>
                <button className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors" onClick={() => openEdit(row)}>
                  <EditIcon size={11} />
                </button>
                <button className="p-0.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" onClick={() => setTruncateUser(row)}>
                  <RefreshIcon size={11} />
                </button>
                <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => setDeleteUser(row)}>
                  <TrashIcon size={11} />
                </button>
              </div>
            )}
          />
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {/* User Details Modal */}
      {detailsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setDetailsOpen(false)}>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 max-h-[90vh] w-full max-w-6xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {(selectedUser.name || selectedUser.mobile || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{selectedUser.name || selectedUser.mobile}</h3>
                  <p className="text-[10px] text-slate-500">{selectedUser.email || selectedUser.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[8px] font-medium text-indigo-700">{modeLabelMap.get(String(selectedUser.examMode || "")) || "No mode"}</span>
                <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setDetailsOpen(false)}>
                  <XIcon size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4 max-h-[calc(90vh-64px)]">
              {overviewLoading ? <LoadingSpinner /> : null}

              {overview && (
                <div className="space-y-3">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                    {summaryCards.map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg border border-slate-200/50 px-2 py-1.5">
                        <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid gap-3 lg:grid-cols-2">
                    {/* Reports */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                      <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">Recent Reports</h4>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {overview.reports.slice(0, 8).map((report) => (
                          <div key={report.id} className="bg-white rounded border border-slate-200/50 p-1.5 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-medium text-slate-900">Attempt #{report.attemptNumber}</span>
                              <div className="text-[7px] text-slate-500">Score {report.score ?? 0} | Acc {report.accuracy ?? 0}%</div>
                            </div>
                            <span className="text-[7px] text-slate-400">{formatDate(report.completedAt || report.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                      <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">Subscriptions</h4>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {(overview.subscriptionSummary.history || []).slice(0, 8).map((item) => (
                          <div key={item.id} className="bg-white rounded border border-slate-200/50 p-1.5 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-medium text-slate-900">{item.planId}</span>
                              <div className="text-[7px] text-slate-500">{item.status} | ₹{item.amount ?? 0}</div>
                            </div>
                            <span className="text-[7px] text-slate-400">{formatDate(item.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mistakes & Revision */}
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                      <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">Mistakes & Revision</h4>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <div className="bg-rose-50 rounded border border-rose-200 p-1.5 text-center">
                          <span className="text-[6px] font-medium text-rose-600 uppercase tracking-wider">Recovery</span>
                          <div className="text-sm font-bold text-rose-700">{revisionWrongCount}</div>
                        </div>
                        <div className="bg-blue-50 rounded border border-blue-200 p-1.5 text-center">
                          <span className="text-[6px] font-medium text-blue-600 uppercase tracking-wider">Recall</span>
                          <div className="text-sm font-bold text-blue-700">{revisionOldCorrectCount}</div>
                        </div>
                        <div className="bg-emerald-50 rounded border border-emerald-200 p-1.5 text-center">
                          <span className="text-[6px] font-medium text-emerald-600 uppercase tracking-wider">Total</span>
                          <div className="text-sm font-bold text-emerald-700">{revisionTotalCount}</div>
                        </div>
                      </div>
                      <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {overview.mistakes.slice(0, 6).map((item) => (
                          <div key={item.id} className="bg-white rounded border border-slate-200/50 p-1.5">
                            <MathText className="text-[8px] text-slate-700 line-clamp-1">{item.question}</MathText>
                            <div className="text-[7px] text-slate-500">{item.subjectName} | {item.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weak Areas */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                      <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">Weak Areas</h4>
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {overview.weakAreas.slice(0, 10).map((item) => (
                          <div key={item.id} className="bg-white rounded border border-slate-200/50 p-1.5 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-medium text-slate-900">{item.chapterName}</span>
                              <div className="text-[7px] text-slate-500">{item.subjectName}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-medium text-slate-700">{item.accuracy ?? 0}%</span>
                              <div className="text-[6px] text-slate-400">{item.strength}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submissions */}
                  <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                    <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">Recent Submissions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[8px]">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-200">
                            <th className="text-left py-0.5 font-medium">Question</th>
                            <th className="text-left py-0.5 font-medium">Subject</th>
                            <th className="text-left py-0.5 font-medium">Result</th>
                            <th className="text-left py-0.5 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.submissions.slice(0, 10).map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-0.5 max-w-[200px]"><MathText className="line-clamp-1 text-[8px]">{item.question}</MathText></td>
                              <td className="py-0.5 text-slate-600">{item.subjectName}</td>
                              <td className="py-0.5">
                                <span className={cn(
                                  "px-1 py-0.5 rounded text-[6px] font-medium",
                                  item.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                )}>
                                  {item.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              </td>
                              <td className="py-0.5 text-slate-500">{item.timeSpent ?? 0}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {bulkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-user-result-title">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h2 id="bulk-user-result-title" className="text-base font-bold text-slate-900">Bulk Upload Result</h2><p className="text-xs text-slate-500">Every uploaded record has been processed.</p></div>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setBulkResult(null)} aria-label="Close result"><XIcon size={18} /></button>
            </div>
            <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-700">Total records</p><p className="mt-1 text-2xl font-black text-blue-900">{bulkResult.totalRecords || 0}</p></div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">Successfully inserted</p><p className="mt-1 text-2xl font-black text-emerald-900">{bulkResult.insertedUsers || 0}</p></div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs font-semibold text-rose-700">Failed users</p><p className="mt-1 text-2xl font-black text-rose-900">{bulkResult.failedUsers || 0}</p></div>
              </div>
              {bulkResult.failedRecords?.length ? (
                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Mobile</th><th className="px-3 py-2">Failure reason</th></tr></thead>
                    <tbody>{bulkResult.failedRecords.map((record, index) => <tr key={`${record.row}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2 font-bold">{record.row}</td><td className="px-3 py-2">{record.name || "-"}</td><td className="px-3 py-2">{record.email || "-"}</td><td className="px-3 py-2">{record.mobile || "-"}</td><td className="px-3 py-2 text-rose-700">{record.reason}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">All records were inserted successfully.</div>}
              <div className="mt-5 flex justify-end"><button type="button" className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white" onClick={() => setBulkResult(null)}>Done</button></div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <EntityFormWrapper
          title={editingUser ? "Edit User" : "Create User"}
          subtitle="Manage core learner profile and access flags."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSave}
          submitLabel={editingUser ? "Save Changes" : "Create User"}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label="Mobile"><input className={compactInput} value={formState.mobile} onChange={(event) => setFormState((current) => ({ ...current, mobile: event.target.value }))} /></Field>
            <Field label="Email"><input className={compactInput} type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label="Name"><input className={compactInput} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Password"><input className={compactInput} type="password" value={formState.password} onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))} /></Field>
            <Field label="Address"><textarea className={compactInput} value={formState.address} onChange={(event) => setFormState((current) => ({ ...current, address: event.target.value }))} /></Field>
            <Field label="Country"><input className={compactInput} value={formState.country} onChange={(event) => setFormState((current) => ({ ...current, country: event.target.value }))} /></Field>
            <Field label="State"><input className={compactInput} value={formState.state} onChange={(event) => setFormState((current) => ({ ...current, state: event.target.value }))} /></Field>
            <Field label="District"><input className={compactInput} value={formState.district} onChange={(event) => setFormState((current) => ({ ...current, district: event.target.value }))} /></Field>
            <Field label="City"><input className={compactInput} value={formState.city} onChange={(event) => setFormState((current) => ({ ...current, city: event.target.value }))} /></Field>
            <Field label="User Type"><input className={compactInput} value={formState.userType} onChange={(event) => setFormState((current) => ({ ...current, userType: event.target.value }))} /></Field>
            <Field label="Profile Image URL"><input className={compactInput} value={formState.profileImage} onChange={(event) => setFormState((current) => ({ ...current, profileImage: event.target.value }))} /></Field>
            <Field label="Exam Mode"><SelectDropdown value={formState.examMode} onChange={(value) => setFormState((current) => ({ ...current, examMode: value }))} options={modeOptions} placeholder="Select exam mode" /></Field>
            <Field label="Level"><SelectDropdown value={formState.level} onChange={(value) => setFormState((current) => ({ ...current, level: value }))} options={learningLevelOptions} placeholder="Select learning level" /></Field>
            <Field label="Premium Expiry"><input className={compactInput} type="datetime-local" value={formState.premiumExpiresAt} disabled={Boolean(editingUser)} onChange={(event) => setFormState((current) => ({ ...current, premiumExpiresAt: event.target.value }))} /></Field>
            <div className="flex flex-wrap gap-2 col-span-2 pt-1">
              <div className="flex items-center gap-1.5"><ToggleSwitch checked={formState.onboardingComplete} onChange={(value) => setFormState((current) => ({ ...current, onboardingComplete: value }))} label="" size="sm" /><span className="text-[9px] text-slate-600">Onboarding</span></div>
              <div className="flex items-center gap-1.5"><ToggleSwitch checked={formState.isPremium} disabled={Boolean(editingUser)} onChange={(value) => setFormState((current) => ({ ...current, isPremium: value }))} label="" size="sm" /><span className="text-[9px] text-slate-600">Premium</span></div>
              <div className="flex items-center gap-1.5"><ToggleSwitch checked={formState.isAdmin} onChange={(value) => setFormState((current) => ({ ...current, isAdmin: value }))} label="" size="sm" /><span className="text-[9px] text-slate-600">Admin</span></div>
              <div className="flex items-center gap-1.5"><ToggleSwitch checked={formState.isActive} onChange={(value) => setFormState((current) => ({ ...current, isActive: value }))} label="" size="sm" /><span className="text-[9px] text-slate-600">Active</span></div>
              <div className="flex items-center gap-1.5"><ToggleSwitch checked={formState.isBlocked} onChange={(value) => setFormState((current) => ({ ...current, isBlocked: value }))} label="" size="sm" /><span className="text-[9px] text-slate-600">Blocked</span></div>
            </div>
          </div>
        </EntityFormWrapper>
      )}

      <ConfirmDeleteModal open={Boolean(deleteUser)} title="Delete user" description="This will remove the user record. Historical analytics collections are not automatically deleted." onCancel={() => setDeleteUser(null)} onConfirm={handleDelete} />
      <ConfirmDeleteModal open={Boolean(truncateUser)} title="Truncate user data" description={`Reset all non-personal data for ${truncateUser?.name || truncateUser?.email || truncateUser?.mobile || "this user"}.`} confirmLabel="Truncate" onCancel={() => setTruncateUser(null)} onConfirm={handleTruncateUserData} />
      <ConfirmDeleteModal open={bulkDeleteOpen} title="Delete selected users" description={`Delete ${selectedIds.length} selected user record(s).`} onCancel={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} />
    </div>
  );
}
