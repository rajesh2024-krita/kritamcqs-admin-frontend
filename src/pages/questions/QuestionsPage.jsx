import { useState } from "react";
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

export function QuestionsPage() {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function validateBulkFile() {
    if (!bulkFile) return;
    setBulkBusy(true);
    try {
      const response = await questionService.validateBulkUpload(bulkFile);
      setBulkPreview(response.data);
      setBulkResult(null);
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
    } finally {
      setBulkBusy(false);
    }
  }

  async function approveBulkUpload() {
    if (!bulkPreview?.batchId) return;
    setBulkBusy(true);
    try {
      const response = await questionService.approveBulkUpload(bulkPreview.batchId);
      setBulkResult(response.data);
      setRefreshKey((current) => current + 1);
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

  return (
    <>
    <EntityManagerPage
      key={refreshKey}
      title="Questions"
      description="Create and maintain the NEET/JEE question bank."
      service={questionService}
      headerActions={(
        <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={() => setBulkOpen(true)}>
          Bulk Upload
        </button>
      )}
      mapItemToForm={(item, form) => ({
        ...form,
        examType: item.examType || deriveExamType(item.examMode, item.exam),
        difficultyId: item.difficultyId?.id || item.difficultyId || "",
        topicId: item.topicId?.id || item.topicId || "",
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
      fields={[
        {
          name: "examType",
          label: "Exam Type",
          required: true,
          type: "select",
          options: (_form, lookups) => (lookups.examTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.name || item.key || item.label })),
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
        { name: "yearId", label: "Year", required: false, type: "select", options: (_form, lookups) => (lookups.years || []).map((item) => ({ label: item.name, value: item.id })) },
        {
          name: "questionTypeId",
          label: "Question Type",
          required: true,
          type: "select",
          options: (form, lookups) => (lookups.questionTypes || [])
            .filter((item) => matchesQuestionType(item, form))
            .map((item) => ({
              label: `${item.name}${item.responseType ? ` (${item.responseType})` : ""}`,
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
        { name: "responseType", label: "Response Type", required: true, type: "select", options: [{ label: "Single", value: "single" }, { label: "Multiple", value: "multiple" }, { label: "Numeric", value: "numeric" }], defaultValue: "single" },
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
        { name: "numericAnswer", label: "Numeric Answer", visible: (form) => form.responseType === "numeric" },
        { name: "conceptTags", label: "Concept Tags", type: "tags", full: true },
        { name: "hasDiagram", label: "Has Diagram", type: "checkbox" },
        { name: "isNumerical", label: "Is Numerical", type: "checkbox" },
      ]}
      columns={[
        { key: "examType", label: "Exam Type", render: (row) => row.examType || deriveExamType(row.examMode, row.exam) },
        { key: "question", label: "Question", render: (row) => `${row.question?.slice(0, 90) || "[Image Question]"}${row.question?.length > 90 ? "..." : ""}` },
        { key: "subjectId", label: "Subject", render: (row) => formatSubjectLabel(row.subjectId) },
        { key: "chapterId", label: "Chapter", render: (row) => row.chapterId?.name || "-" },
        { key: "topicId", label: "Topic", render: (row) => row.topicId?.name || "-" },
        { key: "difficulty", label: "Difficulty", render: (row) => row.difficultyId?.name || row.difficulty || "-" },
        { key: "responseType", label: "Response Type" },
      ]}
    />
    {bulkOpen ? (
      <EntityFormWrapper
        title="Questions Bulk Upload"
        subtitle="Validate the file, create missing fields, then approve valid questions."
        onCancel={() => setBulkOpen(false)}
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Close"
      >
        <div className="flex flex-col gap-5">
          <div className={ui.field}>
            <label>File Upload</label>
            <input className={ui.input} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={!bulkFile || bulkBusy} onClick={validateBulkFile}>
              {bulkBusy ? "Processing..." : "Validate File"}
            </button>
            {bulkPreview?.missingCategoriesCount > 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={bulkBusy} onClick={createMissingCategories}>
                Create Missing Fields
              </button>
            ) : null}
            {bulkPreview?.validCount > 0 && bulkPreview?.missingCategoriesCount === 0 ? (
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={bulkBusy} onClick={approveBulkUpload}>
                Approve & Upload Questions
              </button>
            ) : null}
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" onClick={downloadFailedRecords}>
              Download Failed Records
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
                <div className={ui.metricCard}><div className={ui.metricLabel}>Total Rows</div><div className="text-2xl font-black">{bulkPreview.totalRows}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Valid</div><div className="text-2xl font-black text-emerald-700">{bulkPreview.validCount}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Invalid</div><div className="text-2xl font-black text-rose-700">{bulkPreview.invalidCount}</div></div>
                <div className={ui.metricCard}><div className={ui.metricLabel}>Missing Fields</div><div className="text-2xl font-black text-amber-700">{bulkPreview.missingCategoriesCount}</div></div>
              </div>
              <div className={ui.panel}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                  <span>Valid Questions</span>
                  <span>{formatPercent(bulkPreview.validPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${formatPercent(bulkPreview.validPercent)}%` }} />
                </div>
              </div>

              {bulkPreview.missingCategories?.length ? (
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
                <strong>Preview</strong>
                <div className={ui.tableScroll}>
                  <table className={ui.table}>
                    <thead><tr><th className={ui.tableHead}>Row</th><th className={ui.tableHead}>Question</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Error</th></tr></thead>
                    <tbody>
                      {(bulkPreview.rows || []).map((row) => (
                        <tr key={row.id || row.row}>
                          <td className={ui.tableCell}>{row.row}</td>
                          <td className={ui.tableCell}>{row.question}</td>
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
              <strong>Final Result</strong>
              <p className={ui.muted}>Total Questions: {bulkResult.totalRows} | Successfully Uploaded: {bulkResult.successCount} | Failed: {bulkResult.failedCount}</p>
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
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" onClick={() => setBulkOpen(false)}>Go to Questions List</button>
            </div>
          ) : null}
        </div>
      </EntityFormWrapper>
    ) : null}
    </>
  );
}
