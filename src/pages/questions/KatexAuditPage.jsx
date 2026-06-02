import { Fragment, useEffect, useMemo, useState } from "react";
import { katexAuditService } from "../../api/katexAuditService";
import { subjectService } from "../../api/subjectService";
import { chapterService } from "../../api/chapterService";
import { topicService } from "../../api/topicService";
import { questionTypeService } from "../../api/questionTypeService";
import { MathText } from "../../components/common/MathText";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Pagination } from "../../components/tables/Pagination";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const STATUS_OPTIONS = ["", "PENDING", "PASS", "KATEX_ISSUE"];
const ISSUE_TYPES = ["", "formula", "answer", "explanation", "ocr", "katex", "grammar", "option", "science"];
const AI_STATUSES = ["", "PASS", "KATEX_ISSUE", "MINOR_ISSUE", "ANSWER_MISMATCH", "EXPLANATION_MISMATCH", "QUESTION_ERROR", "CRITICAL"];
const PAGE_SIZES = [10, 25, 50, 100, 250, 500, 750, 1000];

async function listLookup(service, params = {}) {
  const response = await service.list({ page: 1, limit: 1000, ...params });
  return response?.data || [];
}

function statusClass(status) {
  if (status === "PASS") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "FAILED") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
}

function recordId(item) {
  return String(item?.id || item?._id || "");
}

function relationId(value) {
  if (!value) return "";
  if (typeof value === "object") return String(value.id || value._id || "");
  return String(value);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

function metric(label, value, tone = "text-slate-950") {
  return (
    <div className={ui.metricCard}>
      <div className={ui.metricLabel}>{label}</div>
      <div className={cn("text-2xl font-black", tone)}>{value || 0}</div>
    </div>
  );
}

export function KatexAuditPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState({});
  const [aiSummary, setAiSummary] = useState({});
  const [lookups, setLookups] = useState({ subjects: [], chapters: [], topics: [], questionTypes: [] });
  const [filters, setFilters] = useState({ page: 1, limit: 20, subjectId: "", chapterId: "", topicId: "", questionTypeId: "", status: "", search: "" });
  const [customLimit, setCustomLimit] = useState("");
  const [activeTab, setActiveTab] = useState("questions");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState("");
  const [aiJob, setAiJob] = useState(null);
  const [findings, setFindings] = useState([]);
  const [findingsMeta, setFindingsMeta] = useState(null);
  const [findingFilter, setFindingFilter] = useState({ issueType: "", auditStatus: "" });
  const [issueTypes, setIssueTypes] = useState([]);
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyMeta, setHistoryMeta] = useState(null);
  const [expandedFinding, setExpandedFinding] = useState("");
  const [editingFinding, setEditingFinding] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const filteredChapters = useMemo(
    () => lookups.chapters.filter((item) => !filters.subjectId || relationId(item.subjectId) === String(filters.subjectId)),
    [lookups.chapters, filters.subjectId],
  );
  const filteredTopics = useMemo(
    () => lookups.topics.filter((item) => (
      (!filters.subjectId || relationId(item.subjectId) === String(filters.subjectId))
      && (!filters.chapterId || relationId(item.chapterId) === String(filters.chapterId))
    )),
    [lookups.topics, filters.subjectId, filters.chapterId],
  );

  async function loadData(nextFilters = filters) {
    setLoading(true);
    try {
      const [response, summaryResponse] = await Promise.all([
        katexAuditService.questions(nextFilters),
        katexAuditService.aiSummary(),
      ]);
      setRows(response.data || []);
      setMeta(response.meta || null);
      setSummary(response.summary || {});
      setAiSummary(summaryResponse.data || {});
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }

  function findingParams(status = activeTab === "preview" ? "approved" : "pending", nextFilter = findingFilter) {
    return {
      page: filters.page,
      limit: filters.limit,
      subjectId: filters.subjectId || undefined,
      chapterId: filters.chapterId || undefined,
      topicId: filters.topicId || undefined,
      questionTypeId: filters.questionTypeId || undefined,
      search: filters.search || undefined,
      issueType: nextFilter.issueType || undefined,
      auditStatus: nextFilter.auditStatus || filters.status || undefined,
      status,
    };
  }

  async function loadFindings(nextFilter = findingFilter, status = activeTab === "preview" ? "approved" : "pending") {
    const params = findingParams(status, nextFilter);
    const [response, summaryResponse, issueTypeResponse] = await Promise.all([
      katexAuditService.aiFindings(params),
      katexAuditService.aiSummary(),
      katexAuditService.issueTypes(params),
    ]);
    setFindings(response.data || []);
    setFindingsMeta(response.meta || null);
    setAiSummary(summaryResponse.data || {});
    setIssueTypes(issueTypeResponse.data || []);
    setSelectedFindings([]);
  }

  async function loadHistory(params = {}) {
    const response = await katexAuditService.aiFixHistory(params);
    setHistoryRows(response.data || []);
    setHistoryMeta(response.meta || null);
  }

  useEffect(() => {
    Promise.all([
      listLookup(subjectService),
      listLookup(chapterService),
      listLookup(topicService),
      listLookup(questionTypeService),
    ]).then(([subjects, chapters, topics, questionTypes]) => {
      setLookups({ subjects, chapters, topics, questionTypes });
    });
  }, []);

  useEffect(() => {
    if (activeTab === "questions") void loadData(filters);
    if (activeTab === "draft") void loadFindings(findingFilter, "pending");
    if (activeTab === "preview") void loadFindings(findingFilter, "approved");
  }, [activeTab, filters.page, filters.limit, filters.subjectId, filters.chapterId, filters.topicId, filters.questionTypeId, filters.status, filters.search]);

  useEffect(() => {
    if (activeTab === "draft") void loadFindings(findingFilter, "pending");
    if (activeTab === "preview") void loadFindings(findingFilter, "approved");
  }, [activeTab, findingFilter.issueType, findingFilter.auditStatus]);

  useEffect(() => {
    if (activeTab === "history") void loadHistory({ page: historyMeta?.page || 1, limit: 20 });
  }, [activeTab]);

  useEffect(() => {
    if (!aiJob?.id && !aiJob?._id) return undefined;
    if (!["queued", "processing"].includes(aiJob.status)) return undefined;
    const jobId = aiJob.id || aiJob._id;
    const timer = window.setInterval(async () => {
      const response = await katexAuditService.aiJob(jobId);
      setAiJob(response.data);
      if (!["queued", "processing"].includes(response.data?.status)) {
        await loadFindings(findingFilter, "pending");
        window.clearInterval(timer);
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [aiJob?.id, aiJob?._id, aiJob?.status]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      page: 1,
      [name]: value,
      ...(name === "subjectId" ? { chapterId: "", topicId: "" } : {}),
      ...(name === "chapterId" ? { topicId: "" } : {}),
    }));
  }

  function toggleSelected(questionId) {
    setSelected((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  }

  function toggleAll() {
    setSelected((current) => current.length === rows.length ? [] : rows.map((row) => row.questionId));
  }

  function toggleFinding(findingId) {
    setSelectedFindings((current) => current.includes(findingId) ? current.filter((id) => id !== findingId) : [...current, findingId]);
  }

  function toggleAllFindings() {
    setSelectedFindings((current) => current.length === findings.length ? [] : findings.map((row) => recordId(row)));
  }

  async function runAction(action) {
    if (action !== "scan" && !selected.length) {
      toast.info("Select at least one audit row first.");
      return;
    }
    setBusy(true);
    try {
      if (action === "scan") {
        const response = filters.subjectId ? await katexAuditService.scanBySubject(filters.subjectId) : await katexAuditService.scanAll();
        toast.success(`Scanned ${response.data?.processed || 0} questions.`);
      }
      if (action === "review") {
        const response = await katexAuditService.markReviewed(selected);
        toast.success(`Marked ${response.data?.reviewed || 0} questions reviewed.`);
      }
      if (action === "aiScan") {
        const response = await katexAuditService.aiScan(selected);
        setAiJob(response.data);
        setActiveTab("draft");
        toast.success(`AI audit queued for ${response.data?.total || selected.length} questions.`);
      }
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "KaTeX audit action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function aiFixDraft() {
    if (!selectedFindings.length) {
      toast.info("Select draft rows first.");
      return;
    }
    setBusy(true);
    try {
      const response = await katexAuditService.approveFindings(selectedFindings);
      toast.success(`Moved ${response.data?.approved || 0} corrected rows to Preview.`);
      await loadFindings(findingFilter, "pending");
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "AI fix failed.");
    } finally {
      setBusy(false);
    }
  }

  async function applyApprovedFixes() {
    if (!selectedFindings.length) {
      toast.info("Select approved AI findings first.");
      return;
    }
    setBusy(true);
    try {
      const response = await katexAuditService.applyApprovedFixes(selectedFindings);
      toast.success(`Applied ${response.data?.applied || 0} approved fixes.`);
      await loadFindings(findingFilter, "approved");
      await loadHistory();
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Apply approved fixes failed.");
    } finally {
      setBusy(false);
    }
  }

  async function rejectAIFixes() {
    if (!selectedFindings.length) return;
    setBusy(true);
    try {
      const response = await katexAuditService.rejectFindings(selectedFindings);
      toast.success(`Rolled back ${response.data?.rejected || 0} preview rows.`);
      await loadFindings(findingFilter, activeTab === "preview" ? "approved" : "pending");
    } finally {
      setBusy(false);
    }
  }

  async function refixSelected() {
    if (!selectedFindings.length) return;
    setBusy(true);
    try {
      const response = await katexAuditService.refixFindings(selectedFindings);
      toast.success(`Moved ${response.data?.movedToDraft || 0} rows back to Draft.`);
      await loadFindings(findingFilter, "approved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Re-fix failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveFindingEdit() {
    if (!editingFinding?.id) return;
    setBusy(true);
    try {
      await katexAuditService.editFinding(editingFinding.id, {
        suggestedValue: editingFinding.suggestedValue,
        description: editingFinding.description,
      });
      toast.success("Draft suggestion updated.");
      setEditingFinding(null);
      await loadFindings(findingFilter, activeTab === "preview" ? "approved" : "pending");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Draft update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function rollback(historyId) {
    setBusy(true);
    try {
      await katexAuditService.rollbackFix(historyId);
      toast.success("Rollback completed.");
      await loadHistory();
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rollback failed.");
    } finally {
      setBusy(false);
    }
  }

  const exportParams = {
    subjectId: filters.subjectId || undefined,
    chapterId: filters.chapterId || undefined,
    topicId: filters.topicId || undefined,
    questionTypeId: filters.questionTypeId || undefined,
    status: filters.status || undefined,
  };
  const currentFindingExportParams = findingParams(activeTab === "preview" ? "approved" : "pending");
  const filteredCount = meta?.total || 0;
  const shownCount = rows.length;
  const totalCount = summary.totalQuestions || 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">AI Academic Audit Center</h2>
          <p className={ui.muted}>Analyze questions, review AI drafts, preview corrected content, and apply approved formatting fixes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy} onClick={() => runAction("scan")} type="button">
            {busy ? "Processing..." : filters.subjectId ? "Fast Scan Subject" : "Fast Scan All"}
          </button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.export("csv", exportParams)} type="button">Export CSV</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.export("xlsx", exportParams)} type="button">Export XLSX</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metric("Total Questions", aiSummary.totalQuestions || summary.totalQuestions)}
        {metric("Audited Questions", aiSummary.auditedQuestions, "text-blue-700")}
        {metric("Draft Questions", aiSummary.draftQuestions, "text-amber-700")}
        {metric("Fixed Questions", aiSummary.fixedQuestions, "text-emerald-700")}
        {metric("Approved Questions", aiSummary.approvedQuestions, "text-emerald-700")}
        {metric("Rollback Count", aiSummary.rollbackCount, "text-rose-700")}
        {metric("Processing Queue", aiSummary.processingQueueCount, "text-slate-700")}
        {metric("KaTeX Issues", summary.katexIssue, "text-amber-700")}
        {metric("Answer Mismatch", aiSummary.answerMismatch, "text-rose-700")}
        {metric("Critical Review", aiSummary.critical, "text-rose-700")}
      </div>

      <div className={ui.panel}>
        <div className="grid gap-3 md:grid-cols-7">
          <select className={ui.input} value={filters.subjectId} onChange={(event) => updateFilter("subjectId", event.target.value)}>
            <option value="">All Subjects</option>
            {lookups.subjects.map((item) => <option key={recordId(item)} value={recordId(item)}>{item.name}</option>)}
          </select>
          <select className={ui.input} value={filters.chapterId} onChange={(event) => updateFilter("chapterId", event.target.value)}>
            <option value="">All Chapters</option>
            {filteredChapters.map((item) => <option key={recordId(item)} value={recordId(item)}>{item.name}</option>)}
          </select>
          <select className={ui.input} value={filters.topicId} onChange={(event) => updateFilter("topicId", event.target.value)}>
            <option value="">All Topics</option>
            {filteredTopics.map((item) => <option key={recordId(item)} value={recordId(item)}>{item.name}</option>)}
          </select>
          <select className={ui.input} value={filters.questionTypeId} onChange={(event) => updateFilter("questionTypeId", event.target.value)}>
            <option value="">All Question Types</option>
            {lookups.questionTypes.map((item) => <option key={recordId(item)} value={recordId(item)}>{item.name || item.label || item.key}</option>)}
          </select>
          <select className={ui.input} value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status || "all"} value={status}>{status || "All Statuses"}</option>)}
          </select>
          <input className={ui.input} value={filters.search} placeholder="Search ID / keywords" onChange={(event) => updateFilter("search", event.target.value)} />
          <div className="flex gap-2">
            <select className={ui.input} value={PAGE_SIZES.includes(Number(filters.limit)) ? filters.limit : "custom"} onChange={(event) => {
              if (event.target.value === "custom") return;
              setCustomLimit("");
              setFilters((current) => ({ ...current, page: 1, limit: Number(event.target.value) }));
            }}>
              {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} Rows</option>)}
              <option value="custom">Custom</option>
            </select>
            <input className={cn(ui.input, "max-w-[120px]")} type="number" min="10" max="1000" value={customLimit} placeholder="Custom" onChange={(event) => {
              setCustomLimit(event.target.value);
              const next = Math.max(10, Math.min(1000, Number(event.target.value || 0)));
              if (next) setFilters((current) => ({ ...current, page: 1, limit: next }));
            }} />
          </div>
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-600">
          Showing {shownCount} of {filteredCount.toLocaleString("en-IN")} filtered questions. Total question bank: {totalCount.toLocaleString("en-IN")}.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["questions", "Questions"],
          ["draft", "Draft"],
          ["preview", "Preview"],
          ["history", "Audit Logs"],
        ].map(([key, label]) => (
          <button key={key} type="button" className={cn(ui.buttonBase, activeTab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => {
            setActiveTab(key);
            setFilters((current) => ({ ...current, page: 1 }));
            setSelected([]);
            setSelectedFindings([]);
          }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {activeTab === "questions" ? (
          <>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selected.length} onClick={() => runAction("aiScan")} type="button">AI Analyze Selected</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy || !selected.length} onClick={() => runAction("review")} type="button">Mark Reviewed</button>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{selected.length} selected</span>
          </>
        ) : null}
      </div>

      {aiJob ? (
        <div className={ui.panel}>
          <strong>AI Scan Progress</strong>
          <p className={ui.muted}>
            Scanning {aiJob.total || 0} Questions | Processed: {aiJob.processed || 0}/{aiJob.total || 0} | Remaining: {aiJob.remaining || 0} | Issues Found: {aiJob.issuesFound || 0} | Status: {aiJob.status}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-blue-600" style={{ width: `${aiJob.total ? Math.round((Number(aiJob.processed || 0) / Number(aiJob.total)) * 100) : 0}%` }} />
          </div>
        </div>
      ) : null}

      {activeTab === "questions" && (loading ? <LoadingSpinner label="Loading question records..." /> : (
        <div className={ui.panel}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={toggleAll} /></th>
                  <th className={ui.tableHead}>Question ID</th>
                  <th className={ui.tableHead}>Subject</th>
                  <th className={ui.tableHead}>Chapter</th>
                  <th className={ui.tableHead}>Topic</th>
                  <th className={ui.tableHead}>Question Type</th>
                  <th className={ui.tableHead}>Status</th>
                  <th className={ui.tableHead}>Preview</th>
                  <th className={ui.tableHead}>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={ui.tableCell}><input type="checkbox" checked={selectedSet.has(row.questionId)} onChange={() => toggleSelected(row.questionId)} /></td>
                    <td className={ui.tableCell}><span className="font-mono text-xs">{row.questionId}</span></td>
                    <td className={ui.tableCell}>{row.subject}</td>
                    <td className={ui.tableCell}>{row.chapter}</td>
                    <td className={ui.tableCell}>{row.topic}</td>
                    <td className={ui.tableCell}>{row.questionType}</td>
                    <td className={ui.tableCell}><span className={cn("rounded-full border px-2 py-1 text-xs font-black", statusClass(row.status))}>{row.status}</span></td>
                    <td className={cn(ui.tableCell, "min-w-[320px]")}>
                      <MathText className="line-clamp-3 text-sm">{row.preview}</MathText>
                      {expanded === row.id ? (
                        <div className="mt-3 rounded-sm border border-slate-200 bg-slate-50 p-3">
                          {(row.issues || []).length ? row.issues.map((item, index) => (
                            <div key={`${item.field}-${item.type}-${index}`} className="mb-2 text-xs text-slate-700">
                              <b>{item.field}</b> / {item.type}: {item.message}
                            </div>
                          )) : <div className="text-xs text-emerald-700">No issues detected.</div>}
                        </div>
                      ) : null}
                    </td>
                    <td className={ui.tableCell}>
                      <button className={cn(ui.buttonBase, ui.buttonGhost, "px-3 py-2 text-xs")} onClick={() => setExpanded((current) => current === row.id ? "" : row.id)} type="button">
                        {expanded === row.id ? "Hide" : "Review"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr><td className={ui.tableCell} colSpan={9}>No questions found for the selected filters.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </div>
      ))}

      {(activeTab === "draft" || activeTab === "preview") ? (
        <div className={ui.panel}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <select className={cn(ui.input, "max-w-[220px]")} value={findingFilter.issueType} onChange={(event) => setFindingFilter((current) => ({ ...current, page: 1, issueType: event.target.value }))}>
              <option value="">All Issue Types</option>
              {(issueTypes.length ? issueTypes : ISSUE_TYPES.filter(Boolean)).map((type) => <option key={type} value={type}>{type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}</option>)}
            </select>
            <select className={cn(ui.input, "max-w-[240px]")} value={findingFilter.auditStatus} onChange={(event) => setFindingFilter((current) => ({ ...current, page: 1, auditStatus: event.target.value }))}>
              {AI_STATUSES.map((status) => <option key={status || "all"} value={status}>{status || "All AI Statuses"}</option>)}
            </select>
            {activeTab === "draft" ? (
              <>
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selectedFindings.length} onClick={aiFixDraft} type="button">AI Fix Selected</button>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} disabled={busy || !selectedFindings.length} onClick={rejectAIFixes} type="button">Reject Selected</button>
              </>
            ) : (
              <>
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selectedFindings.length} onClick={applyApprovedFixes} type="button">Approve Selected</button>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} disabled={busy || !selectedFindings.length} onClick={rejectAIFixes} type="button">Rollback Selected</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy || !selectedFindings.length} onClick={refixSelected} type="button">Re-Fix Selected</button>
              </>
            )}
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.exportFindings("csv", currentFindingExportParams)} type="button">Export CSV</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.exportFindings("xlsx", currentFindingExportParams)} type="button">Export XLSX</button>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.exportFindings("json", currentFindingExportParams)} type="button">Export JSON</button>
          </div>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}><input type="checkbox" checked={findings.length > 0 && selectedFindings.length === findings.length} onChange={toggleAllFindings} /></th><th className={ui.tableHead}>Question ID</th><th className={ui.tableHead}>Subject</th><th className={ui.tableHead}>Chapter</th><th className={ui.tableHead}>Topic</th><th className={ui.tableHead}>Question Type</th><th className={ui.tableHead}>Issue Type</th><th className={ui.tableHead}>{activeTab === "preview" ? "Fixed Date" : "Issue Description"}</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Suggested Fix</th><th className={ui.tableHead}>Action</th></tr></thead>
              <tbody>
                {findings.map((item) => {
                  const id = recordId(item);
                  const isEditing = editingFinding?.id === id;
                  const fixes = item.suggestedFixes?.length ? item.suggestedFixes : [{ field: item.field, oldValue: item.oldValue, newValue: item.suggestedValue }];
                  return (
                    <Fragment key={id}>
                      <tr key={id}>
                        <td className={ui.tableCell}><input type="checkbox" checked={selectedFindings.includes(id)} onChange={() => toggleFinding(id)} /></td>
                        <td className={ui.tableCell}><span className="font-mono text-xs">{relationId(item.questionId)}</span></td>
                        <td className={ui.tableCell}>{item.subject}</td>
                        <td className={ui.tableCell}>{item.chapter}</td>
                        <td className={ui.tableCell}>{item.topic}</td>
                        <td className={ui.tableCell}>{item.questionType}</td>
                        <td className={ui.tableCell}>{item.issueType}</td>
                        <td className={ui.tableCell}>
                          {isEditing ? (
                            <textarea className={cn(ui.input, "min-h-24 min-w-[260px]")} value={editingFinding.description} onChange={(event) => setEditingFinding((current) => ({ ...current, description: event.target.value }))} />
                          ) : activeTab === "preview" ? formatDate(item.fixedAt || item.updatedAt || item.createdAt) : item.description}
                        </td>
                        <td className={ui.tableCell}>{item.status}</td>
                        <td className={ui.tableCell}>
                          {isEditing ? (
                            <textarea className={cn(ui.input, "min-h-24 min-w-[300px]")} value={editingFinding.suggestedValue} onChange={(event) => setEditingFinding((current) => ({ ...current, suggestedValue: event.target.value }))} />
                          ) : (
                            <div className="max-w-[360px] text-xs text-slate-600">
                              {fixes.map((fix, index) => (
                                <div key={`${fix.field}-${index}`}><b>{fix.field}</b>: {String(fix.oldValue || "").slice(0, 60)} {"->"} {String(fix.newValue || "").slice(0, 60)}</div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={ui.tableCell}>
                          <div className="flex flex-wrap gap-2">
                            <button className={cn(ui.buttonBase, ui.buttonGhost, "px-3 py-2 text-xs")} type="button" onClick={() => activeTab === "preview" ? setPreviewItem(item) : setExpandedFinding((current) => current === id ? "" : id)}>View</button>
                            {isEditing ? (
                              <button className={cn(ui.buttonBase, ui.buttonPrimary, "px-3 py-2 text-xs")} disabled={busy} type="button" onClick={saveFindingEdit}>Save</button>
                            ) : (
                              activeTab === "draft" ? <button className={cn(ui.buttonBase, ui.buttonSecondary, "px-3 py-2 text-xs")} disabled={busy || item.status === "applied"} type="button" onClick={() => setEditingFinding({ id, description: item.description || "", suggestedValue: item.suggestedValue || fixes[0]?.newValue || "" })}>Edit</button> : null
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedFinding === id ? (
                        <tr key={`${id}-preview`}>
                          <td className={ui.tableCell} colSpan={11}>
                            <div className="grid gap-3 md:grid-cols-2">
                              {fixes.map((fix, index) => (
                                <div key={`${fix.field}-diff-${index}`} className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                                  <div className="mb-2 text-xs font-black uppercase text-slate-500">{fix.field}</div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-sm bg-white p-3 text-xs text-slate-700">{fix.oldValue}</pre>
                                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-sm bg-emerald-50 p-3 text-xs text-emerald-900">{fix.newValue}</pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {!findings.length ? <tr><td className={ui.tableCell} colSpan={11}>No {activeTab === "preview" ? "preview" : "draft"} rows found for the selected filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination meta={findingsMeta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </div>
      ) : null}

      {activeTab === "history" ? (
        <div className={ui.panel}>
          <div className="mb-3 flex justify-end">
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => katexAuditService.exportFixHistory()} type="button">Export Logs</button>
          </div>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}>Date</th><th className={ui.tableHead}>Question ID</th><th className={ui.tableHead}>Field</th><th className={ui.tableHead}>Old Value</th><th className={ui.tableHead}>New Value</th><th className={ui.tableHead}>Provider</th><th className={ui.tableHead}>Model</th><th className={ui.tableHead}>Rollback</th></tr></thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={recordId(row)}>
                    <td className={ui.tableCell}>{formatDate(row.createdAt)}</td>
                    <td className={ui.tableCell}><span className="font-mono text-xs">{relationId(row.questionId)}</span></td>
                    <td className={ui.tableCell}>{row.field}</td>
                    <td className={ui.tableCell}><pre className="max-h-28 min-w-[220px] overflow-auto whitespace-pre-wrap text-xs">{row.oldValue}</pre></td>
                    <td className={ui.tableCell}><pre className="max-h-28 min-w-[220px] overflow-auto whitespace-pre-wrap text-xs">{row.newValue}</pre></td>
                    <td className={ui.tableCell}>{row.provider}</td>
                    <td className={ui.tableCell}>{row.model}</td>
                    <td className={ui.tableCell}>
                      <button className={cn(ui.buttonBase, ui.buttonGhost, "px-3 py-2 text-xs")} disabled={busy || row.rolledBackAt} onClick={() => rollback(recordId(row))} type="button">
                        {row.rolledBackAt ? "Rolled Back" : "Rollback"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!historyRows.length ? <tr><td className={ui.tableCell} colSpan={8}>No AI fix history yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination meta={historyMeta} onChange={(page) => loadHistory({ page, limit: 20 })} />
        </div>
      ) : null}

      {previewItem ? (() => {
        const fixes = previewItem.suggestedFixes?.length ? previewItem.suggestedFixes : [{ field: previewItem.field, oldValue: previewItem.oldValue, newValue: previewItem.suggestedValue }];
        const corrected = {
          question: previewItem.originalQuestion?.question || "",
          options: [...(previewItem.originalQuestion?.options || ["", "", "", ""])],
          explanation: previewItem.originalQuestion?.explanation || "",
        };
        fixes.forEach((fix) => {
          if (fix.field === "question") corrected.question = fix.newValue || corrected.question;
          if (fix.field === "explanation") corrected.explanation = fix.newValue || corrected.explanation;
          if (fix.field === "optionA") corrected.options[0] = fix.newValue || corrected.options[0];
          if (fix.field === "optionB") corrected.options[1] = fix.newValue || corrected.options[1];
          if (fix.field === "optionC") corrected.options[2] = fix.newValue || corrected.options[2];
          if (fix.field === "optionD") corrected.options[3] = fix.newValue || corrected.options[3];
        });
        const changedFields = new Set(fixes.map((fix) => fix.field));
        const renderBlock = (label, value, changed = false) => (
          <div className={cn("rounded-sm border p-3", changed ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
            <div className="mb-2 text-xs font-black uppercase text-slate-500">{label}</div>
            <MathText className="text-sm text-slate-800">{value || "-"}</MathText>
          </div>
        );
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-md bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-950">Question Comparison</div>
                  <div className="text-xs font-semibold text-slate-500">Issue type: {previewItem.issueType}</div>
                </div>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} type="button" onClick={() => setPreviewItem(null)}>Close</button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-sm font-black text-slate-700">Original</div>
                  {renderBlock("Question", previewItem.originalQuestion?.question)}
                  {(previewItem.originalQuestion?.options || []).map((option, index) => renderBlock(`Option ${String.fromCharCode(65 + index)}`, option))}
                  {renderBlock("Explanation", previewItem.originalQuestion?.explanation)}
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-black text-slate-700">Corrected</div>
                  {renderBlock("Question", corrected.question, changedFields.has("question"))}
                  {corrected.options.map((option, index) => renderBlock(`Option ${String.fromCharCode(65 + index)}`, option, changedFields.has(`option${String.fromCharCode(65 + index)}`)))}
                  {renderBlock("Explanation", corrected.explanation, changedFields.has("explanation"))}
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
