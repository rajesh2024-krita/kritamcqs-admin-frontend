import { useEffect, useMemo, useState } from "react";
import { Award, Bell, CalendarDays, Check, Download, FileText, Filter, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Trophy, Users, X } from "lucide-react";
import { nationalCompetitionService } from "../api/nationalCompetitionService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const tabs = [
  { key: "overview", label: "Dashboard", icon: Trophy },
  { key: "setup", label: "Competition", icon: Settings },
  { key: "participants", label: "Participants", icon: Users },
  { key: "leaderboard", label: "Leaderboard", icon: ShieldCheck },
  { key: "rewards", label: "Rewards", icon: Award },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "audit", label: "Audit", icon: CalendarDays },
];

const defaultForm = {
  title: "",
  description: "",
  examType: "BOTH",
  status: "draft",
  registrationOpensAt: "",
  registrationClosesAt: "",
  startsAt: "",
  endsAt: "",
  durationMinutes: 180,
  totalQuestions: 180,
  marksPerQuestion: 4,
  negativeMarks: 1,
  questionIds: "",
  questionSelection: {
    mode: "manual",
    targetCount: 180,
    filters: {
      examType: "BOTH",
      subjectId: "",
      chapterId: "",
      topicId: "",
      yearId: "",
      difficultyId: "",
      difficulty: "",
      questionTypeId: "",
      responseType: "",
      questionStatus: "complete",
      reviewStatus: "ready",
      visibleOnly: true,
    },
  },
  rules: "Use one device only\nDo not leave the test screen\nFinal ranking follows configured tie-break rules",
  rewardsSummary: "",
  terms: "",
  eligibility: { premiumRequired: false, approvalRequired: false, participantLimit: 0, allowedStates: "", allowedDistricts: "" },
  leaderboard: {
    enabled: true,
    refreshSeconds: 30,
    rankingPriority: "marks,negativeMarks,totalTime,averageTimePerQuestion,accuracy,submissionTime,attendance",
    publishWeekly: true,
    publishMonthly: true,
  },
  security: { oneAttemptOnly: true, deviceValidation: true, duplicateLoginDetection: true, autosaveIntervalSeconds: 20 },
  isPublished: false,
  isEnabled: false,
  isActive: true,
  banner: {
    enabled: true,
    testName: "",
    backgroundImageUrl: "",
    backgroundColor: "#4f21d8",
    overlayColor: "rgba(42,19,143,0.42)",
    textColor: "#ffffff",
    countdownEnabled: true,
    ctaText: "View Details",
    buttonColor: "#ffffff",
    buttonTextColor: "#3b159f",
    buttonAction: "view_details",
  },
};

function toLocalInput(date) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromForm(form) {
  return {
    ...form,
    questionIds: String(form.questionIds || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
    questionSelection: {
      mode: form.questionSelection?.mode === "automatic" ? "automatic" : "manual",
      targetCount: Number(form.questionSelection?.targetCount || form.totalQuestions || 0),
      filters: form.questionSelection?.filters || {},
    },
    rules: String(form.rules || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    eligibility: {
      ...form.eligibility,
      participantLimit: Number(form.eligibility.participantLimit || 0),
      allowedStates: String(form.eligibility.allowedStates || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      allowedDistricts: String(form.eligibility.allowedDistricts || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
    },
    leaderboard: {
      ...form.leaderboard,
      rankingPriority: String(form.leaderboard.rankingPriority || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      refreshSeconds: Number(form.leaderboard.refreshSeconds || 30),
    },
    security: { ...form.security, autosaveIntervalSeconds: Number(form.security.autosaveIntervalSeconds || 20) },
  };
}

function toForm(item) {
  if (!item) return defaultForm;
  return {
    ...defaultForm,
    ...item,
    registrationOpensAt: toLocalInput(item.registrationOpensAt),
    registrationClosesAt: toLocalInput(item.registrationClosesAt),
    startsAt: toLocalInput(item.startsAt),
    endsAt: toLocalInput(item.endsAt),
    questionIds: (item.questionIds || []).join("\n"),
    questionSelection: {
      ...defaultForm.questionSelection,
      ...(item.questionSelection || {}),
      filters: { ...defaultForm.questionSelection.filters, ...(item.questionSelection?.filters || {}) },
    },
    rules: (item.rules || []).join("\n"),
    eligibility: {
      ...defaultForm.eligibility,
      ...(item.eligibility || {}),
      allowedStates: (item.eligibility?.allowedStates || []).join(", "),
      allowedDistricts: (item.eligibility?.allowedDistricts || []).join(", "),
    },
    leaderboard: {
      ...defaultForm.leaderboard,
      ...(item.leaderboard || {}),
      rankingPriority: (item.leaderboard?.rankingPriority || []).join(", "),
    },
    security: { ...defaultForm.security, ...(item.security || {}) },
    banner: { ...defaultForm.banner, ...(item.banner || {}) },
    isPublished: Boolean(item.isPublished),
    isEnabled: Boolean(item.isEnabled),
    isActive: item.isActive !== false,
  };
}

function Field({ label, children, wide }) {
  return <label className={cn(ui.field, wide && "md:col-span-2")}>{label}{children}</label>;
}

function Metric({ label, value }) {
  return (
    <div className={ui.metricCard}>
      <div className={ui.metricLabel}>{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function DataTable({ rows, columns }) {
  if (!rows?.length) return <EmptyState title="No data" description="Records will appear here as the competition runs." />;
  return (
    <div className={ui.tableWrap}>
      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead><tr>{columns.map((column) => <th key={column} className={ui.tableHead}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column} className={ui.tableCell}>{String(row[column] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function PanelList({ action, onAction, rows, columns }) {
  return <div className="space-y-4"><button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={onAction}>{action}</button><DataTable rows={rows} columns={columns} /></div>;
}

function Reports({ reports }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Registrations" value={reports?.participation?.registrations || 0} />
        <Metric label="Submitted" value={reports?.participation?.submitted || 0} />
        <Metric label="Average Marks" value={reports?.averageMarks || 0} />
      </div>
      <DataTable rows={reports?.statePerformance || []} columns={["_id", "averageMarks", "participants"]} />
      <DataTable rows={reports?.topPerformers || []} columns={["rank", "userName", "score", "state", "district"]} />
    </div>
  );
}

function BannerEditor({ form, setForm }) {
  const banner = form.banner || defaultForm.banner;
  const update = (patch) => setForm((current) => ({ ...current, banner: { ...current.banner, ...patch } }));
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-black text-slate-950">Home competition banner</div>
          <p className="mt-1 text-xs text-slate-500">Shown at the top of the student dashboard only when the competition is published and enabled.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
          <input type="checkbox" className={ui.checkbox} checked={banner.enabled !== false} onChange={(event) => update({ enabled: event.target.checked })} />
          Banner enabled
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Test name"><input className={ui.input} value={banner.testName} onChange={(e) => update({ testName: e.target.value })} /></Field>
          <Field label="Background image URL"><input className={ui.input} value={banner.backgroundImageUrl} onChange={(e) => update({ backgroundImageUrl: e.target.value })} /></Field>
          <Field label="Background color"><input className={ui.input} value={banner.backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} /></Field>
          <Field label="Overlay color"><input className={ui.input} value={banner.overlayColor} onChange={(e) => update({ overlayColor: e.target.value })} /></Field>
          <Field label="Text color"><input className={ui.input} value={banner.textColor} onChange={(e) => update({ textColor: e.target.value })} /></Field>
          <Field label="Button color"><input className={ui.input} value={banner.buttonColor} onChange={(e) => update({ buttonColor: e.target.value })} /></Field>
          <Field label="Button text"><input className={ui.input} value={banner.ctaText} onChange={(e) => update({ ctaText: e.target.value })} /></Field>
          <Field label="Button action">
            <select className={ui.input} value={banner.buttonAction} onChange={(e) => update({ buttonAction: e.target.value })}>
              <option value="register">Register</option>
              <option value="view_details">View Details</option>
              <option value="join_test">Join Test</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
            <input type="checkbox" className={ui.checkbox} checked={banner.countdownEnabled !== false} onChange={(event) => update({ countdownEnabled: event.target.checked })} />
            Countdown timer
          </label>
        </div>
        <div
          className="min-h-56 rounded-xl bg-cover bg-center p-5 shadow-lg"
          style={{
            backgroundColor: banner.backgroundColor,
            backgroundImage: banner.backgroundImageUrl ? `linear-gradient(${banner.overlayColor}, ${banner.overlayColor}), url(${banner.backgroundImageUrl})` : `linear-gradient(${banner.overlayColor}, ${banner.overlayColor})`,
            color: banner.textColor,
          }}
        >
          <div className="text-xs font-black uppercase opacity-80">Preview</div>
          <div className="mt-3 text-2xl font-black">{banner.testName || form.title || "Weekly All India Mock Test"}</div>
          <div className="mt-3 text-sm opacity-90">Rank 1: Student name changes by National, State, or District.</div>
          <button type="button" className="mt-5 rounded-lg px-4 py-2 text-sm font-black" style={{ backgroundColor: banner.buttonColor, color: banner.buttonTextColor }}>
            {banner.ctaText || "View Details"}
          </button>
        </div>
      </div>
    </section>
  );
}

function QuestionSelectionPanel({
  form,
  setForm,
  selectedQuestionIds,
  questionMeta,
  questionPool,
  questionPoolMeta,
  questionPoolLoading,
  questionFilters,
  setQuestionFilters,
  loadQuestionPool,
  toggleQuestion,
  setManualQuestionIds,
  updateQuestionSelection,
  applyAutoFiltersFromPicker,
}) {
  const mode = form.questionSelection?.mode || "manual";
  const autoFilters = form.questionSelection?.filters || {};
  const selectedSet = new Set(selectedQuestionIds);
  const setFilter = (key, value) => setQuestionFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const selectOptions = {
    subjects: questionMeta.subjects || [],
    chapters: questionMeta.chapters || [],
    topics: questionMeta.topics || [],
    years: questionMeta.years || [],
    difficulties: questionMeta.difficulties || [],
    questionTypes: questionMeta.questionTypes || [],
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-black text-slate-950">Question configuration</div>
          <p className="mt-1 text-xs text-slate-500">Choose questions manually, or let the system select them automatically from filtered categories.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {["manual", "automatic"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateQuestionSelection({ mode: item })}
              className={cn("rounded-md px-3 py-2 text-xs font-black uppercase transition", mode === item ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <FilterInput label="Search" value={questionFilters.search} onChange={(value) => setFilter("search", value)} placeholder="Question text or tag" />
        <FilterSelect label="Exam" value={questionFilters.examType} onChange={(value) => setFilter("examType", value)} options={[["BOTH", "Both"], ["NEET", "NEET"], ["JEE", "JEE"]]} />
        <FilterSelect label="Subject" value={questionFilters.subjectId} onChange={(value) => setFilter("subjectId", value)} options={selectOptions.subjects.map((item) => [item.id, item.name])} />
        <FilterSelect label="Chapter" value={questionFilters.chapterId} onChange={(value) => setFilter("chapterId", value)} options={selectOptions.chapters.map((item) => [item.id, item.name])} />
        <FilterSelect label="Topic" value={questionFilters.topicId} onChange={(value) => setFilter("topicId", value)} options={selectOptions.topics.map((item) => [item.id, item.name])} />
        <FilterSelect label="Year" value={questionFilters.yearId} onChange={(value) => setFilter("yearId", value)} options={selectOptions.years.map((item) => [item.id, item.year || item.label || item.name])} />
        <FilterSelect label="Difficulty" value={questionFilters.difficultyId} onChange={(value) => setFilter("difficultyId", value)} options={selectOptions.difficulties.map((item) => [item.id, item.name || item.key])} />
        <FilterSelect label="Question type" value={questionFilters.questionTypeId} onChange={(value) => setFilter("questionTypeId", value)} options={selectOptions.questionTypes.map((item) => [item.id, item.name || item.label || item.key])} />
        <FilterSelect label="Response" value={questionFilters.responseType} onChange={(value) => setFilter("responseType", value)} options={[["single", "Single"], ["multiple", "Multiple"], ["numeric", "Numeric"]]} />
        <FilterSelect label="Question status" value={questionFilters.questionStatus} onChange={(value) => setFilter("questionStatus", value)} options={[["complete", "Complete"], ["incomplete", "Incomplete"]]} />
        <FilterSelect label="Review status" value={questionFilters.reviewStatus} onChange={(value) => setFilter("reviewStatus", value)} options={[["ready", "Ready"], ["needs_review", "Needs review"]]} />
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
          <input type="checkbox" className={ui.checkbox} checked={questionFilters.visibleOnly !== false} onChange={(event) => setFilter("visibleOnly", event.target.checked)} />
          Visible only
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => loadQuestionPool(questionFilters)}>
          <Filter size={16} />Apply filters
        </button>
        <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={applyAutoFiltersFromPicker}>
          <Sparkles size={16} />Use filters for automatic
        </button>
        <div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600">
          Pool: {questionPoolMeta?.total || 0} | Selected: {selectedQuestionIds.length}
        </div>
        {mode === "automatic" ? (
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            Auto count
            <input
              type="number"
              className={cn(ui.input, "w-28")}
              value={form.questionSelection?.targetCount || form.totalQuestions || 180}
              onChange={(event) => updateQuestionSelection({ targetCount: Number(event.target.value || 0) })}
            />
          </label>
        ) : null}
      </div>

      {mode === "automatic" ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-black">Automatic selection active</div>
          <p className="mt-1">The backend will select {form.questionSelection?.targetCount || form.totalQuestions || 0} questions matching the saved filters when this competition is saved.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {Object.entries(autoFilters).filter(([, value]) => value).map(([key, value]) => (
              <span key={key} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">{key}: {String(value)}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[56px_1fr_160px_130px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500">
          <span>Select</span><span>Question</span><span>Category</span><span>Status</span>
        </div>
        {questionPoolLoading ? (
          <div className="p-5"><LoadingSpinner label="Loading questions..." /></div>
        ) : questionPool.length ? (
          <div className="max-h-[460px] overflow-y-auto">
            {questionPool.map((question) => {
              const id = question.id || question._id;
              const checked = selectedSet.has(String(id));
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => mode === "manual" && toggleQuestion(id)}
                  className={cn("grid w-full grid-cols-[56px_1fr_160px_130px] items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition", checked ? "bg-sky-50" : "hover:bg-slate-50", mode === "automatic" && "cursor-default")}
                >
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", checked ? "border-sky-300 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-400")}>
                    {checked ? <Check size={16} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-bold text-slate-900">{question.question}</span>
                    <span className="mt-1 block text-xs text-slate-500">{question.responseType || "single"} | {question.examMode || question.exam || "Exam"}</span>
                  </span>
                  <span className="text-xs text-slate-600">
                    <strong className="block text-slate-800">{question.subjectId?.name || "Subject"}</strong>
                    {question.chapterId?.name || "Chapter"}
                  </span>
                  <span className="text-xs text-slate-600">{question.questionStatus}<br />{question.reviewStatus}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No questions found" description="Adjust filters to find questions for this competition." />
        )}
      </div>

      {selectedQuestionIds.length && mode === "manual" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">Selected questions</div>
            <button type="button" className={cn(ui.buttonBase, ui.buttonGhost, "min-h-8 px-3 py-1 text-xs")} onClick={() => setManualQuestionIds([])}>
              <X size={14} />Clear all
            </button>
          </div>
          <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
            {selectedQuestionIds.map((id) => (
              <button key={id} type="button" onClick={() => toggleQuestion(id)} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                {id.slice(-8)} x
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <textarea className="sr-only" value={form.questionIds} onChange={(event) => setForm({ ...form, questionIds: event.target.value })} />
    </section>
  );
}

function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
      {label}
      <input className={ui.input} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
      {label}
      <select className={ui.input} value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {(options || []).map(([id, name]) => <option key={id || name} value={id}>{name || id}</option>)}
      </select>
    </label>
  );
}

export function NationalCompetitionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reports, setReports] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [questionMeta, setQuestionMeta] = useState({ subjects: [], chapters: [], topics: [], years: [], difficulties: [], questionTypes: [] });
  const [questionPool, setQuestionPool] = useState([]);
  const [questionPoolMeta, setQuestionPoolMeta] = useState(null);
  const [questionPoolLoading, setQuestionPoolLoading] = useState(false);
  const [questionFilters, setQuestionFilters] = useState({ page: 1, limit: 20, search: "", examType: "BOTH", subjectId: "", chapterId: "", topicId: "", yearId: "", difficultyId: "", difficulty: "", questionTypeId: "", responseType: "", questionStatus: "complete", reviewStatus: "ready", visibleOnly: true });
  const selected = useMemo(() => detail?.competition || items.find((item) => item.id === selectedId), [detail, items, selectedId]);
  const selectedQuestionIds = useMemo(() => String(form.questionIds || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean), [form.questionIds]);

  async function loadBase() {
    setLoading(true);
    try {
      const [dashboardResponse, listResponse] = await Promise.all([
        nationalCompetitionService.dashboard(),
        nationalCompetitionService.list({ search }),
      ]);
      const nextItems = listResponse.data || [];
      setDashboard(dashboardResponse.data);
      setItems(nextItems);
      if (!selectedId && nextItems[0]) setSelectedId(nextItems[0].id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestionMeta() {
    try {
      const response = await nationalCompetitionService.questionPoolMeta();
      setQuestionMeta(response.data || { subjects: [], chapters: [], topics: [], years: [], difficulties: [], questionTypes: [] });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function loadQuestionPool(nextFilters = questionFilters) {
    setQuestionPoolLoading(true);
    try {
      const cleanFilters = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value !== "" && value !== null && value !== undefined));
      const response = await nationalCompetitionService.questionPool(cleanFilters);
      setQuestionPool(response.data || []);
      setQuestionPoolMeta(response.meta || null);
      setQuestionFilters(nextFilters);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setQuestionPoolLoading(false);
    }
  }

  async function loadDetail(id = selectedId) {
    if (!id) return;
    try {
      const [detailResponse, participantsResponse, leaderboardResponse, reportsResponse, rewardsResponse, notificationsResponse, auditResponse] = await Promise.all([
        nationalCompetitionService.get(id),
        nationalCompetitionService.participants(id),
        nationalCompetitionService.leaderboard(id),
        nationalCompetitionService.reports(id),
        nationalCompetitionService.rewards(id),
        nationalCompetitionService.notifications(id),
        nationalCompetitionService.auditLogs({ competitionId: id }),
      ]);
      setDetail(detailResponse.data);
      setForm(toForm(detailResponse.data.competition));
      setParticipants(participantsResponse.data || []);
      setLeaderboard(leaderboardResponse.data || []);
      setReports(reportsResponse.data || null);
      setRewards(rewardsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setAuditLogs(auditResponse.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    void loadBase();
    void loadQuestionMeta();
    void loadQuestionPool();
  }, []);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [selectedId]);

  async function saveCompetition(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = fromForm(form);
      const response = selected?.id ? await nationalCompetitionService.update(selected.id, payload) : await nationalCompetitionService.create(payload);
      toast.success("Competition saved");
      setSelectedId(response.data.id);
      await loadBase();
      await loadDetail(response.data.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshLeaderboard() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.refreshLeaderboard(selectedId);
      toast.success("Leaderboard refreshed");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createReward() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.createReward(selectedId, { title: "Top Rank Voucher", rewardType: "voucher", rankFrom: rewards.length + 1, rankTo: rewards.length + 1, value: 0, approvalStatus: "draft" });
      toast.success("Reward added");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createNotification() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.createNotification(selectedId, { title: "Competition Update", message: "A national competition update is available.", eventKey: "manual_update", channel: "in_app", audience: "registered", status: "draft" });
      toast.success("Notification draft added");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function lifecycleAction(action) {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.action(selectedId, action);
      toast.success(action === "publish" ? "Competition published" : action === "enable" ? "Competition enabled" : "Competition disabled");
      await loadBase();
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteCompetition() {
    if (!selectedId) return;
    const ok = window.confirm("Delete this competition and its registrations, attempts, leaderboards, rewards, notifications, and audit links?");
    if (!ok) return;
    try {
      await nationalCompetitionService.remove(selectedId);
      toast.success("Competition deleted");
      setSelectedId("");
      setDetail(null);
      setForm(defaultForm);
      await loadBase();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function updateQuestionSelection(patch) {
    setForm((current) => ({
      ...current,
      questionSelection: {
        ...current.questionSelection,
        ...patch,
        filters: { ...current.questionSelection?.filters, ...(patch.filters || {}) },
      },
    }));
  }

  function setManualQuestionIds(ids) {
    const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
    setForm((current) => ({
      ...current,
      questionIds: uniqueIds.join("\n"),
      totalQuestions: current.questionSelection?.mode === "manual" ? uniqueIds.length || current.totalQuestions : current.totalQuestions,
      questionSelection: {
        ...current.questionSelection,
        targetCount: current.questionSelection?.mode === "manual" ? uniqueIds.length : current.questionSelection?.targetCount,
      },
    }));
  }

  function toggleQuestion(questionId) {
    const id = String(questionId || "");
    if (!id) return;
    const current = new Set(selectedQuestionIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setManualQuestionIds([...current]);
  }

  function applyAutoFiltersFromPicker() {
    updateQuestionSelection({
      mode: "automatic",
      targetCount: Number(form.totalQuestions || form.questionSelection?.targetCount || 180),
      filters: { ...questionFilters, page: undefined, limit: undefined, search: undefined },
    });
  }

  if (loading) return <LoadingSpinner label="Loading national competition workspace..." />;

  return (
    <div className="space-y-6">
      <section className={ui.panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className={ui.eyebrow}>National Leaderboard Mock Tests</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Competition control center</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={cn(ui.input, "pl-9")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitions" />
            </div>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadBase}><RefreshCw size={16} />Refresh</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => { setSelectedId(""); setDetail(null); setForm(defaultForm); setTab("setup"); }}>New competition</button>
          </div>
        </div>
        {selectedId ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => lifecycleAction("publish")}>Publish</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => lifecycleAction("enable")}>Enable</button>
            <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => lifecycleAction("disable")}>Disable</button>
            <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={deleteCompetition}>Delete</button>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-slate-600">
              {selected?.isPublished ? "Published" : "Draft"} | {selected?.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        ) : null}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonGhost, "shrink-0")} onClick={() => setTab(key)}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className={ui.panel}>
          <div className="mb-3 text-sm font-black text-slate-950">Competitions</div>
          <div className="space-y-2">
            {items.length ? items.map((item) => (
              <button key={item.id} className={cn("w-full rounded-lg border p-3 text-left transition", selectedId === item.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200")} onClick={() => setSelectedId(item.id)}>
                <div className="font-bold text-slate-950">{item.title}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500"><span>{item.status}</span><span>{item.examType}</span></div>
              </button>
            )) : <EmptyState title="No competitions" description="Create the first national leaderboard competition." />}
          </div>
        </aside>

        <main className="min-w-0">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Metric label="Total" value={dashboard?.summary?.total || 0} />
                <Metric label="Live" value={dashboard?.summary?.live || 0} />
                <Metric label="Upcoming" value={dashboard?.summary?.upcoming || 0} />
                <Metric label="Registrations" value={dashboard?.summary?.registrations || 0} />
                <Metric label="Submissions" value={dashboard?.summary?.submissions || 0} />
                <Metric label="Top Entries" value={dashboard?.summary?.topRankedEntries || 0} />
              </div>
              <DataTable rows={dashboard?.recentLeaderboard || []} columns={["rank", "userName", "score", "state", "district"]} />
            </div>
          )}

          {tab === "setup" && (
            <form className={cn(ui.panel, "space-y-5")} onSubmit={saveCompetition}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title"><input className={ui.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Exam type"><select className={ui.input} value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}><option>BOTH</option><option>NEET</option><option>JEE</option></select></Field>
                <Field label="Registration opens"><input type="datetime-local" className={ui.input} value={form.registrationOpensAt} onChange={(e) => setForm({ ...form, registrationOpensAt: e.target.value })} /></Field>
                <Field label="Registration closes"><input type="datetime-local" className={ui.input} value={form.registrationClosesAt} onChange={(e) => setForm({ ...form, registrationClosesAt: e.target.value })} /></Field>
                <Field label="Starts"><input type="datetime-local" className={ui.input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
                <Field label="Ends"><input type="datetime-local" className={ui.input} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
                <Field label="Duration minutes"><input type="number" className={ui.input} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></Field>
                <Field label="Total questions"><input type="number" className={ui.input} value={form.totalQuestions} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} /></Field>
                <Field label="Description" wide><textarea className={ui.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <div className="md:col-span-2">
                  <QuestionSelectionPanel
                    form={form}
                    setForm={setForm}
                    selectedQuestionIds={selectedQuestionIds}
                    questionMeta={questionMeta}
                    questionPool={questionPool}
                    questionPoolMeta={questionPoolMeta}
                    questionPoolLoading={questionPoolLoading}
                    questionFilters={questionFilters}
                    setQuestionFilters={setQuestionFilters}
                    loadQuestionPool={loadQuestionPool}
                    toggleQuestion={toggleQuestion}
                    setManualQuestionIds={setManualQuestionIds}
                    updateQuestionSelection={updateQuestionSelection}
                    applyAutoFiltersFromPicker={applyAutoFiltersFromPicker}
                  />
                </div>
                <Field label="Rules" wide><textarea className={ui.textarea} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></Field>
                <Field label="Terms" wide><textarea className={ui.textarea} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></Field>
              </div>
              <BannerEditor form={form} setForm={setForm} />
              <div className="grid gap-4 md:grid-cols-3">
                {["premiumRequired", "approvalRequired"].map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-bold"><input type="checkbox" className={ui.checkbox} checked={Boolean(form.eligibility[key])} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, [key]: e.target.checked } })} />{key}</label>
                ))}
                <Field label="Participant limit"><input type="number" className={ui.input} value={form.eligibility.participantLimit} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, participantLimit: e.target.value } })} /></Field>
                <Field label="Allowed states"><input className={ui.input} value={form.eligibility.allowedStates} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedStates: e.target.value } })} /></Field>
                <Field label="Allowed districts"><input className={ui.input} value={form.eligibility.allowedDistricts} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedDistricts: e.target.value } })} /></Field>
                <Field label="Ranking priority"><input className={ui.input} value={form.leaderboard.rankingPriority} onChange={(e) => setForm({ ...form, leaderboard: { ...form.leaderboard, rankingPriority: e.target.value } })} /></Field>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving}>{saving ? "Saving..." : "Save competition"}</button>
            </form>
          )}

          {tab === "participants" && <DataTable rows={participants.map((item) => ({ id: item.registration.id, name: item.user?.name || item.user?.email || "Learner", status: item.registration.status, state: item.registration.state, district: item.registration.district }))} columns={["name", "status", "state", "district"]} />}
          {tab === "leaderboard" && <div className="space-y-4"><div className="flex flex-wrap gap-2"><button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={refreshLeaderboard}><RefreshCw size={16} />Refresh ranking</button>{selectedId ? <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={nationalCompetitionService.exportUrl(selectedId, "excel")}><Download size={16} />Excel</a> : null}{selectedId ? <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={nationalCompetitionService.exportUrl(selectedId, "pdf")}><Download size={16} />PDF</a> : null}</div><DataTable rows={leaderboard} columns={["rank", "userName", "score", "accuracy", "state", "district"]} /></div>}
          {tab === "rewards" && <PanelList action="Add reward" onAction={createReward} rows={rewards} columns={["title", "rewardType", "rankFrom", "rankTo", "approvalStatus"]} />}
          {tab === "reports" && <Reports reports={reports} />}
          {tab === "notifications" && <PanelList action="Add notification" onAction={createNotification} rows={notifications} columns={["title", "channel", "audience", "eventKey", "status"]} />}
          {tab === "audit" && <DataTable rows={auditLogs} columns={["action", "actorRole", "actorId", "createdAt"]} />}
        </main>
      </div>
    </div>
  );
}
