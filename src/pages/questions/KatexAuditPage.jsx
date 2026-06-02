import { useEffect, useMemo, useState } from "react";
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

const STATUS_OPTIONS = ["", "PASS", "WARNING", "FAILED"];
const ISSUE_TYPES = ["", "formula", "answer", "explanation", "ocr", "katex", "grammar", "option", "science"];
const PAGE_SIZES = [10, 25, 50, 100, 250, 500];

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
  const [lookups, setLookups] = useState({ subjects: [], chapters: [], topics: [], questionTypes: [] });
  const [filters, setFilters] = useState({ page: 1, limit: 20, subjectId: "", chapterId: "", topicId: "", questionTypeId: "", status: "" });
  const [customLimit, setCustomLimit] = useState("");
  const [activeTab, setActiveTab] = useState("audit");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState("");
  const [aiJob, setAiJob] = useState(null);
  const [findings, setFindings] = useState([]);
  const [findingsMeta, setFindingsMeta] = useState(null);
  const [findingFilter, setFindingFilter] = useState({ page: 1, limit: 20, issueType: "" });
  const [selectedFindings, setSelectedFindings] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyMeta, setHistoryMeta] = useState(null);

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
      const response = await katexAuditService.list(nextFilters);
      setRows(response.data || []);
      setMeta(response.meta || null);
      setSummary(response.summary || {});
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadFindings(nextFilter = findingFilter) {
    const response = await katexAuditService.aiFindings(nextFilter);
    setFindings(response.data || []);
    setFindingsMeta(response.meta || null);
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
    void loadData(filters);
  }, [filters.page, filters.limit, filters.subjectId, filters.chapterId, filters.topicId, filters.questionTypeId, filters.status]);

  useEffect(() => {
    if (activeTab === "findings") void loadFindings(findingFilter);
  }, [activeTab, findingFilter.page, findingFilter.issueType]);

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
        await loadFindings(findingFilter);
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
      if (action === "fix") {
        const response = await katexAuditService.bulkAutoFix(selected);
        toast.success(`Auto fixed ${response.data?.updated || 0} questions.`);
      }
      if (action === "review") {
        const response = await katexAuditService.markReviewed(selected);
        toast.success(`Marked ${response.data?.reviewed || 0} questions reviewed.`);
      }
      if (action === "aiScan") {
        const response = await katexAuditService.aiScan(selected);
        setAiJob(response.data);
        setActiveTab("findings");
        toast.success(`AI audit queued for ${response.data?.total || selected.length} questions.`);
      }
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "KaTeX audit action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function applyAIFixes() {
    if (!selectedFindings.length) {
      toast.info("Select AI findings first.");
      return;
    }
    setBusy(true);
    try {
      const response = await katexAuditService.aiFix(selectedFindings);
      toast.success(`Applied ${response.data?.applied || 0} AI fixes.`);
      await loadFindings(findingFilter);
      await loadHistory();
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "AI fix failed.");
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

  async function autoFixSingle(questionId) {
    setBusy(true);
    try {
      await katexAuditService.autoFix(questionId);
      toast.success("Question auto-fix completed.");
      await loadData(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Auto-fix failed.");
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
  const filteredCount = meta?.total || 0;
  const shownCount = rows.length;
  const totalCount = summary.totalQuestions || 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Question Bank KaTeX Audit</h2>
          <p className={ui.muted}>Scan stored questions for formula, chemistry, notation, and render-risk issues.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy} onClick={() => runAction("scan")} type="button">
            {busy ? "Processing..." : filters.subjectId ? "Scan Subject" : "Scan All Questions"}
          </button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.export("csv", exportParams)} type="button">Export CSV</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={() => katexAuditService.export("xlsx", exportParams)} type="button">Export XLSX</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metric("Total Questions", summary.totalQuestions)}
        {metric("Passed", summary.passed, "text-emerald-700")}
        {metric("Warning", summary.warning, "text-amber-700")}
        {metric("Failed", summary.failed, "text-rose-700")}
        {metric("Need Review", summary.needReview, "text-blue-700")}
      </div>

      <div className={ui.panel}>
        <div className="grid gap-3 md:grid-cols-6">
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
          <div className="flex gap-2">
            <select className={ui.input} value={PAGE_SIZES.includes(Number(filters.limit)) ? filters.limit : "custom"} onChange={(event) => {
              if (event.target.value === "custom") return;
              setCustomLimit("");
              setFilters((current) => ({ ...current, page: 1, limit: Number(event.target.value) }));
            }}>
              {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} Rows</option>)}
              <option value="custom">Custom</option>
            </select>
            <input className={cn(ui.input, "max-w-[120px]")} type="number" min="1" max="500" value={customLimit} placeholder="Custom" onChange={(event) => {
              setCustomLimit(event.target.value);
              const next = Math.max(1, Math.min(500, Number(event.target.value || 0)));
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
          ["audit", "KaTeX Audit"],
          ["findings", "AI Findings"],
          ["history", "AI Fix History"],
        ].map(([key, label]) => (
          <button key={key} type="button" className={cn(ui.buttonBase, activeTab === key ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selected.length} onClick={() => runAction("fix")} type="button">Auto Fix Selected</button>
        <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selected.length} onClick={() => runAction("aiScan")} type="button">AI Scan Selected</button>
        <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy || !selected.length} onClick={() => runAction("review")} type="button">Mark Reviewed</button>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{selected.length} selected</span>
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

      {activeTab === "audit" && (loading ? <LoadingSpinner label="Loading KaTeX audit results..." /> : (
        <div className={ui.panel}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={toggleAll} /></th>
                  <th className={ui.tableHead}>Question ID</th>
                  <th className={ui.tableHead}>Subject</th>
                  <th className={ui.tableHead}>Status</th>
                  <th className={ui.tableHead}>Confidence</th>
                  <th className={ui.tableHead}>Error Count</th>
                  <th className={ui.tableHead}>Preview</th>
                  <th className={ui.tableHead}>Auto Fix</th>
                  <th className={ui.tableHead}>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={ui.tableCell}><input type="checkbox" checked={selectedSet.has(row.questionId)} onChange={() => toggleSelected(row.questionId)} /></td>
                    <td className={ui.tableCell}><span className="font-mono text-xs">{row.questionId}</span></td>
                    <td className={ui.tableCell}>
                      <div className="font-semibold text-slate-900">{row.subject}</div>
                      <div className="text-xs text-slate-500">{row.chapter} / {row.topic}</div>
                    </td>
                    <td className={ui.tableCell}><span className={cn("rounded-full border px-2 py-1 text-xs font-black", statusClass(row.status))}>{row.status}</span></td>
                    <td className={ui.tableCell}>{row.confidence}</td>
                    <td className={ui.tableCell}>{row.errorCount} errors / {row.warningCount} warnings</td>
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
                      <button className={cn(ui.buttonBase, ui.buttonSecondary, "px-3 py-2 text-xs")} disabled={busy || !row.autoFixAvailable} onClick={() => autoFixSingle(row.questionId)} type="button">Auto Fix</button>
                    </td>
                    <td className={ui.tableCell}>
                      <button className={cn(ui.buttonBase, ui.buttonGhost, "px-3 py-2 text-xs")} onClick={() => setExpanded((current) => current === row.id ? "" : row.id)} type="button">
                        {expanded === row.id ? "Hide" : "Review"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr><td className={ui.tableCell} colSpan={9}>No audit rows found. Run Scan All Questions to create audit results.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setFilters((current) => ({ ...current, page }))} />
        </div>
      ))}

      {activeTab === "findings" ? (
        <div className={ui.panel}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <select className={cn(ui.input, "max-w-[240px]")} value={findingFilter.issueType} onChange={(event) => setFindingFilter((current) => ({ ...current, page: 1, issueType: event.target.value }))}>
              {ISSUE_TYPES.map((type) => <option key={type || "all"} value={type}>{type ? `${type[0].toUpperCase()}${type.slice(1)} Issues` : "All AI Issues"}</option>)}
            </select>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy || !selectedFindings.length} onClick={applyAIFixes} type="button">AI Fix Selected</button>
          </div>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}><input type="checkbox" checked={findings.length > 0 && selectedFindings.length === findings.length} onChange={toggleAllFindings} /></th><th className={ui.tableHead}>Question ID</th><th className={ui.tableHead}>Issue Type</th><th className={ui.tableHead}>Severity</th><th className={ui.tableHead}>Description</th><th className={ui.tableHead}>Suggested Fix</th></tr></thead>
              <tbody>
                {findings.map((item) => (
                  <tr key={recordId(item)}>
                    <td className={ui.tableCell}><input type="checkbox" checked={selectedFindings.includes(recordId(item))} onChange={() => toggleFinding(recordId(item))} /></td>
                    <td className={ui.tableCell}><span className="font-mono text-xs">{relationId(item.questionId)}</span></td>
                    <td className={ui.tableCell}>{item.issueType}</td>
                    <td className={ui.tableCell}>{item.severity}</td>
                    <td className={ui.tableCell}>{item.description}</td>
                    <td className={ui.tableCell}>
                      <div className="max-w-[360px] text-xs text-slate-600">
                        {(item.suggestedFixes || []).map((fix, index) => (
                          <div key={`${fix.field}-${index}`}><b>{fix.field}</b>: {String(fix.oldValue || "").slice(0, 60)} {"->"} {String(fix.newValue || "").slice(0, 60)}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!findings.length ? <tr><td className={ui.tableCell} colSpan={6}>No AI findings yet. Select questions and run AI Scan Selected.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination meta={findingsMeta} onChange={(page) => setFindingFilter((current) => ({ ...current, page }))} />
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
    </div>
  );
}
