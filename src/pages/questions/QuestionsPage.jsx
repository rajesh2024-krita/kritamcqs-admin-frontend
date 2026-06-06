import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chapterService } from "../../api/chapterService";
import { difficultyService } from "../../api/difficultyService";
import { examTypeService } from "../../api/examTypeService";
import { questionService } from "../../api/questionService";
import { questionTypeService } from "../../api/questionTypeService";
import { subjectService } from "../../api/subjectService";
import { topicService } from "../../api/topicService";
import { yearService } from "../../api/yearService";
import {
  deriveExamType,
  formatSubjectLabel,
} from "../../utils/examStructure";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { EntityFormWrapper } from "../../components/forms/EntityFormWrapper";
import { MathText } from "../../components/common/MathText";
import { MatchingQuestionTable } from "../../components/question/MatchingQuestionTable";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getModulePermission, isEmployee } from "../../config/adminPermissions";
import { cn, ui } from "../../ui";

function matchesQuestionSubject(subject, form) {
  if (!subject) return false;
  if (!form.examType) return true;
  return subject.examType === form.examType;
}

function matchesQuestionType(questionType, form) {
  if (!questionType) return false;
  if (!form.examType) return true;
  const examType = String(form.examType || "").toUpperCase();
  const questionTypeExam =
    String(questionType.examType || questionType.examCategory || questionType.mode || "").toUpperCase();

  if (examType === "JEE") {
    return questionTypeExam === "JEE" || questionTypeExam === "JEE_MAIN" || questionTypeExam === "JEE_ADVANCED";
  }

  return questionTypeExam === examType;
}

function normalizeQuestionExamType(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized === "JEE" || normalized === "JEE_MAIN" || normalized === "JEE_ADVANCED") return "JEE";
  if (normalized === "NEET") return "NEET";
  return normalized;
}

function examTypeOptions(examTypes = []) {
  const seen = new Set();
  return examTypes
    .map((item) => {
      const value = normalizeQuestionExamType(item.name || item.key || item.label);
      return { label: item.name || item.label || item.key, value };
    })
    .filter((item) => {
      if (!item.value || seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
}

async function listAllRecords(service, params = {}, pageSize = 500) {
  const allRows = [];
  let page = 1;

  while (true) {
    const response = await service.list({ ...params, page, limit: pageSize });
    const rows = response?.data || [];
    allRows.push(...rows);

    const totalPages = Number(response?.meta?.totalPages || 0);
    const hasMoreByMeta = totalPages > 0 ? page < totalPages : false;
    const hasMoreByLength = totalPages <= 0 ? rows.length >= pageSize : false;

    if (!hasMoreByMeta && !hasMoreByLength) break;
    page += 1;
  }

  return { data: allRows };
}

function formatPercent(value) {
  const percent = Number(value || 0);
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAuditValue(value) {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function resolvePreviewImageSource(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (!raw.startsWith("/")) return raw;
  if (raw.startsWith("/uploads/")) {
    const appBase = String(import.meta.env.VITE_APP_FRONTEND_BASE_URL || "").replace(/\/+$/, "");
    if (appBase) return `${appBase}${raw}`;
  }
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");
  return base ? `${base}${raw}` : raw;
}

function lookupById(items = [], id) {
  if (!id) return null;
  return items.find((item) => String(item.id || item._id) === String(id)) || null;
}

function getLookupName(items = [], id, fallback = "") {
  const item = lookupById(items, id);
  return item?.name || item?.label || item?.key || fallback || "";
}

function formatDisplayVariant(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function syncQuestionTypeSelection(nextValue, current, lookups) {
  const questionType = lookupById(lookups.questionTypes, nextValue);
  const responseType = questionType?.responseType || current.responseType || "single";
  return {
    ...current,
    questionTypeId: nextValue,
    responseType,
    isNumerical: responseType === "numeric",
  };
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== "" && entry !== undefined && entry !== null),
  );
}

function QuestionImage({ src, alt }) {
  const resolved = resolvePreviewImageSource(src);
  if (!resolved) return null;
  return (
    <img
      src={resolved}
      alt={alt}
      className="mt-3 max-h-52 w-full rounded-lg border border-slate-200 bg-white object-contain p-2"
    />
  );
}

function QuestionLivePreview({ formState, setFormState, lookups, editingItem, navigation }) {
  const toast = useToast();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiFindings, setAiFindings] = useState([]);
  const subject = lookupById(lookups.subjects, formState.subjectId);
  const topic = lookupById(lookups.topics, formState.topicId);
  const year = lookupById(lookups.years, formState.yearId);
  const difficulty = lookupById(lookups.difficulties, formState.difficultyId);
  const questionType = lookupById(lookups.questionTypes, formState.questionTypeId);
  const examType = formState.examType || subject?.examType || deriveExamType(formState.examMode, formState.exam);
  const displayVariant = questionType?.displayVariant || formState.displayVariant || "";
  const displayVariantLabel = formatDisplayVariant(displayVariant);
  const optionRows = [
    ["A", formState.optionA, formState.optionAImageUrl],
    ["B", formState.optionB, formState.optionBImageUrl],
    ["C", formState.optionC, formState.optionCImageUrl],
    ["D", formState.optionD, formState.optionDImageUrl],
  ];
  const showOptions = formState.responseType !== "numeric";
  const previousQuestion = navigation?.currentIndex > 0 ? navigation.items[navigation.currentIndex - 1] : null;
  const nextQuestion = navigation?.currentIndex >= 0 && navigation.currentIndex < navigation.items.length - 1
    ? navigation.items[navigation.currentIndex + 1]
    : null;

  function buildAIQuestionData() {
    return {
      question: formState.question || "",
      optionA: formState.optionA || "",
      optionB: formState.optionB || "",
      optionC: formState.optionC || "",
      optionD: formState.optionD || "",
      correctOption: formState.correctOption || "",
      correctOptions: formState.correctOptions || [],
      numericAnswer: formState.numericAnswer || "",
      difficulty: formState.difficulty || difficulty?.name || "",
      responseType: formState.responseType || "single",
      explanation: formState.explanation || "",
    };
  }

  async function runAIScan() {
    if (!editingItem?.id) {
      toast.info("Save the question before running AI scan.");
      return;
    }
    setAiBusy(true);
    try {
      const response = await questionService.aiScan(editingItem.id, buildAIQuestionData());
      setAiFindings(response.data?.findings || []);
      const count = response.data?.findings?.length || 0;
      toast.success(count ? "AI scan found issues and moved them to Draft." : "AI scan passed. No formula issues found.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "AI scan failed.");
    } finally {
      setAiBusy(false);
    }
  }

  function previewAIFix() {
    const fixes = aiFindings.flatMap((finding) => finding.suggestedFixes || []);
    if (!fixes.length) {
      toast.info("No AI fix suggestions available.");
      return;
    }
    setFormState((current) => {
      const next = { ...current };
      fixes.forEach((fix) => {
        if (fix.field && fix.newValue !== undefined) next[fix.field] = fix.newValue;
      });
      return next;
    });
    toast.success("AI corrected draft loaded into preview. Review it live, then save changes.");
  }

  function buildQuestionJson() {
    const options = showOptions
      ? [formState.optionA, formState.optionB, formState.optionC, formState.optionD]
      : [];
    const correctAnswer = showOptions
      ? (formState.correctOptions?.length ? formState.correctOptions : formState.correctOption || "")
      : formState.numericAnswer || "";

    return compactObject({
      id: editingItem?.id,
      question: formState.question || "",
      questionImageUrl: formState.questionImageUrl || "",
      passage: formState.passage || "",
      options,
      optionImages: compactObject({
        A: formState.optionAImageUrl,
        B: formState.optionBImageUrl,
        C: formState.optionCImageUrl,
        D: formState.optionDImageUrl,
      }),
      correctAnswer,
      explanation: formState.explanation || "",
      explanationImageUrl: formState.explanationImageUrl || "",
      examType: examType || "",
      subject: subject?.name || "",
      subjectId: formState.subjectId || "",
      chapter: getLookupName(lookups.chapters, formState.chapterId),
      chapterId: formState.chapterId || "",
      topic: topic?.name || "",
      topicId: formState.topicId || "",
      year: year?.name || "",
      yearId: formState.yearId || "",
      difficulty: difficulty?.name || formState.difficulty || "",
      difficultyId: formState.difficultyId || "",
      questionType: questionType?.name || questionType?.label || questionType?.key || "",
      questionTypeId: formState.questionTypeId || "",
      displayVariant,
      responseType: formState.responseType || "",
      questionStatus: formState.questionStatus || "",
      reviewStatus: formState.reviewStatus || "",
      isVisibleToUsers: formState.isVisibleToUsers,
      conceptTags: formState.conceptTags || [],
      exact: formState.exact,
      hasDiagram: formState.hasDiagram,
      isNumerical: formState.isNumerical,
      createdByName: editingItem?.createdByName,
      createdByEmail: editingItem?.createdByEmail,
      createdAt: editingItem?.createdAt,
      lastModifiedByName: editingItem?.lastModifiedByName,
      lastModifiedByEmail: editingItem?.lastModifiedByEmail,
      lastModifiedAt: editingItem?.lastModifiedAt || editingItem?.updatedAt,
      editCount: editingItem?.editCount,
    });
  }

  async function copyQuestionJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildQuestionJson(), null, 2));
      toast.success("Question JSON copied");
    } catch {
      toast.error("Unable to copy question JSON.");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">K</div>
          <div>
            <div className="text-lg font-black leading-none text-blue-700">KritaMCQs</div>
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">NEET JEE</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 rounded-full bg-blue-600" />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 text-[10px] font-black">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Answered 0</span>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Skipped 0</span>
          <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">Review 0</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Unanswered</span>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {editingItem?.id ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex flex-wrap gap-2">
              <button className={cn(ui.buttonBase, ui.buttonSecondary, "px-3 py-2 text-xs")} type="button" disabled={aiBusy} onClick={runAIScan}>
                {aiBusy ? "AI Scanning..." : "AI Scan"}
              </button>
              <button className={cn(ui.buttonBase, ui.buttonPrimary, "px-3 py-2 text-xs")} type="button" disabled={aiBusy || !aiFindings.length} onClick={previewAIFix}>
                AI Fix
              </button>
            </div>
            {aiFindings.length ? (
              <div className="mt-3 space-y-1 text-xs text-slate-700">
                {aiFindings.slice(0, 5).map((finding) => (
                  <div key={finding.id || finding._id}>
                    {finding.auditStatus === "PASS" ? "PASS" : "ISSUE"}: {finding.description || finding.auditStatus}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
              {examType || "Exam"} {year?.name ? `PYQ: ${year.name}` : ""}
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-black text-slate-700">
            <span className="rounded-full bg-emerald-50 px-2 py-1">Exam Type: {examType || "-"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{subject?.name || "Subject"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{topic?.name || "Topic"}</span>
            {displayVariantLabel ? <span className="rounded-full bg-slate-100 px-2 py-1">Display: {displayVariantLabel}</span> : null}
            <span className="rounded-full bg-slate-100 px-2 py-1">Answer: {formState.responseType || "single"}</span>
          </div>
          <MatchingQuestionTable
            question={{
              ...formState,
              questionType: questionType?.key || questionType?.name || formState.questionType,
              questionTypeLabel: questionType?.name || questionType?.label || formState.questionTypeLabel,
              displayVariant,
            }}
            text={formState.question || "Question preview will appear here as you type."}
            textClassName="text-sm font-black leading-6 text-slate-950"
          />
          <QuestionImage src={formState.questionImageUrl} alt="Question preview" />
        </div>

        {showOptions ? optionRows.map(([label, text, image]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 text-sm text-slate-950">
              <span className="font-medium">{label}.</span>
              <div>
                <MathText className="font-semibold leading-6" inline>{text || `Option ${label}`}</MathText>
                <QuestionImage src={image} alt={`Option ${label} preview`} />
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Numeric Answer</div>
            <MathText className="mt-2 text-sm font-semibold text-slate-950">{formState.numericAnswer || "-"}</MathText>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black text-slate-600">
            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Answer: {showOptions ? (formState.correctOption || formState.correctOptions?.join(", ") || "-") : "Numeric"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{difficulty?.name || formState.difficulty || "Difficulty"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{questionType?.name || formState.responseType || "Question Type"}</span>
            {displayVariantLabel ? <span className="rounded-full bg-slate-100 px-2 py-1">Display: {displayVariantLabel}</span> : null}
            <span className="rounded-full bg-slate-100 px-2 py-1">Response: {formState.responseType || "single"}</span>
          </div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Explanation</div>
          <MatchingQuestionTable
            question={{
              ...formState,
              questionType: questionType?.key || questionType?.name || formState.questionType,
              questionTypeLabel: questionType?.name || questionType?.label || formState.questionTypeLabel,
              displayVariant,
            }}
            text={formState.explanation || "Explanation preview will appear here."}
            textClassName="mt-2 text-sm font-semibold leading-6 text-slate-950"
          />
          <QuestionImage src={formState.explanationImageUrl} alt="Explanation preview" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            className="rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-bold text-slate-600 disabled:opacity-50"
            type="button"
            disabled={!previousQuestion || navigation?.loading}
            onClick={() => navigation?.openItem(previousQuestion)}
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-bold text-slate-600"
            type="button"
            onClick={copyQuestionJson}
          >
            Copy JSON
          </button>
          <button
            className="rounded-lg bg-blue-600 px-2 py-3 text-xs font-bold text-white disabled:opacity-50"
            type="button"
            disabled={!nextQuestion || navigation?.loading}
            onClick={() => navigation?.openItem(nextQuestion)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function uniqueYearOptions(years = []) {
  const seen = new Set();
  return years
    .map((item) => ({ label: item.name, value: item.id }))
    .filter((item) => {
      const key = String(item.label || "").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function QuestionsPage() {
  const { admin } = useAuth();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("upload");
  const [bulkCreateMissingQuestions, setBulkCreateMissingQuestions] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showMissingFields, setShowMissingFields] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyQuestion, setHistoryQuestion] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bulkCompletionRefreshRef = useRef(false);

  useEffect(() => {
    const batchId = bulkResult?.batchId || bulkPreview?.batchId;
    const shouldPoll = batchId && (bulkResult?.status === "processing" || bulkPreview?.status === "processing");
    if (!bulkOpen || !shouldPoll) return undefined;
    bulkCompletionRefreshRef.current = false;
    const timer = window.setInterval(async () => {
      const response = await questionService.getBulkUploadStatus(batchId);
      setBulkResult(response.data);
      if (response.data?.status !== "processing") {
        setBulkPreview((current) => ({ ...(current || {}), ...(response.data || {}) }));
        if (!bulkCompletionRefreshRef.current) {
          bulkCompletionRefreshRef.current = true;
          setRefreshKey((current) => current + 1);
        }
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [bulkOpen, bulkPreview?.batchId, bulkPreview?.status, bulkResult?.batchId, bulkResult?.status]);

  async function validateBulkFile() {
    if (!bulkFile) return;
    setBulkBusy(true);
    try {
      const response = await questionService.validateBulkUpload(bulkFile, bulkMode, bulkCreateMissingQuestions);
      setBulkPreview(response.data);
      setBulkResult(null);
      setShowMissingFields(false);
    } finally {
      setBulkBusy(false);
    }
  }

  async function createMissingCategories() {
    if (!bulkPreview?.batchId) return;
    setBulkBusy(true);
    try {
      const response = await questionService.createBulkUploadCategories(bulkPreview.batchId);
      setBulkPreview(response.data);
      setShowMissingFields(true);
    } finally {
      setBulkBusy(false);
    }
  }

  async function updateNewColumnValues() {
    if (!bulkPreview?.batchId) return;
    setBulkBusy(true);
    try {
      const response = await questionService.updateNewColumnValues(bulkPreview.batchId);
      setBulkPreview(response.data);
      setBulkResult(null);
    } finally {
      setBulkBusy(false);
    }
  }

  async function approveBulkUpload(uploadAnyway = false) {
    if (!bulkPreview?.batchId) return;
    if (bulkPreview?.requiresNewColumnUpdate) return;
    setBulkBusy(true);
    try {
      if (bulkPreview?.missingCategoriesCount > 0) {
        await questionService.createBulkUploadCategories(bulkPreview.batchId);
      }
      const response = await questionService.approveBulkUpload(bulkPreview.batchId, uploadAnyway, bulkMode === "update");
      setBulkResult(response.data);
      setBulkPreview(response.data);
    } finally {
      setBulkBusy(false);
    }
  }

  function downloadFailedRecords() {
    const rows = bulkResult?.rows?.filter((row) => row.error) || bulkPreview?.rows?.filter((row) => row.error) || [];
    const csv = [
      ["row", "question", "status", "error"],
      ...rows.map((row) => [row.row, row.question, row.status, row.error]),
    ].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "failed-question-upload-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function openQuestionHistory(row) {
    setHistoryQuestion(row);
    setHistoryRows([]);
    setHistoryLoading(true);
    try {
      const response = await questionService.history(row.id);
      setHistoryRows(response?.data || []);
    } finally {
      setHistoryLoading(false);
    }
  }

  const missingCounts = bulkPreview?.missingCounts || {};
  const createdSummary = bulkResult?.createdSummary || bulkPreview?.createdSummary || {};
  const imageSummary = bulkResult?.imageSummary || bulkPreview?.imageSummary || {};
  const newColumnStatus = bulkPreview?.newColumnStatus || bulkResult?.newColumnStatus || {};
  const requiresNewColumnUpdate = Boolean(bulkPreview?.requiresNewColumnUpdate);
  const permissions = getModulePermission(admin, "questions");
  const canViewQuestions = !isEmployee(admin) || permissions.view === true;
  const canCreateQuestions = !isEmployee(admin) || permissions.create === true;
  const canEditQuestions = !isEmployee(admin) || permissions.edit === true;
  const canDeleteQuestions = !isEmployee(admin) || permissions.delete === true;
  const canBulkUploadQuestions = !isEmployee(admin) || permissions.bulkUpload === true;
  const canViewQuestionHistory = !isEmployee(admin);

  if (!canViewQuestions) {
    return (
      <div className="rounded-sm border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h2 className="text-lg font-black">Questions access disabled</h2>
        <p className="mt-2 text-sm">Your employee account does not have permission to view question data.</p>
      </div>
    );
  }

  return (
    <>
    <EntityManagerPage
      title="Questions"
      description="Create and maintain the NEET/JEE question bank."
      service={questionService}
      filterStorageKey="admin.questions.filters"
      refreshSignal={refreshKey}
      searchPlaceholder="Search by question text, passage, or tags..."
      closeEditFormOnSave={false}
      canCreate={canCreateQuestions}
      canEdit={canEditQuestions}
      canDelete={canDeleteQuestions}
      canBulkDelete={canDeleteQuestions}
      renderFormPreview={({ formState, setFormState, lookups, editingItem, navigation }) => (
        <QuestionLivePreview
          formState={formState}
          setFormState={setFormState}
          lookups={lookups}
          editingItem={editingItem}
          navigation={navigation}
        />
      )}
      headerActions={canBulkUploadQuestions ? (
        <>
          <Link className={cn(ui.buttonBase, ui.buttonSecondary)} to="/questions/katex-audit">
            AI Academic Audit
          </Link>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => {
            setBulkMode("upload");
            setBulkCreateMissingQuestions(false);
            setBulkFile(null);
            setBulkPreview(null);
            setBulkResult(null);
            setShowMissingFields(false);
            setBulkOpen(true);
          }}>
            Bulk Upload
          </button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => {
            setBulkMode("update");
            setBulkCreateMissingQuestions(false);
            setBulkFile(null);
            setBulkPreview(null);
            setBulkResult(null);
            setShowMissingFields(false);
            setBulkOpen(true);
          }}>
            Bulk Update
          </button>
        </>
      ) : null}
      mapItemToForm={(item, form) => ({
        ...form,
        examType: item.examType || deriveExamType(item.examMode, item.exam),
        difficultyId: item.difficultyId?.id || item.difficultyId || "",
        topicId: item.topicId?.id || item.topicId || "",
        questionStatus: item.questionStatus || "complete",
        reviewStatus: item.reviewStatus || "ready",
        isVisibleToUsers: item.isVisibleToUsers !== false,
      })}
      lookupLoaders={[
        { key: "examTypes", load: () => listAllRecords(examTypeService, {}, 200) },
        { key: "difficulties", load: () => listAllRecords(difficultyService, { sortBy: "sortOrder", sortOrder: "asc" }, 200) },
        { key: "subjects", load: () => listAllRecords(subjectService, {}, 500) },
        { key: "chapters", load: () => listAllRecords(chapterService, {}, 500) },
        { key: "topics", load: () => listAllRecords(topicService, {}, 500) },
        { key: "years", load: () => listAllRecords(yearService, {}, 200) },
        { key: "questionTypes", load: () => listAllRecords(questionTypeService, {}, 200) },
      ]}
      filters={[
        {
          name: "examType",
          label: "Exam Type",
          placeholder: "All Exam Types",
          options: (lookups) => examTypeOptions(lookups.examTypes || []),
        },
        {
          name: "questionId",
          label: "Question ID",
          placeholder: "Exact ID",
          type: "text",
        },
        {
          name: "lastModifiedFrom",
          label: "Modified From",
          type: "date",
        },
        {
          name: "lastModifiedTo",
          label: "Modified To",
          type: "date",
        },
        {
          name: "subjectId",
          label: "Subject",
          placeholder: "All Subjects",
          options: (lookups, filters) => (lookups.subjects || [])
            .filter((item) => !filters.examType || normalizeQuestionExamType(item.examType) === normalizeQuestionExamType(filters.examType))
            .map((item) => ({ label: formatSubjectLabel(item), value: item.id })),
        },
        {
          name: "chapterId",
          label: "Chapter",
          placeholder: "All Chapters",
          options: (lookups, filters) => (lookups.chapters || [])
            .filter((item) => !filters.subjectId || String(item.subjectId?.id || item.subjectId) === String(filters.subjectId))
            .map((item) => ({ label: item.name, value: item.id })),
        },
        {
          name: "topicId",
          label: "Topic",
          placeholder: "All Topics",
          options: (lookups, filters) => (lookups.topics || [])
            .filter((item) => !filters.chapterId || String(item.chapterId?.id || item.chapterId) === String(filters.chapterId))
            .map((item) => ({ label: item.name, value: item.id })),
        },
        {
          name: "questionStatus",
          label: "Review",
          placeholder: "All Questions",
          options: () => [
            { label: "Complete", value: "complete" },
            { label: "Incomplete Question", value: "incomplete" },
          ],
        },
        {
          name: "exact",
          label: "Exact PYQ",
          placeholder: "All Exact Status",
          options: () => [
            { label: "Exact PYQ", value: true },
            { label: "Not Exact", value: false },
          ],
        },
        {
          name: "questionTypeId",
          label: "Question Type",
          placeholder: "All Types",
          options: (lookups) => (lookups.questionTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.id })),
        },
      ]}
      fields={[
        {
          name: "examType",
          label: "Exam Type",
          required: true,
          type: "select",
          options: (_form, lookups) => examTypeOptions(lookups.examTypes || []),
        },
        {
          name: "subjectId",
          label: "Subject",
          required: true,
          type: "select",
          options: (form, lookups) => (lookups.subjects || [])
            .filter((item) => matchesQuestionSubject(item, form))
            .map((item) => ({ label: formatSubjectLabel(item), value: item.id })),
        },
        { name: "chapterId", label: "Chapter", required: true, type: "select", placeholder: "No chapter", options: (form, lookups) => (lookups.chapters || []).filter((item) => !form.subjectId || item.subjectId?.id === form.subjectId || item.subjectId === form.subjectId).map((item) => ({ label: item.name, value: item.id })) },
        {
          name: "topicId",
          label: "Topic",
          required: true,
          type: "select",
          options: (form, lookups) => (lookups.topics || [])
            .filter((item) => {
              const itemChapterId = item.chapterId?.id || item.chapterId;
              return !form.chapterId || itemChapterId === form.chapterId;
            })
            .map((item) => ({ label: item.name, value: item.id })),
        },
        { name: "yearId", label: "Year", required: false, type: "select", options: (_form, lookups) => uniqueYearOptions(lookups.years || []) },
        {
          name: "questionTypeId",
          label: "Question Type",
          required: true,
          type: "select",
          onChange: syncQuestionTypeSelection,
          options: (form, lookups) => (lookups.questionTypes || [])
            .filter((item) => matchesQuestionType(item, form))
            .map((item) => ({
              label: [
                item.name || item.label || item.key,
                item.displayVariant ? `Display: ${formatDisplayVariant(item.displayVariant)}` : "",
                item.responseType ? `Answer: ${item.responseType}` : "",
              ].filter(Boolean).join(" - "),
              value: item.id,
            })),
        },
        {
          name: "difficultyId",
          label: "Difficulty",
          required: true,
          type: "select",
          options: (_form, lookups) => (lookups.difficulties || []).map((item) => ({ label: item.name, value: item.id })),
        },
        { name: "responseType", label: "Answer Response Type", required: true, type: "select", options: [{ label: "Single Correct", value: "single" }, { label: "Multiple Correct", value: "multiple" }, { label: "Numeric Answer", value: "numeric" }], defaultValue: "single" },
        { name: "questionStatus", label: "Question Status", type: "select", options: [{ label: "Complete", value: "complete" }, { label: "Incomplete Question", value: "incomplete" }], defaultValue: "complete" },
        { name: "reviewStatus", label: "Review Status", type: "select", options: [{ label: "Ready", value: "ready" }, { label: "Needs Review", value: "needs_review" }], defaultValue: "ready" },
        { name: "isVisibleToUsers", label: "Visible To App Users", type: "checkbox", defaultValue: true },
        { name: "question", label: "Question Text", required: true, type: "textarea", full: true },
        {
          name: "questionImageUrl",
          label: "Question Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          full: true,
        },
        { name: "passage", label: "Passage", type: "textarea", full: true },
        { name: "optionA", label: "Option A", required: true, visible: (form) => form.responseType !== "numeric" },
        {
          name: "optionAImageUrl",
          label: "Option A Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          visible: (form) => form.responseType !== "numeric",
        },
        { name: "optionB", label: "Option B", required: true, visible: (form) => form.responseType !== "numeric" },
        {
          name: "optionBImageUrl",
          label: "Option B Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          visible: (form) => form.responseType !== "numeric",
        },
        { name: "optionC", label: "Option C", required: true, visible: (form) => form.responseType !== "numeric" },
        {
          name: "optionCImageUrl",
          label: "Option C Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          visible: (form) => form.responseType !== "numeric",
        },
        { name: "optionD", label: "Option D", required: true, visible: (form) => form.responseType !== "numeric" },
        {
          name: "optionDImageUrl",
          label: "Option D Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          visible: (form) => form.responseType !== "numeric",
        },
        { name: "correctOption", label: "Correct Option", required: true, type: "select", visible: (form) => form.responseType !== "numeric", options: [{ label: "A", value: "A" }, { label: "B", value: "B" }, { label: "C", value: "C" }, { label: "D", value: "D" }] },
        { name: "explanation", label: "Explanation", type: "textarea", full: true },
        {
          name: "explanationImageUrl",
          label: "Explanation Image",
          type: "image-upload",
          upload: (file) => questionService.uploadAsset(file),
          ownUrl: (url) => questionService.ownAssetUrl(url),
          full: true,
        },
        { name: "numericAnswer", label: "Numeric Answer", visible: (form) => form.responseType === "numeric" },
        { name: "conceptTags", label: "Concept Tags", type: "tags", full: true },
        { name: "exact", label: "Exact PYQ", type: "checkbox" },
        { name: "hasDiagram", label: "Has Diagram", type: "checkbox" },
        { name: "isNumerical", label: "Is Numerical", type: "checkbox" },
      ]}
      columns={[
        { key: "id", label: "Question ID", render: (row) => row.id || "-" },
        {
          key: "question",
          label: "Question Title/Preview",
          render: (row) => <MathText className="line-clamp-2 min-w-[220px]">{row.question || "[Image Question]"}</MathText>,
        },
        {
          key: "createdByName",
          label: "Created By",
          render: (row) => (
            <div className="min-w-[140px]">
              <div className="font-semibold text-slate-900">{row.createdByName || "-"}</div>
              <div className="text-xs text-slate-500">{row.createdByEmail || ""}</div>
            </div>
          ),
        },
        { key: "createdAt", label: "Created Date", render: (row) => formatDateTime(row.createdAt) },
        {
          key: "lastModifiedByName",
          label: "Last Modified By",
          render: (row) => (
            <div className="min-w-[140px]">
              <div className="font-semibold text-slate-900">{row.lastModifiedByName || row.createdByName || "-"}</div>
              <div className="text-xs text-slate-500">{row.lastModifiedByEmail || row.createdByEmail || ""}</div>
            </div>
          ),
        },
        { key: "lastModifiedAt", label: "Last Modified Date & Time", render: (row) => formatDateTime(row.lastModifiedAt || row.updatedAt) },
        { key: "editCount", label: "Edit Count", render: (row) => Number(row.editCount || 0) },
        {
          key: "history",
          label: "Question History",
          render: (row) => (
            canViewQuestionHistory ? (
              <button className={cn(ui.buttonBase, ui.buttonSecondary, "px-3 py-2 text-xs")} type="button" onClick={() => openQuestionHistory(row)}>
                View History
              </button>
            ) : "-"
          ),
        },
      ]}
    />
    {historyQuestion ? (
      <EntityFormWrapper
        title="Question History"
        subtitle={`Question ID: ${historyQuestion.id || "-"}`}
        onCancel={() => setHistoryQuestion(null)}
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Close"
      >
        <div className="space-y-4">
          <div className={ui.panel}>
            <div className="grid gap-3 text-sm md:grid-cols-4">
              <span><b>Created By:</b> {historyQuestion.createdByName || "-"}</span>
              <span><b>Created On:</b> {formatDateTime(historyQuestion.createdAt)}</span>
              <span><b>Last Modified By:</b> {historyQuestion.lastModifiedByName || historyQuestion.createdByName || "-"}</span>
              <span><b>Total Edits:</b> {Number(historyQuestion.editCount || 0)}</span>
            </div>
          </div>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Employee/Admin Name</th>
                  <th className={ui.tableHead}>Email Address</th>
                  <th className={ui.tableHead}>Action Performed</th>
                  <th className={ui.tableHead}>Previous Value</th>
                  <th className={ui.tableHead}>Updated Value</th>
                  <th className={ui.tableHead}>Date & Time of Change</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td className={ui.tableCell} colSpan={6}>Loading history...</td></tr>
                ) : historyRows.length ? historyRows.map((entry) => (
                  <tr key={entry.id || entry._id}>
                    <td className={ui.tableCell}>{entry.employeeName || "-"}</td>
                    <td className={ui.tableCell}>{entry.employeeEmail || "-"}</td>
                    <td className={ui.tableCell}>{String(entry.action || "-").toUpperCase()}</td>
                    <td className={ui.tableCell}>
                      <pre className="max-h-40 min-w-[240px] overflow-auto whitespace-pre-wrap rounded-sm bg-slate-50 p-3 text-xs text-slate-700">{formatAuditValue(entry.previousValue)}</pre>
                    </td>
                    <td className={ui.tableCell}>
                      <pre className="max-h-40 min-w-[240px] overflow-auto whitespace-pre-wrap rounded-sm bg-slate-50 p-3 text-xs text-slate-700">{formatAuditValue(entry.updatedValue)}</pre>
                    </td>
                    <td className={ui.tableCell}>{formatDateTime(entry.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td className={ui.tableCell} colSpan={6}>No history found for this question.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </EntityFormWrapper>
    ) : null}
    {bulkOpen ? (
      <EntityFormWrapper
        title={bulkMode === "update" ? "Questions Bulk Update" : "Questions Bulk Upload"}
        subtitle={bulkMode === "update" ? "Upload a file with Question ID or exact Question text, then update only supplied values in batches." : "Upload, validate, create missing fields, approve, and process questions in batches."}
        onCancel={() => setBulkOpen(false)}
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Close"
      >
        <div className="flex flex-col gap-5">
          <div className={ui.field}>
            <label>File Upload</label>
            <input className={ui.input} type="file" accept=".xlsx,.xls,.csv,.json" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} />
          </div>
          {bulkMode === "update" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={bulkCreateMissingQuestions}
                onChange={(event) => setBulkCreateMissingQuestions(event.target.checked)}
              />
              Create new questions when Question ID or Question text is not found
            </label>
          ) : null}
          <div className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 md:grid-cols-4">
            <span className={bulkPreview ? "text-emerald-700" : ""}>1 Upload</span>
            <span className={bulkPreview ? "text-emerald-700" : ""}>2 Validate</span>
            <span className={createdSummary.relatedEntities ? "text-emerald-700" : ""}>3 Create Fields</span>
            <span className={bulkResult ? "text-emerald-700" : ""}>4 Approve & Process</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={!bulkFile || bulkBusy} onClick={validateBulkFile}>
              {bulkBusy ? "Processing..." : "Validate File"}
            </button>
            {bulkPreview?.missingCategoriesCount > 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={bulkBusy} onClick={() => setShowMissingFields((current) => !current)}>
                View Missing Fields
              </button>
            ) : null}
            {bulkPreview?.missingCategoriesCount > 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={bulkBusy} onClick={createMissingCategories}>
                Create Missing Fields
              </button>
            ) : null}
            {requiresNewColumnUpdate ? (
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={bulkBusy} onClick={updateNewColumnValues}>
                Update New Column Values
              </button>
            ) : null}
            {bulkPreview?.totalRows > 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={bulkBusy || requiresNewColumnUpdate} onClick={() => approveBulkUpload(false)}>
                Approve & Upload
              </button>
            ) : null}
            {bulkPreview?.warningCount > 0 || bulkPreview?.invalidCount > 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={bulkBusy || requiresNewColumnUpdate} onClick={() => approveBulkUpload(true)}>
                Approve & Upload Anyway
              </button>
            ) : null}
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={downloadFailedRecords}>
              Download Error Report
            </button>
          </div>

          {bulkBusy ? (
            <div className="space-y-2">
              <div className="admin-progress h-3 rounded-full bg-slate-100" />
              <p className={ui.muted}>Processing bulk questions and image URLs...</p>
            </div>
          ) : null}

          {bulkPreview ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className={ui.metricCard}><div className={ui.metricLabel}>Total Questions</div><div className="text-2xl font-black">{bulkPreview.totalRows}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Valid Questions</div><div className="text-2xl font-black text-emerald-700">{bulkPreview.validCount}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Incomplete Questions</div><div className="text-2xl font-black text-amber-700">{bulkPreview.warningCount || 0}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Invalid Questions</div><div className="text-2xl font-black text-rose-700">{bulkPreview.invalidCount}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Missing Fields</div><div className="text-2xl font-black text-amber-700">{bulkPreview.missingCategoriesCount}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Duplicates</div><div className="text-2xl font-black text-slate-800">{bulkPreview.duplicateCount || 0}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Images Detected</div><div className="text-2xl font-black text-blue-700">{bulkPreview.imageProcessingCount || 0}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Batches</div><div className="text-2xl font-black">{bulkPreview.totalBatches || 0}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Batch Size</div><div className="text-2xl font-black">{bulkPreview.batchSize || 200}</div></div>
              </div>
              <div className={ui.panel}>
                <strong>Missing Fields Summary</strong>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <span>Missing Subjects: <b>{missingCounts.subjects || 0}</b></span>
                  <span>Missing Chapters: <b>{missingCounts.chapters || 0}</b></span>
                  <span>Missing Topics: <b>{missingCounts.topics || 0}</b></span>
                  <span>Missing Types: <b>{missingCounts.question_types || 0}</b></span>
                  <span>Missing Categories: <b>{missingCounts.exam_types || missingCounts.categorys || 0}</b></span>
                  <span>Missing Years: <b>{missingCounts.years || 0}</b></span>
                  <span>Missing Difficulty: <b>{missingCounts.difficultys || 0}</b></span>
                  <span>Image Processing: <b>{bulkPreview.imageProcessingCount || 0}</b></span>
                </div>
              </div>
              {newColumnStatus?.columns?.length ? (
                <div className={ui.panel}>
                  <strong>New Column Values</strong>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    {newColumnStatus.columns.map((column) => (
                      <span key={column.field}>
                        Missing {column.label}: <b>{column.missingCount || 0}</b>
                      </span>
                    ))}
                  </div>
                  {requiresNewColumnUpdate ? (
                    <p className="mt-3 text-sm font-semibold text-amber-700">
                      Update new column values before approving this upload.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                      New column values updated successfully.
                    </p>
                  )}
                </div>
              ) : null}
              <div className={ui.panel}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>Valid Questions</span>
                  <span>{formatPercent(bulkPreview.validPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${formatPercent(bulkPreview.validPercent)}%` }} />
                </div>
              </div>

              {showMissingFields && bulkPreview.missingCategories?.length ? (
                <div className={ui.panel}>
                  <strong>Missing Fields Detected</strong>
                  <div className={ui.tableScroll}>
                    <table className={ui.table}>
                      <thead><tr><th className={ui.tableHead}>Type</th><th className={ui.tableHead}>Name</th><th className={ui.tableHead}>Parent</th><th className={ui.tableHead}>Action</th></tr></thead>
                      <tbody>
                        {bulkPreview.missingCategories.map((item) => (
                          <tr key={`${item.type}-${item.parent}-${item.name}`}>
                            <td className={ui.tableCell}>{item.type}</td>
                            <td className={ui.tableCell}>{item.name}</td>
                            <td className={ui.tableCell}>{item.parent || "-"}</td>
                            <td className={ui.tableCell}>Create</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className={ui.panel}>
                <strong>Final Preview</strong>
                <p className={ui.muted}>Ready: {bulkPreview.completeCount ?? bulkPreview.validCount ?? 0} | Incomplete: {bulkPreview.warningCount || 0} | Failed records: {bulkPreview.invalidCount || 0} | Duplicates: {bulkPreview.duplicateCount || 0} | Images: {bulkPreview.imageProcessingCount || 0}</p>
                <div className={ui.tableScroll}>
                  <table className={ui.table}>
                    <thead><tr><th className={ui.tableHead}>Row</th><th className={ui.tableHead}>Question</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Error</th></tr></thead>
                    <tbody>
                      {(bulkPreview.rows || []).map((row) => (
                        <tr key={row.id || row.row}>
                          <td className={ui.tableCell}>{row.row}</td>
                          <td className={ui.tableCell}><MathText>{row.question}</MathText></td>
                          <td className={ui.tableCell}>{row.status}</td>
                          <td className={ui.tableCell}>{row.error || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {bulkResult ? (
            <div className={ui.panel}>
              <strong>Upload Completion Summary</strong>
              <p className={ui.muted}>
                Total Questions: {bulkResult.totalRows} | Updated: {bulkResult.successfullyUpdatedRows ?? bulkResult.updatedCount ?? 0} | Newly Created: {bulkResult.newlyCreatedRows ?? bulkResult.createdCount ?? 0} | Success: {bulkResult.successfullyUploadedRows ?? bulkResult.successCount} | Failed: {bulkResult.completelyFailedRows ?? bulkResult.failedCount} | Skipped: {bulkResult.skippedCount || bulkResult.skippedDuplicatesCount || 0} | Processing Time: {bulkResult.processingTimeSeconds || 0}s | Uploaded Images: {bulkResult.uploadedImageCount || 0}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <span>Created Subjects: <b>{createdSummary.subjects || 0}</b></span>
                <span>Created Chapters: <b>{createdSummary.chapters || 0}</b></span>
                <span>Created Topics: <b>{createdSummary.topics || 0}</b></span>
                <span>Created Types: <b>{createdSummary.questionTypes || 0}</b></span>
                <span>Images Detected: <b>{imageSummary.detected || 0}</b></span>
                <span>Images Uploaded: <b>{imageSummary.uploaded || bulkResult.uploadedImageCount || 0}</b></span>
                <span>Batch: <b>{bulkResult.currentBatch || bulkPreview?.totalBatches || 0}/{bulkResult.totalBatches || bulkPreview?.totalBatches || 0}</b></span>
                <span>Status: <b>{bulkResult.status || "approved"}</b></span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>Upload Progress</span>
                  <span>{formatPercent(bulkResult.progressPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-blue-600" style={{ width: `${formatPercent(bulkResult.progressPercent)}%` }} />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>Successfully Added</span>
                  <span>{formatPercent(bulkResult.successPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${formatPercent(bulkResult.successPercent)}%` }} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" onClick={() => setBulkOpen(false)}>View Uploaded Questions</button>
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={downloadFailedRecords}>Download Upload Report</button>
              </div>
            </div>
          ) : null}
        </div>
      </EntityFormWrapper>
    ) : null}
    </>
  );
}
