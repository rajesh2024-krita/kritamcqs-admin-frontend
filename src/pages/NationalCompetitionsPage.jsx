import { useEffect, useMemo, useState } from "react";
import { Award, Bell, CalendarDays, Check, Download, FileText, Filter, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Trophy, Users, X, Plus, Edit, Trash2, Eye, Clock, MapPin, User, Mail, Phone, Globe, Calendar, BarChart, TrendingUp, Award as AwardIcon, Crown, Star, Zap, Layers, BookOpen, Link, ExternalLink } from "lucide-react";
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
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
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

// Compact Field Component
function Field({ label, children, wide }) {
  return (
    <div className={cn("flex flex-col gap-0.5", wide && "sm:col-span-2")}>
      {label && <label className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">{label}</label>}
      {children}
    </div>
  );
}

// Compact DateTime Field
function DateTimeField({ label, name, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="datetime-local"
        className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        name={name}
        value={value || ""}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </Field>
  );
}

// Compact Metric Card
function Metric({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
      <div className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-base font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

// Compact Data Table
function DataTable({ rows, columns, title }) {
  if (!rows?.length) return <EmptyState title="No data" description="Records will appear here as the competition runs." />;
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
      {title && (
        <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[10px] font-semibold text-slate-600">{title}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-2.5 py-1.5 text-left">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{column}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((column) => (
                  <td key={column} className="px-2.5 py-1.5 text-[10px] text-slate-700">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PanelList({ action, onAction, rows, columns }) {
  return (
    <div className="space-y-3">
      <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={onAction}>
        <Plus size={12} />
        {action}
      </button>
      <DataTable rows={rows} columns={columns} />
    </div>
  );
}

function Reports({ reports }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Registrations" value={reports?.participation?.registrations || 0} />
        <Metric label="Submitted" value={reports?.participation?.submitted || 0} />
        <Metric label="Average Marks" value={reports?.averageMarks || 0} />
      </div>
      <DataTable rows={reports?.statePerformance || []} columns={["_id", "averageMarks", "participants"]} title="State Performance" />
      <DataTable rows={reports?.topPerformers || []} columns={["rank", "userName", "score", "state", "district"]} title="Top Performers" />
    </div>
  );
}

// Compact Banner Editor
function BannerEditor({ form, setForm }) {
  const banner = form.banner || defaultForm.banner;
  const update = (patch) => setForm((current) => ({ ...current, banner: { ...current.banner, ...patch } }));
  return (
    <section className="bg-slate-50 rounded-lg border border-slate-200/50 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-indigo-600" />
          <span className="text-xs font-semibold text-slate-900">Competition Banner</span>
        </div>
        <label className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
          <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={banner.enabled !== false} onChange={(event) => update({ enabled: event.target.checked })} />
          Banner enabled
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Test name"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.testName} onChange={(e) => update({ testName: e.target.value })} /></Field>
        <Field label="Background image"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.backgroundImageUrl} onChange={(e) => update({ backgroundImageUrl: e.target.value })} /></Field>
        <Field label="Background color"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.backgroundColor} onChange={(e) => update({ backgroundColor: e.target.value })} /></Field>
        <Field label="Text color"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.textColor} onChange={(e) => update({ textColor: e.target.value })} /></Field>
        <Field label="Button color"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.buttonColor} onChange={(e) => update({ buttonColor: e.target.value })} /></Field>
        <Field label="Button text"><input className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.ctaText} onChange={(e) => update({ ctaText: e.target.value })} /></Field>
        <Field label="Button action">
          <select className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={banner.buttonAction} onChange={(e) => update({ buttonAction: e.target.value })}>
            <option value="register">Register</option>
            <option value="view_details">View Details</option>
            <option value="join_test">Join Test</option>
          </select>
        </Field>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
            <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={banner.countdownEnabled !== false} onChange={(event) => update({ countdownEnabled: event.target.checked })} />
            Countdown
          </label>
        </div>
      </div>
      <div
        className="rounded-lg p-3 min-h-[80px] bg-cover bg-center"
        style={{
          backgroundColor: banner.backgroundColor,
          backgroundImage: banner.backgroundImageUrl ? `linear-gradient(${banner.overlayColor}, ${banner.overlayColor}), url(${banner.backgroundImageUrl})` : `linear-gradient(${banner.overlayColor}, ${banner.overlayColor})`,
          color: banner.textColor,
        }}
      >
        <div className="text-[8px] font-bold uppercase opacity-80">Preview</div>
        <div className="text-sm font-bold mt-1">{banner.testName || form.title || "Weekly All India Mock Test"}</div>
        <button type="button" className="mt-2 rounded px-3 py-1 text-[10px] font-bold" style={{ backgroundColor: banner.buttonColor, color: banner.buttonTextColor }}>
          {banner.ctaText || "View Details"}
        </button>
      </div>
    </section>
  );
}

// Compact Question Selection Panel
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
    <section className="bg-slate-50 rounded-lg border border-slate-200/50 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-600" />
          <span className="text-xs font-semibold text-slate-900">Question Configuration</span>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {["manual", "automatic"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateQuestionSelection({ mode: item })}
              className={cn("rounded-md px-2 py-0.5 text-[9px] font-medium uppercase transition", mode === item ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        <FilterInput label="Search" value={questionFilters.search} onChange={(value) => setFilter("search", value)} placeholder="Search..." />
        <FilterSelect label="Exam" value={questionFilters.examType} onChange={(value) => setFilter("examType", value)} options={[["BOTH", "Both"], ["NEET", "NEET"], ["JEE", "JEE"]]} />
        <FilterSelect label="Subject" value={questionFilters.subjectId} onChange={(value) => setFilter("subjectId", value)} options={selectOptions.subjects.map((item) => [item.id, item.name])} />
        <FilterSelect label="Chapter" value={questionFilters.chapterId} onChange={(value) => setFilter("chapterId", value)} options={selectOptions.chapters.map((item) => [item.id, item.name])} />
        <FilterSelect label="Topic" value={questionFilters.topicId} onChange={(value) => setFilter("topicId", value)} options={selectOptions.topics.map((item) => [item.id, item.name])} />
        <FilterSelect label="Year" value={questionFilters.yearId} onChange={(value) => setFilter("yearId", value)} options={selectOptions.years.map((item) => [item.id, item.year || item.label || item.name])} />
        <FilterSelect label="Difficulty" value={questionFilters.difficultyId} onChange={(value) => setFilter("difficultyId", value)} options={selectOptions.difficulties.map((item) => [item.id, item.name || item.key])} />
        <FilterSelect label="Type" value={questionFilters.questionTypeId} onChange={(value) => setFilter("questionTypeId", value)} options={selectOptions.questionTypes.map((item) => [item.id, item.name || item.label || item.key])} />
        <FilterSelect label="Response" value={questionFilters.responseType} onChange={(value) => setFilter("responseType", value)} options={[["single", "Single"], ["multiple", "Multiple"], ["numeric", "Numeric"]]} />
        <FilterSelect label="Status" value={questionFilters.questionStatus} onChange={(value) => setFilter("questionStatus", value)} options={[["complete", "Complete"], ["incomplete", "Incomplete"]]} />
        <FilterSelect label="Review" value={questionFilters.reviewStatus} onChange={(value) => setFilter("reviewStatus", value)} options={[["ready", "Ready"], ["needs_review", "Needs review"]]} />
        <div className="flex items-end">
          <label className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600">
            <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={questionFilters.visibleOnly !== false} onChange={(event) => setFilter("visibleOnly", event.target.checked)} />
            Visible
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-medium rounded transition-colors" onClick={() => loadQuestionPool(questionFilters)}>
          <Filter size={10} />
          Apply Filters
        </button>
        <button type="button" className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-medium rounded transition-colors" onClick={applyAutoFiltersFromPicker}>
          <Sparkles size={10} />
          Use for Auto
        </button>
        <span className="text-[9px] text-slate-500">Pool: {questionPoolMeta?.total || 0} | Selected: {selectedQuestionIds.length}</span>
        {mode === "automatic" && (
          <label className="flex items-center gap-1 text-[9px] text-slate-600">
            Auto count
            <input
              type="number"
              className="w-16 px-1 py-0.5 text-[9px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={form.questionSelection?.targetCount || form.totalQuestions || 180}
              onChange={(event) => updateQuestionSelection({ targetCount: Number(event.target.value || 0) })}
            />
          </label>
        )}
      </div>

      {mode === "automatic" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[10px] text-emerald-900">
          <div className="font-semibold">Automatic selection active</div>
          <p>Will select {form.questionSelection?.targetCount || form.totalQuestions || 0} questions matching saved filters.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_120px_100px] gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
          <span>Select</span><span>Question</span><span>Category</span><span>Status</span>
        </div>
        {questionPoolLoading ? (
          <div className="p-3"><LoadingSpinner /></div>
        ) : questionPool.length ? (
          <div className="max-h-[300px] overflow-y-auto">
            {questionPool.map((question) => {
              const id = question.id || question._id;
              const checked = selectedSet.has(String(id));
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => mode === "manual" && toggleQuestion(id)}
                  className={cn("grid w-full grid-cols-[40px_1fr_120px_100px] gap-2 border-b border-slate-100 px-2 py-1.5 text-left transition hover:bg-slate-50", checked && "bg-indigo-50", mode === "automatic" && "cursor-default")}
                >
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded border", checked ? "border-indigo-300 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-400")}>
                    {checked ? <Check size={10} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[10px] font-medium text-slate-900">{question.question}</span>
                    <span className="text-[8px] text-slate-500">{question.responseType || "single"}</span>
                  </span>
                  <span className="text-[9px] text-slate-600 truncate">{question.subjectId?.name || "Subject"}</span>
                  <span className="text-[8px] text-slate-500">{question.questionStatus}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3"><EmptyState title="No questions found" description="Adjust filters to find questions." /></div>
        )}
      </div>

      {selectedQuestionIds.length > 0 && mode === "manual" && (
        <div className="bg-white rounded-lg border border-slate-200 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Selected ({selectedQuestionIds.length})</span>
            <button type="button" className="text-[8px] text-rose-600 hover:text-rose-700 font-medium" onClick={() => setManualQuestionIds([])}>
              <X size={10} className="inline" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1 max-h-16 overflow-y-auto">
            {selectedQuestionIds.map((id) => (
              <button key={id} type="button" onClick={() => toggleQuestion(id)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[8px] font-medium text-indigo-700">
                {id.slice(-6)} <X size={8} className="inline" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FilterInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      <input className="w-full px-1.5 py-0.5 text-[9px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      <select className="w-full px-1.5 py-0.5 text-[9px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {(options || []).map(([id, name]) => <option key={id || name} value={id}>{name || id}</option>)}
      </select>
    </div>
  );
}

const participantStatusOptions = [
  ["all", "All"],
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["locked", "Locked"],
  ["cancelled", "Cancelled"],
];

function statusPillClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (normalized === "rejected" || normalized === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
  if (normalized === "locked") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function ParticipantsApprovalPanel({ participants, attendance, statusFilter, onStatusFilter, onChangeStatus, selected }) {
  const rows = participants.map((item) => {
    const registration = item.registration || {};
    const user = item.user || {};
    return {
      registration,
      id: registration.id || registration._id,
      name: user.name || user.email || "Learner",
      email: user.email || "",
      mobile: user.mobile || "",
      premium: user.isPremium ? "Premium" : "Free",
      status: registration.status || "pending",
      state: registration.state || "",
      district: registration.district || "",
      deviceId: registration.deviceId || "",
      registeredAt: registration.createdAt || "",
    };
  });
  const pendingCount = rows.filter((row) => row.status === "pending").length;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-indigo-600" />
            <div>
              <span className="text-xs font-semibold text-slate-900">Participant Approval</span>
              <p className="text-[9px] text-slate-500">
                {pendingCount ? `${pendingCount} registration${pendingCount === 1 ? "" : "s"} waiting` : "No pending registrations"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">Status:</span>
            <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
              {participantStatusOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-2.5 py-1.5 text-left"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">User</span></th>
                <th className="px-2.5 py-1.5 text-left"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Status</span></th>
                <th className="px-2.5 py-1.5 text-left"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Location</span></th>
                <th className="px-2.5 py-1.5 text-left"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Device</span></th>
                <th className="px-2.5 py-1.5 text-right"><span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2.5 py-1.5">
                    <div className="text-[10px] font-semibold text-slate-900">{row.name}</div>
                    <div className="text-[8px] text-slate-500">{row.email || row.mobile || "-"}</div>
                    <span className="inline-flex px-1 py-0.5 text-[7px] font-medium rounded bg-slate-100 text-slate-600">{row.premium}</span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className={cn("inline-flex px-1.5 py-0.5 text-[8px] font-medium rounded border", statusPillClass(row.status))}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="text-[9px] text-slate-700">{row.state || "-"}</div>
                    <div className="text-[8px] text-slate-400">{row.district || "-"}</div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="text-[8px] text-slate-400 font-mono">{row.deviceId ? row.deviceId.slice(0, 12) + "..." : "-"}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button disabled={row.status === "approved"} className={cn("p-0.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-30", row.status === "approved" && "cursor-not-allowed")} onClick={() => onChangeStatus(row.id, "approved")}>
                        <Check size={12} />
                      </button>
                      <button disabled={row.status === "rejected"} className={cn("p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30", row.status === "rejected" && "cursor-not-allowed")} onClick={() => onChangeStatus(row.id, "rejected")}>
                        <X size={12} />
                      </button>
                      <button disabled={row.status === "locked"} className={cn("p-0.5 text-sky-600 hover:bg-sky-50 rounded transition-colors disabled:opacity-30", row.status === "locked" && "cursor-not-allowed")} onClick={() => onChangeStatus(row.id, "locked")}>
                        <Lock size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
  const [participantStatusFilter, setParticipantStatusFilter] = useState("all");
  const [leaderboard, setLeaderboard] = useState([]);
  const [reports, setReports] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [disqualified, setDisqualified] = useState([]);
  const [deviceLogs, setDeviceLogs] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [rankingHistory, setRankingHistory] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
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
      const [dashboardResponse, listResponse, calendarResponse] = await Promise.all([
        nationalCompetitionService.dashboard(),
        nationalCompetitionService.list({ search }),
        nationalCompetitionService.calendar().catch(() => ({ data: [] })),
      ]);
      const nextItems = listResponse.data || [];
      setDashboard(dashboardResponse.data);
      setItems(nextItems);
      setCalendarItems(calendarResponse.data || []);
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
      const [detailResponse, participantsResponse, leaderboardResponse, reportsResponse, rewardsResponse, notificationsResponse, auditResponse, analyticsResponse, attendanceResponse, disqualifiedResponse, deviceResponse, snapshotResponse, rankingHistoryResponse] = await Promise.all([
        nationalCompetitionService.get(id),
        nationalCompetitionService.participants(id, { status: participantStatusFilter }),
        nationalCompetitionService.leaderboard(id),
        nationalCompetitionService.reports(id),
        nationalCompetitionService.rewards(id),
        nationalCompetitionService.notifications(id),
        nationalCompetitionService.auditLogs({ competitionId: id }),
        nationalCompetitionService.analytics(id).catch(() => ({ data: null })),
        nationalCompetitionService.attendance(id).catch(() => ({ data: [] })),
        nationalCompetitionService.disqualified(id).catch(() => ({ data: [] })),
        nationalCompetitionService.deviceLogs(id).catch(() => ({ data: null })),
        nationalCompetitionService.leaderboardSnapshots(id).catch(() => ({ data: [] })),
        nationalCompetitionService.rankingHistory(id).catch(() => ({ data: [] })),
      ]);
      setDetail(detailResponse.data);
      setForm(toForm(detailResponse.data.competition));
      setParticipants(participantsResponse.data || []);
      setLeaderboard(leaderboardResponse.data || []);
      setReports(reportsResponse.data || null);
      setAnalytics(analyticsResponse.data || null);
      setAttendance(attendanceResponse.data || []);
      setDisqualified(disqualifiedResponse.data || []);
      setDeviceLogs(deviceResponse.data || null);
      setSnapshots(snapshotResponse.data || []);
      setRankingHistory(rankingHistoryResponse.data || []);
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
  }, [selectedId, participantStatusFilter]);

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

  async function updateParticipantStatus(registrationId, status) {
    if (!registrationId) return;
    try {
      await nationalCompetitionService.updateParticipant(registrationId, { status });
      toast.success(`Participant ${status}`);
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function duplicateCompetition() {
    if (!selectedId) return;
    try {
      const response = await nationalCompetitionService.duplicate(selectedId);
      toast.success("Competition duplicated as draft");
      setSelectedId(response.data.id);
      setTab("setup");
      await loadBase();
      await loadDetail(response.data.id);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function previewCompetition() {
    if (!selectedId) return;
    try {
      const response = await nationalCompetitionService.preview(selectedId);
      const preview = response.data;
      window.alert(`${preview.title}\n${preview.examType} | ${preview.totalQuestions} Questions | ${preview.durationMinutes} Min\nStarts: ${preview.startsAt}`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function updateFormField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (loading) return <LoadingSpinner label="Loading..." />;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Trophy size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">National Competitions</h1>
              <p className="text-xs text-slate-500">Manage national leaderboard mock tests</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="pl-7 pr-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-40" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." />
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors" onClick={loadBase}>
              <RefreshCw size={10} /> Refresh
            </button>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded transition-colors shadow-sm shadow-indigo-500/25" onClick={() => { setSelectedId(""); setDetail(null); setForm(defaultForm); setTab("setup"); }}>
              <Plus size={10} /> New
            </button>
          </div>
        </div>
        {selectedId && (
          <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-100">
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-medium rounded transition-colors" onClick={() => lifecycleAction("publish")}>
              <Check size={8} /> Publish
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-medium rounded transition-colors" onClick={() => lifecycleAction("enable")}>
              <Zap size={8} /> Enable
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-medium rounded transition-colors" onClick={() => lifecycleAction("disable")}>
              Disable
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-medium rounded transition-colors" onClick={() => lifecycleAction("archive")}>
              Archive
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-medium rounded transition-colors" onClick={duplicateCompetition}>
              Duplicate
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[8px] font-medium rounded transition-colors" onClick={previewCompetition}>
              <Eye size={8} /> Preview
            </button>
            <button className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[8px] font-medium rounded transition-colors" onClick={deleteCompetition}>
              <Trash2 size={8} /> Delete
            </button>
            <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-medium text-slate-600">
              {selected?.isPublished ? "Published" : "Draft"} | {selected?.isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium rounded transition-colors", tab === key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")} onClick={() => setTab(key)}>
              <Icon size={10} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-900 mb-2">Competitions</div>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {items.length ? items.map((item) => (
              <button key={item.id} className={cn("w-full rounded-lg border p-2 text-left transition-all", selectedId === item.id ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50")} onClick={() => setSelectedId(item.id)}>
                <div className="text-[10px] font-semibold text-slate-900 truncate">{item.title}</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className="inline-flex px-1 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">{item.status}</span>
                  <span className="inline-flex px-1 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[7px] font-medium">{item.examType}</span>
                </div>
              </button>
            )) : <EmptyState title="No competitions" description="Create the first one." />}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 space-y-3">
          {tab === "overview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <Metric label="Total" value={dashboard?.summary?.total || 0} />
                <Metric label="Live" value={dashboard?.summary?.live || 0} />
                <Metric label="Upcoming" value={dashboard?.summary?.upcoming || 0} />
                <Metric label="Registrations" value={dashboard?.summary?.registrations || 0} />
                <Metric label="Submissions" value={dashboard?.summary?.submissions || 0} />
                <Metric label="Top Entries" value={dashboard?.summary?.topRankedEntries || 0} />
              </div>
              {analytics && (
                <div className="grid grid-cols-5 gap-2">
                  <Metric label="Attended" value={analytics.totals?.attended || 0} />
                  <Metric label="Disqualified" value={analytics.totals?.disqualified || 0} />
                  <Metric label="Pending Rewards" value={analytics.totals?.pendingRewards || 0} />
                  <Metric label="Submitted" value={analytics.totals?.submitted || 0} />
                  <Metric label="Registered" value={analytics.totals?.registrations || 0} />
                </div>
              )}
              <DataTable rows={dashboard?.recentLeaderboard || []} columns={["rank", "userName", "score", "state", "district"]} title="Recent Leaderboard" />
            </div>
          )}

          {tab === "setup" && (
            <form className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm space-y-3" onSubmit={saveCompetition}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Title"><input className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Exam Type"><select className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}><option>BOTH</option><option>NEET</option><option>JEE</option></select></Field>
                <DateTimeField label="Registration Opens" name="registrationOpensAt" value={form.registrationOpensAt} onChange={updateFormField} />
                <DateTimeField label="Registration Closes" name="registrationClosesAt" value={form.registrationClosesAt} onChange={updateFormField} />
                <DateTimeField label="Starts" name="startsAt" value={form.startsAt} onChange={updateFormField} />
                <DateTimeField label="Ends" name="endsAt" value={form.endsAt} onChange={updateFormField} />
                <Field label="Duration (min)"><input type="number" className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></Field>
                <Field label="Total Questions"><input type="number" className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.totalQuestions} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} /></Field>
                <Field label="Description" wide><textarea className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[40px]" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              </div>

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

              <BannerEditor form={form} setForm={setForm} />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Field label="Rules" wide><textarea className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[40px]" rows={2} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></Field>
                <Field label="Terms" wide><textarea className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[40px]" rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {["premiumRequired", "approvalRequired"].map((key) => (
                  <label key={key} className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600">
                    <input type="checkbox" className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500/20" checked={Boolean(form.eligibility[key])} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, [key]: e.target.checked } })} />
                    {key}
                  </label>
                ))}
                <Field label="Participant Limit"><input type="number" className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.eligibility.participantLimit} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, participantLimit: e.target.value } })} /></Field>
                <Field label="Allowed States"><input className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.eligibility.allowedStates} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedStates: e.target.value } })} /></Field>
                <Field label="Allowed Districts"><input className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.eligibility.allowedDistricts} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedDistricts: e.target.value } })} /></Field>
                <Field label="Ranking Priority"><input className="w-full px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={form.leaderboard.rankingPriority} onChange={(e) => setForm({ ...form, leaderboard: { ...form.leaderboard, rankingPriority: e.target.value } })} /></Field>
              </div>

              <button className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25 disabled:opacity-50" disabled={saving}>
                {saving ? "Saving..." : "Save Competition"}
              </button>
            </form>
          )}

          {tab === "participants" && (
            <ParticipantsApprovalPanel
              participants={participants}
              attendance={attendance}
              statusFilter={participantStatusFilter}
              onStatusFilter={setParticipantStatusFilter}
              onChangeStatus={updateParticipantStatus}
              selected={selected}
            />
          )}

          {tab === "leaderboard" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-medium rounded transition-colors" onClick={refreshLeaderboard}>
                  <RefreshCw size={10} /> Refresh
                </button>
                {selectedId && (
                  <>
                    <a className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-medium rounded transition-colors" href={nationalCompetitionService.exportUrl(selectedId, "excel")}>
                      <Download size={10} /> Excel
                    </a>
                    <a className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-medium rounded transition-colors" href={nationalCompetitionService.exportUrl(selectedId, "pdf")}>
                      <Download size={10} /> PDF
                    </a>
                    <a className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-medium rounded transition-colors" href={nationalCompetitionService.exportUrl(selectedId, "csv")}>
                      <Download size={10} /> CSV
                    </a>
                    <a className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-medium rounded transition-colors" href={nationalCompetitionService.exportUrl(selectedId, "print")} target="_blank" rel="noreferrer">
                      <ExternalLink size={10} /> Print
                    </a>
                  </>
                )}
              </div>
              <DataTable rows={leaderboard} columns={["rank", "userName", "score", "accuracy", "state", "district"]} title="Leaderboard" />
              <DataTable rows={snapshots} columns={["scope", "periodKey", "entries", "topScore", "refreshedAt"]} title="Snapshots" />
              <DataTable rows={rankingHistory} columns={["action", "actorRole", "createdAt"]} title="Ranking History" />
            </div>
          )}

          {tab === "rewards" && <PanelList action="Add Reward" onAction={createReward} rows={rewards} columns={["title", "rewardType", "rankFrom", "rankTo", "approvalStatus"]} />}
          {tab === "reports" && <Reports reports={reports} />}
          {tab === "security" && (
            <div className="space-y-3">
              <DataTable rows={disqualified} columns={["userId", "status", "score", "suspiciousFlags", "updatedAt"]} title="Disqualified" />
              <DataTable rows={deviceLogs?.registrations || []} columns={["userId", "deviceId", "state", "district", "updatedAt"]} title="Device Registrations" />
              <DataTable rows={deviceLogs?.attempts || []} columns={["userId", "deviceId", "ipAddress", "suspiciousFlags", "startedAt", "submittedAt"]} title="Device Attempts" />
            </div>
          )}
          {tab === "calendar" && <DataTable rows={calendarItems} columns={["title", "status", "examType", "startsAt", "isPublished", "isEnabled"]} title="Calendar" />}
          {tab === "notifications" && <PanelList action="Add Notification" onAction={createNotification} rows={notifications} columns={["title", "channel", "audience", "eventKey", "status"]} />}
          {tab === "audit" && <DataTable rows={auditLogs} columns={["action", "actorRole", "actorId", "createdAt"]} title="Audit Logs" />}
        </main>
      </div>
    </div>
  );
}