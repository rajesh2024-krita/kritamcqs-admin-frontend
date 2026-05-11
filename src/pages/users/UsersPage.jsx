import { useEffect, useMemo, useState } from "react";
import { userService } from "../../api/userService";
import { learningLevelService } from "../../api/learningLevelService";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EntityFormWrapper } from "../../components/forms/EntityFormWrapper";
import { Field } from "../../components/forms/Field";
import { SelectDropdown } from "../../components/forms/SelectDropdown";
import { DataTable } from "../../components/tables/DataTable";
import { Pagination } from "../../components/tables/Pagination";
import { SearchBar } from "../../components/tables/SearchBar";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import { formatDate } from "../../utils/format";
import { EditIcon, EyeIcon, PlusIcon, TrashIcon, XIcon } from "../../components/common/AdminIcons";

const defaultForm = {
  mobile: "",
  email: "",
  name: "",
  password: "",
  examMode: "",
  level: "",
  premiumExpiresAt: "",
  onboardingComplete: false,
  isPremium: false,
  isAdmin: false,
};

function toDateTimeLocal(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [deleteUser, setDeleteUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [migrationFile, setMigrationFile] = useState(null);
  const [migrationPreview, setMigrationPreview] = useState(null);
  const [migrationPreviewReady, setMigrationPreviewReady] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState([]);
  const [learningLevels, setLearningLevels] = useState([]);
  const learningLevelOptions = learningLevels.map((level) => ({ label: level.label, value: level.key }));
  const revisionTotalCount = overview?.revisionSummary?.totalCount ?? overview?.revisionSummary?.revisionPendingCount ?? 0;
  const revisionWrongCount = overview?.revisionSummary?.wrongQuestionCount ?? 0;
  const revisionOldCorrectCount = overview?.revisionSummary?.oldCorrectQuestionCount ?? 0;

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

  async function loadUsers(nextQuery = query) {
    setLoading(true);
    try {
      const response = await userService.list({ ...nextQuery, search });
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
    loadLearningLevels();
    loadMigrationLogs();
  }, [query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadUsers({ ...current, page: 1 });
        return current;
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

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

  async function loadLearningLevels() {
    try {
      const response = await learningLevelService.list({ limit: 100, active: true, sortBy: "sortOrder", sortOrder: "asc" });
      setLearningLevels(response.data || []);
    } catch {
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
      toast.success(`Imported ${response.data?.importedUsers ?? 0} users`);
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
      examMode: user.examMode || "",
      level: user.level || "",
      premiumExpiresAt: toDateTimeLocal(user.premiumExpiresAt),
      onboardingComplete: Boolean(user.onboardingComplete),
      isPremium: Boolean(user.isPremium),
      isAdmin: Boolean(user.isAdmin),
    });
    setShowForm(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    try {
      const payload = {
        ...formState,
        premiumExpiresAt: formState.premiumExpiresAt ? new Date(formState.premiumExpiresAt).toISOString() : "",
      };

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
    setSelectedIds([]);
    setQuery((current) => ({ ...current, limit, page: 1 }));
    loadUsers({ ...query, limit, page: 1 });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">User Intelligence</div>
            <p className="text-slate-500">
              View full learner performance, attendance, reports, subscriptions, mistakes, weak areas, and submission trails in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">{meta?.total ?? users.length} learners</div>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} />
              Create User
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users by name, mobile, or email..." />
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 ? (
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setBulkDeleteOpen(true)}>
              <TrashIcon size={16} />
              Delete Selected ({selectedIds.length})
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Rows
            <select className={ui.input} value={query.limit} onChange={handleLimitChange}>
              {[10, 25, 50, 100, 200, 500].map((limit) => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </label>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => loadUsers({ ...query, page: 1 })}>Search</button>
        </div>
      </div>

      <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">Old App Migration</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Import MySQL Users</h2>
            <p className="mt-1 text-slate-500">Upload exported users from MySQL. Mobile numbers are cleaned, invalid rows skipped, and duplicates checked by mobile and email.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className={ui.input}
              type="file"
              accept=".sql,.csv,.xlsx,.xls"
              onChange={(event) => {
                setMigrationFile(event.target.files?.[0] || null);
                setMigrationPreview(null);
                setMigrationPreviewReady(false);
              }}
            />
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={migrationLoading} onClick={handlePreviewMigration}>
              {migrationLoading ? "Processing..." : "Preview"}
            </button>
            <button
              className={cn(ui.buttonBase, ui.buttonPrimary)}
              disabled={migrationLoading || !migrationPreviewReady || Number(migrationPreview?.importableUsers ?? 0) <= 0}
              onClick={handleImportMigration}
            >
              Import Users
            </button>
          </div>
        </div>

        {migrationPreview ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Users", migrationPreview.totalUsers],
                ["Imported / Ready", migrationPreview.importedUsers ?? migrationPreview.importableUsers],
                ["Duplicates Skipped", migrationPreview.duplicateUsers],
                ["Invalid Skipped", migrationPreview.invalidUsers],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
                  <strong className="mt-2 block text-2xl font-black text-slate-900">{value ?? 0}</strong>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <span className="rounded-sm bg-slate-100 px-3 py-2">Source duplicates: {migrationPreview.sourceDuplicateUsers ?? 0}</span>
              <span className="rounded-sm bg-slate-100 px-3 py-2">Already in MongoDB: {migrationPreview.existingDuplicateUsers ?? 0}</span>
            </div>
          </>
        ) : null}

        {migrationPreview?.invalidRows?.length ? (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Invalid Rows Skipped</h3>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr><th>Row</th><th>Name</th><th>Mobile</th><th>Email</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {migrationPreview.invalidRows.map((row) => (
                    <tr key={`${row.row}-${row.mobile || ""}-${row.email || ""}`}>
                      <td>{row.row}</td>
                      <td>{row.name || "-"}</td>
                      <td>{row.mobile || "-"}</td>
                      <td>{row.email || "-"}</td>
                      <td>{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Number(migrationPreview.invalidUsers ?? 0) > migrationPreview.invalidRows.length ? (
              <div className="mt-2 text-sm text-slate-500">
                Showing first {migrationPreview.invalidRows.length} invalid rows.
              </div>
            ) : null}
          </div>
        ) : null}

        {migrationPreview?.previewRows?.length ? (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Preview Rows</h3>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr><th>Name</th><th>Mobile</th><th>Email</th><th>Premium</th><th>Admin</th></tr>
                </thead>
                <tbody>
                  {migrationPreview.previewRows.map((row) => (
                    <tr key={`${row.mobile}-${row.email || ""}`}>
                      <td>{row.name || "-"}</td>
                      <td>{row.mobile}</td>
                      <td>{row.email || "-"}</td>
                      <td>{row.isPremium ? "Yes" : "No"}</td>
                      <td>{row.isAdmin ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {migrationLogs.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {migrationLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <strong className="block text-slate-900">{formatDate(log.migrationDate)}</strong>
                {log.importedUsers} imported | {log.duplicateUsers} duplicates | {log.invalidUsers} invalid
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        {loading ? <LoadingSpinner label="Loading users..." /> : null}
        {!loading && !users.length ? <EmptyState title="No users found" description="Try a different search or create a new user." /> : null}
        {!loading && users.length ? (
          <>
            <DataTable
              columns={[
                {
                  key: "name",
                  label: "User",
                  render: (row) => (
                    <button
                      className={cn(
                        "flex w-full flex-col items-start gap-1 rounded-sm border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50",
                        selectedUser?.id === row.id && "border-blue-300 bg-blue-50",
                      )}
                      onClick={() => handleSelectUser(row)}
                    >
                      <div className="font-bold text-slate-900">{row.name || row.mobile}</div>
                      <div className={ui.muted}>{row.email || row.mobile}</div>
                    </button>
                  ),
                },
                { key: "examMode", label: "Exam Mode" },
                { key: "level", label: "Level" },
                {
                  key: "flags",
                  label: "Flags",
                  render: (row) => (
                    <>
                      {row.isPremium ? <span className={ui.pill}>Premium</span> : null}
                      {row.isAdmin ? <span className={ui.pill}>Admin</span> : null}
                      {row.onboardingComplete ? <span className={ui.pill}>Onboarded</span> : null}
                    </>
                  ),
                },
                { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
              ]}
              rows={users}
              selectable
              selectedRowIds={selectedIds}
              onToggleRow={toggleRowSelection}
              onToggleAllRows={toggleAllSelection}
              renderActions={(row) => (
                <div className="flex flex-wrap items-center gap-3">
                  <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => handleSelectUser(row)}>
                    <EyeIcon size={16} />
                    View
                  </button>
                  <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openEdit(row)}>
                    <EditIcon size={16} />
                    Edit
                  </button>
                  <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteUser(row)}>
                    <TrashIcon size={16} />
                    Delete
                  </button>
                </div>
              )}
            />
            <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
          </>
        ) : null}
      </div>

      {detailsOpen && selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm lg:left-[300px]" onClick={() => setDetailsOpen(false)}>
          <div className="admin-modal max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-950/20" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedUser.name || selectedUser.mobile}</h3>
                  <p className="mt-2 text-slate-500">{selectedUser.email || selectedUser.mobile}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">{selectedUser.examMode || "No mode"}</div>
                  <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setDetailsOpen(false)}>
                    <XIcon size={16} />
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Level</span><strong className="mt-2 block text-lg font-bold text-slate-900">{selectedUser.level || "-"}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Premium</span><strong className="mt-2 block text-lg font-bold text-slate-900">{selectedUser.isPremium ? "Yes" : "No"}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Admin</span><strong className="mt-2 block text-lg font-bold text-slate-900">{selectedUser.isAdmin ? "Yes" : "No"}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Joined</span><strong className="mt-2 block text-lg font-bold text-slate-900">{formatDate(selectedUser.createdAt)}</strong></div>
              </div>

              {overviewLoading ? <LoadingSpinner label="Loading user insights..." /> : null}

              {overview ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {summaryCards.map(([label, value]) => (
                      <div key={label} className={ui.metricCard}>
                        <div className={ui.metricTop}>
                          <span className={ui.metricLabel}>{label}</span>
                          <span className={ui.metricDot} />
                        </div>
                        <h2 className={ui.metricValue}>{value}</h2>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className={ui.panel}>
                      <div className={ui.sectionHead}>
                        <div>
                          <h3>Performance Reports</h3>
                          <p className="text-slate-500">Attendance and test summary for this learner.</p>
                        </div>
                      </div>
                      <div className={ui.activityList}>
                        {overview.reports.slice(0, 8).map((report) => (
                          <div key={report.id} className={ui.activityItem}>
                            <div className={ui.activityAvatar}>{report.attemptNumber}</div>
                            <div className={ui.activityBody}>
                              <strong>Attempt #{report.attemptNumber}</strong>
                              <div className={ui.muted}>
                                Score {report.score ?? 0} | Accuracy {report.accuracy ?? 0}% | Time {report.timeTaken ?? 0}s
                              </div>
                            </div>
                            <div className={ui.activityTime}>{formatDate(report.completedAt || report.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={ui.panel}>
                      <div className={ui.sectionHead}>
                        <div>
                          <h3>Subscriptions</h3>
                          <p className="text-slate-500">Premium history and active access details.</p>
                        </div>
                      </div>
                      <div className={ui.activityList}>
                        {(overview.subscriptionSummary.history || []).slice(0, 8).map((item) => (
                          <div key={item.id} className={ui.activityItem}>
                            <div className={ui.activityAvatar}>S</div>
                            <div className={ui.activityBody}>
                              <strong>{item.planId}</strong>
                              <div className={ui.muted}>
                                {item.status} | Amount {item.amount ?? 0}
                              </div>
                            </div>
                            <div className={ui.activityTime}>{formatDate(item.createdAt)}</div>
                          </div>
                        ))}
                        {!overview.subscriptionSummary.history.length ? <p className="text-slate-500">No subscriptions found.</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className={ui.panel}>
                      <div className={ui.sectionHead}>
                        <div>
                          <h3>Mistakes</h3>
                          <p className="text-slate-500">Current mistake book and revision queue based on recent mistakes and spaced recall.</p>
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-sm border border-red-100 bg-red-50/70 p-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-700">Mistake Recovery</span>
                          <strong className="mt-1 block text-2xl font-black text-red-700">{revisionWrongCount}</strong>
                        </div>
                        <div className="rounded-sm border border-blue-100 bg-blue-50/70 p-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Spaced Recall</span>
                          <strong className="mt-1 block text-2xl font-black text-blue-700">{revisionOldCorrectCount}</strong>
                        </div>
                        <div className="rounded-sm border border-emerald-100 bg-emerald-50/70 p-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Revision Total</span>
                          <strong className="mt-1 block text-2xl font-black text-emerald-700">{revisionTotalCount}</strong>
                        </div>
                      </div>
                      {!overview.revisionSummary?.isPremiumEnabled ? (
                        <p className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          This user is not premium. Revision total is estimated from user stats fallback logic.
                        </p>
                      ) : null}
                      <div className={ui.tableScroll}>
                        <table className={ui.table}>
                          <thead>
                            <tr>
                              <th>Question</th>
                              <th>Subject</th>
                              <th>Status</th>
                              <th>Attempts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overview.mistakes.slice(0, 10).map((item) => (
                              <tr key={item.id}>
                                <td>{item.question}</td>
                                <td>{item.subjectName}</td>
                                <td><span className={ui.pill}>{item.status}</span></td>
                                <td>{item.attempts}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-sm border border-red-100 bg-red-50/40 p-3">
                          <h4 className="text-sm font-bold text-red-700">Recent Mistake Questions</h4>
                          <div className="mt-2 space-y-2">
                            {(overview.revisionSummary?.wrongQuestions || []).slice(0, 5).map((item) => (
                              <div key={item.id} className="rounded-sm border border-red-100 bg-white/80 p-2">
                                <p className="line-clamp-2 text-xs font-semibold text-slate-800">{item.question}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{item.subjectName} | {item.chapterName}</p>
                              </div>
                            ))}
                            {!overview.revisionSummary?.wrongQuestions?.length ? (
                              <p className="text-xs text-slate-500">No mistake recovery questions in the current revision set.</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="rounded-sm border border-blue-100 bg-blue-50/40 p-3">
                          <h4 className="text-sm font-bold text-blue-700">Spaced Recall Questions</h4>
                          <div className="mt-2 space-y-2">
                            {(overview.revisionSummary?.oldCorrectQuestions || []).slice(0, 5).map((item) => (
                              <div key={item.id} className="rounded-sm border border-blue-100 bg-white/80 p-2">
                                <p className="line-clamp-2 text-xs font-semibold text-slate-800">{item.question}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{item.subjectName} | {item.chapterName}</p>
                              </div>
                            ))}
                            {!overview.revisionSummary?.oldCorrectQuestions?.length ? (
                              <p className="text-xs text-slate-500">No spaced recall questions in the current revision set.</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={ui.panel}>
                      <div className={ui.sectionHead}>
                        <div>
                          <h3>Weak Areas</h3>
                          <p className="text-slate-500">Chapters flagged as weak from performance analysis.</p>
                        </div>
                      </div>
                      <div className={ui.tableScroll}>
                        <table className={ui.table}>
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Chapter</th>
                              <th>Accuracy</th>
                              <th>Strength</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overview.weakAreas.slice(0, 10).map((item) => (
                              <tr key={item.id}>
                                <td>{item.subjectName}</td>
                                <td>{item.chapterName}</td>
                                <td>{item.accuracy ?? 0}%</td>
                                <td><span className={ui.pill}>{item.strength}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className={ui.panel}>
                    <div className={ui.sectionHead}>
                      <div>
                        <h3>Submission Details</h3>
                        <p className="text-slate-500">Recent question-level submissions across the app.</p>
                      </div>
                    </div>
                    <div className={ui.tableScroll}>
                      <table className={ui.table}>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Subject</th>
                            <th>Chapter</th>
                            <th>Result</th>
                            <th>Time Spent</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.submissions.slice(0, 12).map((item) => (
                            <tr key={item.id}>
                              <td>{item.question}</td>
                              <td>{item.subjectName}</td>
                              <td>{item.chapterName}</td>
                              <td><span className={ui.pill}>{item.isCorrect ? "Correct" : item.skipped ? "Skipped" : "Incorrect"}</span></td>
                              <td>{item.timeSpent ?? 0}s</td>
                              <td>{formatDate(item.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingUser ? "Edit User" : "Create User"}
          subtitle="Manage core learner profile and access flags."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSave}
          submitLabel={editingUser ? "Save Changes" : "Create User"}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Mobile"><input className={ui.input} value={formState.mobile} onChange={(event) => setFormState((current) => ({ ...current, mobile: event.target.value }))} /></Field>
            <Field label="Email"><input className={ui.input} type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label="Name"><input className={ui.input} value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Password"><input className={ui.input} type="password" value={formState.password} onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))} /></Field>
            <Field label="Exam Mode">
              <SelectDropdown value={formState.examMode} onChange={(value) => setFormState((current) => ({ ...current, examMode: value }))} options={[{ label: "NEET", value: "NEET" }, { label: "JEE", value: "JEE" }, { label: "BOTH", value: "BOTH" }]} />
            </Field>
            <Field label="Level">
              <SelectDropdown value={formState.level} onChange={(value) => setFormState((current) => ({ ...current, level: value }))} options={learningLevelOptions} />
            </Field>
            <Field label="Premium Expiry"><input className={ui.input} type="datetime-local" value={formState.premiumExpiresAt} onChange={(event) => setFormState((current) => ({ ...current, premiumExpiresAt: event.target.value }))} /></Field>
            <Field label="Onboarding Complete"><input className={ui.checkbox} type="checkbox" checked={formState.onboardingComplete} onChange={(event) => setFormState((current) => ({ ...current, onboardingComplete: event.target.checked }))} /></Field>
            <Field label="Premium User"><input className={ui.checkbox} type="checkbox" checked={formState.isPremium} onChange={(event) => setFormState((current) => ({ ...current, isPremium: event.target.checked }))} /></Field>
            <Field label="Admin User"><input className={ui.checkbox} type="checkbox" checked={formState.isAdmin} onChange={(event) => setFormState((current) => ({ ...current, isAdmin: event.target.checked }))} /></Field>
          </div>
        </EntityFormWrapper>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteUser)}
        title="Delete user"
        description="This will remove the user record. Historical analytics collections are not automatically deleted."
        onCancel={() => setDeleteUser(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteModal
        open={bulkDeleteOpen}
        title="Delete selected users"
        description={`Delete ${selectedIds.length} selected user record(s). This action cannot be undone.`}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
