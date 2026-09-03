import { useEffect, useMemo, useState } from "react";
import { mockTestService } from "../../api/mockTestService";
import { subjectService } from "../../api/subjectService";
import { chapterService } from "../../api/chapterService";
import { topicService } from "../../api/topicService";
import { ConfirmDeleteModal } from "../../components/common/ConfirmDeleteModal";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { MathText } from "../../components/common/MathText";
import { EntityFormWrapper } from "../../components/forms/EntityFormWrapper";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { Pagination } from "../../components/tables/Pagination";
import { SearchBar } from "../../components/tables/SearchBar";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import { EditIcon, PlusIcon, RefreshIcon, TrashIcon } from "../../components/common/AdminIcons";
import { Award, Calendar, Clock, Download, Layers, RotateCw, Settings, Users, Zap } from "lucide-react";

const PRESET_CONFIG = {
  NEET_REAL: {
    examType: "NEET",
    durationMinutes: 180,
    marksPerQuestion: 4,
    negativeMarks: 1,
    maxScore: 720,
    predictionTitle: "Predicted NEET Score",
    predictionDescription: "This mock follows the NEET real exam pattern and predicts your likely real-exam scoring level.",
    instructions: [
      "Biology has 90 MCQs, Physics has 45 MCQs, and Chemistry has 45 MCQs.",
      "Correct answer +4, wrong answer -1, unattempted 0.",
      "Total questions 180, total marks 720, duration 180 minutes.",
    ],
  },
  JEE_REAL: {
    examType: "JEE",
    durationMinutes: 180,
    marksPerQuestion: 4,
    negativeMarks: 1,
    maxScore: 300,
    predictionTitle: "Predicted JEE Score",
    predictionDescription: "This mock follows the JEE real exam pattern and predicts your likely real-exam scoring level.",
    instructions: [
      "Physics, Chemistry, and Maths question counts follow the saved JEE pattern blueprint.",
      "MCQ marking: correct +4, wrong -1, unanswered 0.",
      "Numerical marking follows the configured JEE Main pattern.",
      "Total questions and marks follow the saved JEE pattern blueprint.",
      "Chemistry is usually the fastest-scoring section, while Maths is the most time-consuming.",
    ],
  },
  CUSTOM: {
    examType: "NEET",
    durationMinutes: 60,
    marksPerQuestion: 4,
    negativeMarks: 1,
    maxScore: 240,
    predictionTitle: "Predicted Mock Score",
    predictionDescription: "This mock predicts the learner score using the custom pattern configured in admin.",
    instructions: [
      "Read every question carefully.",
      "Do not leave easy questions for later.",
      "Review marked questions before submitting.",
    ],
  },
};

const WEEKDAY_OPTIONS = [
  { value: "SUN", label: "Sun" },
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
];

const defaultMarkingSettings = {
  predictionMinimumMockTests: 5,
  neet: {
    version: "v1",
    mcq: { correct: 4, wrong: -1, unanswered: 0 },
    numerical: { correct: 4, wrong: -1, unanswered: 0 },
    active: true,
  },
  jeeMain: {
    version: "v1",
    mcq: { correct: 4, wrong: -1, unanswered: 0 },
    numerical: { correct: 4, wrong: 0, unanswered: 0 },
    active: true,
  },
  jeeAdvanced: {
    version: "v1",
    mcq: { correct: 4, wrong: -1, unanswered: 0 },
    numerical: { correct: 4, wrong: 0, unanswered: 0 },
    active: true,
  },
};

function getDefaultSchemeForExam(markingSettings, examType) {
  if (examType === "JEE") return markingSettings?.jeeMain || defaultMarkingSettings.jeeMain;
  return markingSettings?.neet || defaultMarkingSettings.neet;
}

function getPresetWithMarking(presetKey, markingSettings) {
  const preset = PRESET_CONFIG[presetKey] || PRESET_CONFIG.CUSTOM;
  const scheme = getDefaultSchemeForExam(markingSettings, preset.examType);
  return {
    ...preset,
    marksPerQuestion: Number(scheme?.mcq?.correct ?? preset.marksPerQuestion),
    negativeMarks: Math.abs(Number(scheme?.mcq?.wrong ?? -preset.negativeMarks)),
  };
}

const defaultForm = {
  title: "",
  description: "",
  examType: "NEET",
  testType: "full",
  subjectId: "",
  difficulty: "mixed",
  startDate: "",
  endDate: "",
  generationMode: "fixed",
  generationFrequency: "daily",
  generationTime: "00:00",
  isOneTimeFree: false,
  questionCount: 30,
  patternPreset: "NEET_REAL",
  durationMinutes: 180,
  isPremiumOnly: false,
  isActive: true,
  instructions: PRESET_CONFIG.NEET_REAL.instructions.join("\n"),
  marksPerQuestion: 4,
  negativeMarks: 1,
  maxScore: 720,
  predictionTitle: PRESET_CONFIG.NEET_REAL.predictionTitle,
  predictionDescription: PRESET_CONFIG.NEET_REAL.predictionDescription,
  availabilityMode: "all",
  availableDaysOfMonth: [],
  availableWeekdays: [],
  freeAccessDurationValue: 1,
  freeAccessDurationUnit: "days",
  premiumDurationType: "daily",
  premiumValidityDays: 1,
  autoDailyQuestionRearrangement: false,
  autoDailyQuestionGeneration: false,
  questionIds: [],
  markingOverrideEnabled: false,
  markingSchemeVersion: "v1",
  selectionMix: null,
  generationConfig: null,
  includedQuestionIds: [],
  automaticQuestionDistribution: [],
};

const defaultAutoGenerateForm = {
  title: "",
  examType: "NEET",
  subjectIds: [],
  difficulty: "mixed",
  isPremiumOnly: false,
  isActive: true,
  randomizeQuestionOrder: true,
  markingOverrideEnabled: false,
  premiumDurationType: "daily",
  premiumValidityDays: 1,
  autoDailyQuestionRearrangement: true,
  autoDailyQuestionGeneration: true,
  unusedQuestionPercentage: 100,
  incorrectQuestionPercentage: 0,
  usedQuestionPercentage: 0,
  includedQuestionIdsText: "",
};

const defaultGenerationSchedule = {
  enabled: false,
  recurrenceType: "weekly",
  weeklyDays: ["FRI"],
  monthlyDay: 1,
  generationTime: "09:00",
  examType: "NEET",
  subjectIds: [],
  chapterIds: [],
  difficulty: "mixed",
  questionCount: 0,
  unusedQuestionPercentage: 100,
  incorrectQuestionPercentage: 0,
  usedQuestionPercentage: 0,
  includedQuestionIdsText: "",
  titlePrefix: "Premium Auto Mock",
};

const defaultGenerationSchedules = {
  NEET: { ...defaultGenerationSchedule, examType: "NEET" },
  JEE: { ...defaultGenerationSchedule, examType: "JEE" },
};

const defaultSubjectSettings = {
  enabled: true, premiumAccess: true, freeAccess: false,
  defaultQuestionCount: 10, maximumQuestionCount: 50,
  unlimitedQuestions: false,
  prioritizeUnseenQuestions: true, allowQuestionReuse: true,
  accessCardTitle: "Subject-Based Mock Test",
  accessCardMessage: "Subject-based mock test access is not enabled for this account.",
  accessCardCtaText: "View Plans",
  accessCardSubscriptionUrl: "/subscription",
  accessCardHtml: `<div class="subject-mock-access-card__icon" aria-hidden="true">&#128274;</div>
<h2 id="subject-mock-access-title">{{title}}</h2>
<p>{{message}}</p>
<a href="{{subscriptionUrl}}">{{ctaText}}</a>`,
  accessCardCss: `.subject-mock-access-card{box-sizing:border-box;width:min(100%,680px);margin:24px auto;padding:32px;border:1px solid #ddd6fe;border-radius:24px;background:linear-gradient(135deg,#faf5ff,#eff6ff);color:#1e1b4b;text-align:center;font-family:system-ui,sans-serif}.subject-mock-access-card__icon{font-size:28px}.subject-mock-access-card h2{font-size:clamp(1.25rem,4vw,1.8rem)}.subject-mock-access-card p{color:#475569;line-height:1.65}.subject-mock-access-card a{display:inline-flex;min-height:48px;align-items:center;border-radius:14px;background:#6d28d9;padding:12px 28px;color:#fff;text-decoration:none;font-weight:800}@media(max-width:480px){.subject-mock-access-card{margin:12px 0;padding:22px 16px}.subject-mock-access-card a{width:100%;justify-content:center}}`,
};

function buildFormFromItem(item) {
  return {
    title: item.title || "",
    description: item.description || "",
    examType: item.examType || "NEET",
    testType: item.testType || "full",
    subjectId: item.subjectId || "",
    difficulty: item.difficulty || "mixed",
    startDate: item.startDate ? String(item.startDate).slice(0, 10) : "",
    endDate: item.endDate ? String(item.endDate).slice(0, 10) : "",
    generationMode: item.generationMode || "fixed",
    generationFrequency: item.generationFrequency || "daily",
    generationTime: item.generationTime || "00:00",
    isOneTimeFree: Boolean(item.isOneTimeFree),
    questionCount: item.totalQuestions || 30,
    patternPreset: item.patternPreset || "CUSTOM",
    durationMinutes: item.durationMinutes || 60,
    isPremiumOnly: Boolean(item.isPremiumOnly),
    isActive: Boolean(item.isActive),
    instructions: Array.isArray(item.instructions) ? item.instructions.join("\n") : "",
    marksPerQuestion: item.marksPerQuestion || 4,
    negativeMarks: item.negativeMarks || 1,
    maxScore: item.maxScore || 0,
    predictionTitle: item.predictionTitle || item.prediction?.title || "",
    predictionDescription: item.predictionDescription || item.prediction?.description || "",
    availabilityMode: item.availabilityMode || "all",
    availableDaysOfMonth: Array.isArray(item.availableDaysOfMonth) ? item.availableDaysOfMonth : [],
    availableWeekdays: Array.isArray(item.availableWeekdays) ? item.availableWeekdays : [],
    freeAccessDurationValue: item.freeAccessDurationValue || 1,
    freeAccessDurationUnit: item.freeAccessDurationUnit || "days",
    premiumDurationType: item.premiumDurationType || "daily",
    premiumValidityDays: item.premiumValidityDays || 1,
    autoDailyQuestionRearrangement: Boolean(item.autoDailyQuestionRearrangement),
    autoDailyQuestionGeneration: Boolean(item.autoDailyQuestionGeneration),
    questionIds: item.questionIds || [],
    markingOverrideEnabled: Boolean(item.markingOverrideEnabled),
    markingSchemeVersion: item.markingSchemeVersion || "v1",
    selectionMix: item.selectionMix || item.generationConfig?.selectionMix || null,
    generationConfig: item.generationConfig || null,
    includedQuestionIds: Array.isArray(item.includedQuestionIds) ? item.includedQuestionIds : [],
    automaticQuestionDistribution: Array.isArray(item.generationConfig?.automaticQuestionDistribution)
      ? item.generationConfig.automaticQuestionDistribution
      : [],
  };
}

function applyPresetToForm(presetKey, previousForm, markingSettings) {
  const preset = getPresetWithMarking(presetKey, markingSettings);
  const scheme = getDefaultSchemeForExam(markingSettings, preset.examType);
  return {
    ...previousForm,
    patternPreset: presetKey,
    examType: preset.examType,
    durationMinutes: preset.durationMinutes,
    marksPerQuestion: preset.marksPerQuestion,
    negativeMarks: preset.negativeMarks,
    maxScore: preset.maxScore,
    predictionTitle: preset.predictionTitle,
    predictionDescription: preset.predictionDescription,
    instructions: preset.instructions.join("\n"),
    markingSchemeVersion: scheme.version || previousForm.markingSchemeVersion || "v1",
    markingOverrideEnabled: previousForm.markingOverrideEnabled ?? false,
  };
}

function parseDaysOfMonth(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item, index, array) => Number.isInteger(item) && item >= 1 && item <= 31 && array.indexOf(item) === index)
    .sort((a, b) => a - b);
}

function formatAvailability(item) {
  if (item.availabilityMode === "day_wise") {
    return item.availableDaysOfMonth?.length ? `Month days: ${item.availableDaysOfMonth.join(", ")}` : "Month days not set";
  }
  if (item.availabilityMode === "week_wise") {
    return item.availableWeekdays?.length ? `Weekdays: ${item.availableWeekdays.join(", ")}` : "Weekdays not set";
  }
  return "All days";
}

function parseBlueprintNumber(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getBlueprintQuestionCount(blueprints, examType) {
  const blueprint = (blueprints || []).find((item) => String(item.key || "").toUpperCase() === String(examType || "").toUpperCase());
  const subjectTotal = (blueprint?.subjectWise || []).reduce((sum, item) => sum + parseBlueprintNumber(item?.questions), 0);
  if (subjectTotal > 0) return subjectTotal;
  const summaryRow = (blueprint?.summary || []).find((item) => String(item?.label || "").toLowerCase().includes("total questions"));
  return parseBlueprintNumber(summaryRow?.value);
}

function getRequiredQuestionCount(formState, blueprints = []) {
  if (formState.patternPreset === "NEET_REAL" || formState.patternPreset === "JEE_REAL") {
    const blueprintCount = getBlueprintQuestionCount(blueprints, formState.examType);
    if (blueprintCount > 0) return blueprintCount;
  }
  if (formState.patternPreset === "NEET_REAL") return 180;
  if (formState.patternPreset === "JEE_REAL") return 90;
  return 0;
}

const DEFAULT_AUTOMATIC_SUBJECT_ROWS = {
  NEET: [
    { subject: "Biology", questions: 90, mcqQuestions: 90, numericQuestions: 0 },
    { subject: "Physics", questions: 45, mcqQuestions: 45, numericQuestions: 0 },
    { subject: "Chemistry", questions: 45, mcqQuestions: 45, numericQuestions: 0 },
  ],
  JEE: [
    { subject: "Physics", questions: 30, mcqQuestions: 20, numericQuestions: 10 },
    { subject: "Chemistry", questions: 30, mcqQuestions: 20, numericQuestions: 10 },
    { subject: "Mathematics", questions: 30, mcqQuestions: 20, numericQuestions: 10 },
  ],
};

function getDefaultTypeSplit(examType, subjectName, totalQuestions) {
  if (examType === "NEET") return { mcqCount: Number(totalQuestions || 0), numericCount: 0 };
  if (examType === "JEE") {
    const total = Number(totalQuestions || 0);
    const numericCount = Math.max(0, Math.round(total / 3));
    return { mcqCount: Math.max(0, total - numericCount), numericCount };
  }
  return { mcqCount: Number(totalQuestions || 0), numericCount: 0 };
}

function buildDefaultAutomaticDistribution(examType, subjectRows = [], catalogSubjects = []) {
  const rows = subjectRows.length
    ? subjectRows
    : DEFAULT_AUTOMATIC_SUBJECT_ROWS[examType] || catalogSubjects.map((subject) => ({ subject: subject.name, questions: 0 }));
  return rows.map((row) => {
    const subjectName = String(row.subject || "").trim();
    const catalogSubject = catalogSubjects.find((subject) => String(subject.name || "").toLowerCase() === subjectName.toLowerCase());
    const totalQuestions = parseBlueprintNumber(row.questions);
    const hasAutomaticSplit = row.mcqQuestions !== undefined || row.numericQuestions !== undefined || row.mcqCount !== undefined || row.numericCount !== undefined;
    const split = hasAutomaticSplit
      ? {
          mcqCount: Math.max(0, Number(row.mcqQuestions ?? row.mcqCount ?? 0)),
          numericCount: Math.max(0, Number(row.numericQuestions ?? row.numericCount ?? 0)),
        }
      : getDefaultTypeSplit(examType, subjectName, totalQuestions);
    return {
      subjectId: catalogSubject?.id || "",
      subjectName,
      mcqCount: split.mcqCount,
      numericCount: split.numericCount,
    };
  }).filter((row) => row.subjectName);
}

function getBlueprintForExam(blueprints = [], examType) {
  return (blueprints || []).find((item) => String(item.key || "").toUpperCase() === String(examType || "").toUpperCase());
}

function getAutomaticPatternRows(blueprint, examType) {
  if (Array.isArray(blueprint?.automaticPattern) && blueprint.automaticPattern.length) return blueprint.automaticPattern;
  return DEFAULT_AUTOMATIC_SUBJECT_ROWS[examType] || blueprint?.subjectWise || [];
}

function getAutomaticPatternSummary(blueprint) {
  const rows = Array.isArray(blueprint?.automaticPattern) ? blueprint.automaticPattern : [];
  const mcqTotal = rows.reduce((sum, row) => sum + Number(row.mcqQuestions ?? row.mcqCount ?? 0), 0);
  const numericTotal = rows.reduce((sum, row) => sum + Number(row.numericQuestions ?? row.numericCount ?? 0), 0);
  return { mcqTotal, numericTotal, total: mcqTotal + numericTotal };
}

function getSubjectWiseTotal(blueprint) {
  return (blueprint?.subjectWise || []).reduce((sum, row) => sum + parseBlueprintNumber(row.questions), 0);
}

const BLUEPRINT_TABLES = [
  { key: "summary", title: "Answer Sheet", fields: [["label", "Question"], ["value", "Answer"]] },
  { key: "subjectWise", title: "Subject Wise", fields: [["subject", "Subject"], ["questions", "Questions"], ["marks", "Marks"], ["weightage", "Weightage %"]] },
  { key: "automaticPattern", title: "Automatic Pattern", fields: [["subject", "Subject"], ["mcqQuestions", "MCQ Questions"], ["numericQuestions", "Numeric Questions"]] },
  { key: "chapterWise", title: "Chapter Wise Blueprint", fields: [["subject", "Subject"], ["chapter", "Chapter"], ["expectedQuestions", "Expected Questions"]] },
  { key: "topicWise", title: "Topic Wise Rules", fields: [["subject", "Subject"], ["chapter", "Chapter"], ["topic", "Topic"], ["expectedQuestions", "Expected Questions"]] },
  { key: "rules", title: "Mock Test Rules", fields: [["rule", "Rule"], ["value", "Value"]] },
];

function getBlueprintSummaryValue(blueprint, labelPart) {
  const found = (blueprint?.summary || []).find((item) => String(item.label || "").toLowerCase().includes(labelPart.toLowerCase()));
  return found?.value || "-";
}

export function MockTestsPage({ freeOnly = false, subjectOnly = false } = {}) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ createdDate: "", active: "", examType: "", testType: "", subjectId: "", premium: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionSubjectId, setQuestionSubjectId] = useState("");
  const [questionChapterId, setQuestionChapterId] = useState("");
  const [questionTopicId, setQuestionTopicId] = useState("");
  const [questionResults, setQuestionResults] = useState([]);
  const [questionMeta, setQuestionMeta] = useState(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [knownSelectedQuestions, setKnownSelectedQuestions] = useState([]);
  const [dayInput, setDayInput] = useState("");
  const [autoForm, setAutoForm] = useState(defaultAutoGenerateForm);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [rowRegenerating, setRowRegenerating] = useState({});
  const [historyModal, setHistoryModal] = useState(null);
  const [markingSettings, setMarkingSettings] = useState(defaultMarkingSettings);
  const [savingMarkingSettings, setSavingMarkingSettings] = useState(false);
  const [verifiedAdminPassword, setVerifiedAdminPassword] = useState("");
  const [replacementTarget, setReplacementTarget] = useState(null);
  const [patternBlueprints, setPatternBlueprints] = useState([]);
  const [blueprintEditor, setBlueprintEditor] = useState(null);
  const [savingBlueprint, setSavingBlueprint] = useState(false);
  const [generationSchedules, setGenerationSchedules] = useState(defaultGenerationSchedules);
  const [generationLogs, setGenerationLogs] = useState([]);
  const [savingGenerationSchedule, setSavingGenerationSchedule] = useState(false);
  const [runningGenerationNow, setRunningGenerationNow] = useState(false);
  const [subjectSettings, setSubjectSettings] = useState(defaultSubjectSettings);
  const [savingSubjectSettings, setSavingSubjectSettings] = useState(false);
  const [accessUserSearch, setAccessUserSearch] = useState("");
  const [accessUsers, setAccessUsers] = useState([]);
  const [generatedSubjectTests, setGeneratedSubjectTests] = useState([]);
  const [generatedSubjectSearch, setGeneratedSubjectSearch] = useState("");
  const [generatedSubjectLoading, setGeneratedSubjectLoading] = useState(false);

  const selectedQuestionIds = formState.questionIds || [];
  const requiredQuestionCount = getRequiredQuestionCount(formState, patternBlueprints);
  const questionCountValidationMessage = formState.generationMode !== "automatic" && requiredQuestionCount && selectedQuestionIds.length !== requiredQuestionCount
    ? `The mock test requires ${requiredQuestionCount} questions based on the selected ${formState.examType} pattern, but only ${selectedQuestionIds.length} questions are currently selected.`
    : "";

  const selectedQuestions = useMemo(() => {
    const known = new Map([
      ...questionResults.map((item) => [item.id, item]),
      ...knownSelectedQuestions.map((item) => [item.id, item]),
    ]);
    return selectedQuestionIds.map((id) => known.get(id) || { id, question: "Selected question", subjectName: "-", chapterName: "-", topicName: "-", difficulty: "-" });
  }, [questionResults, knownSelectedQuestions, selectedQuestionIds]);

  const filteredChapters = useMemo(
    () => chapters.filter((item) => !questionSubjectId || String(item.subjectId?.id || item.subjectId) === String(questionSubjectId)),
    [chapters, questionSubjectId],
  );
  const filteredTopics = useMemo(
    () => topics.filter((item) =>
      (!questionSubjectId || String(item.subjectId?.id || item.subjectId) === String(questionSubjectId)) &&
      (!questionChapterId || String(item.chapterId?.id || item.chapterId) === String(questionChapterId))
    ),
    [topics, questionSubjectId, questionChapterId],
  );
  const formSubjects = useMemo(
    () => subjects.filter((item) => item.examType === formState.examType),
    [subjects, formState.examType],
  );
  const automaticDistributionRows = useMemo(() => (
    formState.automaticQuestionDistribution?.length
      ? formState.automaticQuestionDistribution
      : buildDefaultAutomaticDistribution(
          formState.examType,
          subjectOnly && formState.subjectId
            ? [{ subject: formSubjects.find((subject) => subject.id === formState.subjectId)?.name || "Subject", questions: Number(formState.questionCount || 0) }]
            : getAutomaticPatternRows(getBlueprintForExam(patternBlueprints, formState.examType), formState.examType),
          subjectOnly && formState.subjectId ? formSubjects.filter((subject) => subject.id === formState.subjectId) : formSubjects,
        )
  ), [formState.automaticQuestionDistribution, formState.examType, formState.questionCount, formState.subjectId, formSubjects, patternBlueprints, subjectOnly]);
  const automaticSummary = useMemo(() => {
    const mcqTotal = automaticDistributionRows.reduce((sum, row) => sum + Number(row.mcqCount || 0), 0);
    const numericTotal = automaticDistributionRows.reduce((sum, row) => sum + Number(row.numericCount || 0), 0);
    const selectedTotal = mcqTotal + numericTotal;
    const requiredTotal = requiredQuestionCount || Number(formState.questionCount || 0);
    const difference = selectedTotal - requiredTotal;
    return { mcqTotal, numericTotal, selectedTotal, requiredTotal, difference };
  }, [automaticDistributionRows, formState.questionCount, requiredQuestionCount]);
  const automaticValidationMessage = formState.generationMode === "automatic" && automaticSummary.requiredTotal > 0 && automaticSummary.selectedTotal !== automaticSummary.requiredTotal
    ? `Automatic configuration must total exactly ${automaticSummary.requiredTotal} questions. Current total is ${automaticSummary.selectedTotal}.`
    : "";

  const lockedReplacement = Boolean(replacementTarget);
  const autoExamSubjects = useMemo(
    () => subjects.filter((item) => autoForm.examType === "BOTH" || item.examType === autoForm.examType),
    [subjects, autoForm.examType],
  );
  function updateGenerationSchedule(examType, updater) {
    setGenerationSchedules((current) => ({
      ...current,
      [examType]: typeof updater === "function" ? updater(current[examType]) : updater,
    }));
  }

  function buildListParams(nextQuery = query) {
    return {
      ...nextQuery,
      search,
      ...(filters.createdDate ? { createdDate: filters.createdDate } : {}),
      ...(filters.active ? { isActive: filters.active } : {}),
      ...(filters.examType ? { examType: filters.examType } : {}),
      testType: subjectOnly ? "subject" : "full",
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.premium ? { isPremiumOnly: filters.premium } : {}),
      ...(freeOnly ? { isPremiumOnly: "false" } : {}),
    };
  }

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const response = await mockTestService.list(buildListParams(nextQuery));
      setItems(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const [subjectsResponse, chaptersResponse, topicsResponse, markingSettingsResponse, patternBlueprintsResponse, scheduleResponse, logsResponse] = await Promise.all([
        subjectService.list({ limit: 200 }),
        chapterService.list({ limit: 500 }),
        topicService.list({ limit: 1000 }),
        mockTestService.getMarkingSettings(),
        mockTestService.listPatternBlueprints(),
        mockTestService.getGenerationSchedule(),
        mockTestService.listGenerationLogs({ limit: 100 }),
      ]);
      setSubjects(subjectsResponse.data || []);
      setChapters(chaptersResponse.data || []);
      setTopics(topicsResponse.data || []);
      setPatternBlueprints(patternBlueprintsResponse.data || []);
      const schedules = Array.isArray(scheduleResponse.data) ? scheduleResponse.data : [scheduleResponse.data].filter(Boolean);
      setGenerationSchedules(Object.fromEntries(["NEET", "JEE"].map((examType) => {
        const schedule = schedules.find((item) => item.examType === examType) || {};
        return [examType, {
          ...defaultGenerationSchedules[examType],
          ...schedule,
          examType,
          includedQuestionIdsText: (schedule.includedQuestionIds || []).join(", "),
        }];
      })));
      setGenerationLogs(logsResponse.data || []);
      const nextMarkingSettings = {
        predictionMinimumMockTests: markingSettingsResponse.data?.predictionMinimumMockTests || defaultMarkingSettings.predictionMinimumMockTests,
        neet: markingSettingsResponse.data?.neet || defaultMarkingSettings.neet,
        jeeMain: markingSettingsResponse.data?.jeeMain || defaultMarkingSettings.jeeMain,
        jeeAdvanced: markingSettingsResponse.data?.jeeAdvanced || defaultMarkingSettings.jeeAdvanced,
      };
      setMarkingSettings(nextMarkingSettings);
      const neetScheme = getDefaultSchemeForExam(nextMarkingSettings, "NEET");
      setFormState((current) => ({
        ...current,
        marksPerQuestion: Number(neetScheme?.mcq?.correct ?? current.marksPerQuestion),
        negativeMarks: Math.abs(Number(neetScheme?.mcq?.wrong ?? -current.negativeMarks)),
        markingSchemeVersion: neetScheme?.version || current.markingSchemeVersion || "v1",
      }));
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function loadQuestions(nextPage = questionPage) {
    if (!showForm) return;
    if (subjectOnly && formState.generationMode === "automatic") return;
    setQuestionLoading(true);
    try {
      const response = await mockTestService.listQuestions({
        page: nextPage,
        limit: 10,
        search: questionSearch,
        examType: formState.examType,
        subjectId: formState.testType === "subject" ? formState.subjectId : questionSubjectId,
        chapterId: lockedReplacement ? replacementTarget.chapterId : questionChapterId,
        topicId: lockedReplacement ? replacementTarget.topicId : questionTopicId,
      });
      setQuestionResults(response.data || []);
      setQuestionMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setQuestionLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    if (!subjectOnly) return;
    setGeneratedSubjectLoading(true);
    Promise.all([mockTestService.getSubjectSettings(), mockTestService.searchSubjectAccessUsers(""), mockTestService.listGeneratedSubjectTests({ limit: 50 })])
      .then(([settingsResponse, usersResponse, generatedResponse]) => {
        setSubjectSettings({ ...defaultSubjectSettings, ...(settingsResponse.data || {}) });
        setAccessUsers(usersResponse.data || []);
        setGeneratedSubjectTests(generatedResponse.data || []);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setGeneratedSubjectLoading(false));
  }, [subjectOnly]);

  async function loadGeneratedSubjectTests() {
    setGeneratedSubjectLoading(true);
    try {
      const response = await mockTestService.listGeneratedSubjectTests({ limit: 50, search: generatedSubjectSearch });
      setGeneratedSubjectTests(response.data || []);
    } catch (error) { toast.error(error.message); }
    finally { setGeneratedSubjectLoading(false); }
  }

  async function saveSubjectSettings() {
    setSavingSubjectSettings(true);
    try {
      const response = await mockTestService.saveSubjectSettings({
        ...subjectSettings,
        defaultQuestionCount: Number(subjectSettings.defaultQuestionCount),
        maximumQuestionCount: Number(subjectSettings.maximumQuestionCount),
      });
      setSubjectSettings({ ...defaultSubjectSettings, ...(response.data || {}) });
      toast.success(response.message || "Subject mock settings saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingSubjectSettings(false);
    }
  }

  async function searchAccessUsers() {
    try {
      const response = await mockTestService.searchSubjectAccessUsers(accessUserSearch);
      setAccessUsers(response.data || []);
    } catch (error) { toast.error(error.message); }
  }

  async function updateAccessUser(userId, access) {
    try {
      const response = await mockTestService.updateSubjectUserAccess(userId, access);
      setAccessUsers((current) => current.map((user) => user.id === userId ? response.data : user));
      toast.success(response.message);
    } catch (error) { toast.error(error.message); }
  }

  useEffect(() => {
    loadItems(query);
  }, [query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadItems({ ...current, page: 1 });
        return current;
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, filters.createdDate, filters.active, filters.examType, filters.testType, filters.subjectId, filters.premium]);

  useEffect(() => {
    if (!showForm) return;
    const timeout = window.setTimeout(() => {
      loadQuestions(questionPage);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [showForm, questionSearch, questionSubjectId, questionChapterId, questionTopicId, formState.examType, formState.testType, formState.subjectId, questionPage, selectedQuestionIds.join(","), replacementTarget?.id]);

  useEffect(() => {
    if (!showForm || formState.markingOverrideEnabled) return;
    const scheme = getDefaultSchemeForExam(markingSettings, formState.examType);
    setFormState((current) => ({
      ...current,
      marksPerQuestion: Number(scheme?.mcq?.correct ?? current.marksPerQuestion),
      negativeMarks: Math.abs(Number(scheme?.mcq?.wrong ?? -current.negativeMarks)),
      markingSchemeVersion: scheme?.version || current.markingSchemeVersion || "v1",
    }));
  }, [showForm, formState.examType, formState.markingOverrideEnabled, markingSettings]);

  function openCreate() {
    setEditingItem(null);
    setVerifiedAdminPassword("");
    setReplacementTarget(null);
    const presetWithMarking = getPresetWithMarking(defaultForm.patternPreset, markingSettings);
    const scheme = getDefaultSchemeForExam(markingSettings, presetWithMarking.examType);
    setFormState({
      ...defaultForm,
      testType: subjectOnly ? "subject" : "full",
      patternPreset: subjectOnly ? "CUSTOM" : defaultForm.patternPreset,
      examType: presetWithMarking.examType,
      durationMinutes: presetWithMarking.durationMinutes,
      marksPerQuestion: presetWithMarking.marksPerQuestion,
      negativeMarks: presetWithMarking.negativeMarks,
      maxScore: presetWithMarking.maxScore,
      instructions: presetWithMarking.instructions.join("\n"),
      predictionTitle: presetWithMarking.predictionTitle,
      predictionDescription: presetWithMarking.predictionDescription,
      markingSchemeVersion: scheme.version || "v1",
      markingOverrideEnabled: false,
      isPremiumOnly: subjectOnly,
      generationMode: "fixed",
      automaticQuestionDistribution: [],
    });
    setQuestionSearch("");
    setQuestionSubjectId("");
    setQuestionChapterId("");
    setQuestionTopicId("");
    setKnownSelectedQuestions([]);
    setQuestionPage(1);
    setDayInput("");
    setShowForm(true);
  }

  async function openEdit(item) {
    const adminPassword = window.prompt("Enter Admin Password to edit this mock test pattern");
    if (!adminPassword) return;
    try {
      await mockTestService.verifyEditPassword(adminPassword);
      setVerifiedAdminPassword(adminPassword);
      toast.success("Admin password verified");
    } catch (error) {
      toast.error(error.message || "Admin password verification failed");
      return;
    }
    const nextForm = buildFormFromItem(item);
    setEditingItem(item);
    setFormState(nextForm);
    setQuestionSearch("");
    setQuestionSubjectId("");
    setQuestionChapterId("");
    setQuestionTopicId("");
    setKnownSelectedQuestions(Array.isArray(item.manualQuestions) ? item.manualQuestions : Array.isArray(item.questions) ? item.questions : []);
    setQuestionPage(1);
    setDayInput((nextForm.availableDaysOfMonth || []).join(", "));
    setReplacementTarget(null);
    setShowForm(true);
  }

  function toggleQuestion(questionId) {
    const selectedRow = questionResults.find((item) => item.id === questionId);
    if (replacementTarget) {
      if (!selectedRow) return;
      const sameSubject = String(selectedRow.subjectId || "") === String(replacementTarget.subjectId || "");
      const sameChapter = String(selectedRow.chapterId || "") === String(replacementTarget.chapterId || "");
      const sameTopic = String(selectedRow.topicId || "") === String(replacementTarget.topicId || "");
      if (!sameSubject || !sameChapter || !sameTopic) {
        toast.error("Replacement must match the same Subject, Chapter, and Topic");
        return;
      }
      setKnownSelectedQuestions((known) => (
        known.some((item) => item.id === selectedRow.id) ? known : [...known, selectedRow]
      ));
      setFormState((current) => ({
        ...current,
        questionIds: current.questionIds.map((id) => id === replacementTarget.id ? questionId : id),
      }));
      setReplacementTarget(null);
      toast.success("Question replaced without changing pattern weightage");
      return;
    }
    const isAlreadySelected = selectedQuestionIds.includes(questionId);
    if (!isAlreadySelected && selectedRow) {
      setKnownSelectedQuestions((known) => (
        known.some((item) => item.id === selectedRow.id) ? known : [...known, selectedRow]
      ));
    }
    setFormState((current) => {
      const exists = current.questionIds.includes(questionId);
      return {
        ...current,
        questionIds: exists ? current.questionIds.filter((id) => id !== questionId) : [...current.questionIds, questionId],
      };
    });
  }

  function resetAutomaticDistribution(examType, currentSubjects = formSubjects) {
    const blueprint = getBlueprintForExam(patternBlueprints, examType);
    return buildDefaultAutomaticDistribution(examType, getAutomaticPatternRows(blueprint, examType), currentSubjects.filter((subject) => subject.examType === examType));
  }

  function updateAutomaticDistribution(index, field, value) {
    setFormState((current) => {
      const rows = current.automaticQuestionDistribution?.length
        ? [...current.automaticQuestionDistribution]
        : buildDefaultAutomaticDistribution(
            current.examType,
            getAutomaticPatternRows(getBlueprintForExam(patternBlueprints, current.examType), current.examType),
            subjects.filter((subject) => subject.examType === current.examType),
          );
      rows[index] = { ...(rows[index] || {}), [field]: Math.max(0, Number(value || 0)) };
      return {
        ...current,
        automaticQuestionDistribution: rows,
        questionCount: rows.reduce((sum, row) => sum + Number(row.mcqCount || 0) + Number(row.numericCount || 0), 0),
      };
    });
  }

  function removeSelectedQuestion(questionId) {
    setFormState((current) => ({ ...current, questionIds: current.questionIds.filter((id) => id !== questionId) }));
  }

  function beginReplaceQuestion(item) {
    if (!item.subjectId || !item.chapterId || !item.topicId) {
      toast.error("This question is missing Subject, Chapter, or Topic metadata and cannot be safely replaced.");
      return;
    }
    setReplacementTarget(item);
    setQuestionSubjectId(item.subjectId);
    setQuestionChapterId(item.chapterId);
    setQuestionTopicId(item.topicId);
    setQuestionSearch("");
    setQuestionPage(1);
  }

  function toggleWeekday(weekday) {
    setFormState((current) => {
      const exists = current.availableWeekdays.includes(weekday);
      return {
        ...current,
        availableWeekdays: exists ? current.availableWeekdays.filter((item) => item !== weekday) : [...current.availableWeekdays, weekday],
      };
    });
  }

  function toggleAutoSubject(subjectId) {
    setAutoForm((current) => {
      const exists = current.subjectIds.includes(subjectId);
      return {
        ...current,
        subjectIds: exists ? current.subjectIds.filter((id) => id !== subjectId) : [...current.subjectIds, subjectId],
      };
    });
  }

  function toggleScheduleDay(examType, day) {
    updateGenerationSchedule(examType, (current) => {
      const days = current.weeklyDays || [];
      const exists = days.includes(day);
      const nextDays = exists ? days.filter((item) => item !== day) : [...days, day];
      return { ...current, weeklyDays: nextDays.length ? nextDays : ["FRI"] };
    });
  }

  function toggleScheduleSubject(examType, subjectId) {
    updateGenerationSchedule(examType, (current) => {
      const exists = current.subjectIds.includes(subjectId);
      return {
        ...current,
        subjectIds: exists ? current.subjectIds.filter((id) => id !== subjectId) : [...current.subjectIds, subjectId],
        chapterIds: [],
      };
    });
  }

  function toggleScheduleChapter(examType, chapterId) {
    updateGenerationSchedule(examType, (current) => {
      const exists = current.chapterIds.includes(chapterId);
      return {
        ...current,
        chapterIds: exists ? current.chapterIds.filter((id) => id !== chapterId) : [...current.chapterIds, chapterId],
      };
    });
  }

  async function refreshGenerationLogs() {
    const response = await mockTestService.listGenerationLogs({ limit: 100 });
    setGenerationLogs(response.data || []);
  }

  async function handleSaveGenerationSchedule() {
    setSavingGenerationSchedule(true);
    try {
      const responses = await Promise.all(Object.values(generationSchedules).map((schedule) => mockTestService.saveGenerationSchedule({
        ...schedule,
        recurrenceType: "weekly",
        monthlyDay: Number(schedule.monthlyDay || 1),
        questionCount: Number(schedule.questionCount || 0),
        unusedQuestionPercentage: Number(schedule.unusedQuestionPercentage || 0),
        incorrectQuestionPercentage: Number(schedule.incorrectQuestionPercentage || 0),
        usedQuestionPercentage: Number(schedule.usedQuestionPercentage || 0),
        includedQuestionIds: String(schedule.includedQuestionIdsText || "").split(/[\s,]+/).map((item) => item.trim()).filter(Boolean),
      })));
      setGenerationSchedules(Object.fromEntries(responses.map((response) => [response.data.examType, {
        ...defaultGenerationSchedules[response.data.examType],
        ...response.data,
        includedQuestionIdsText: (response.data.includedQuestionIds || []).join(", "),
      }])));
      toast.success("NEET and JEE generation settings saved independently");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingGenerationSchedule(false);
    }
  }

  async function handleRunGenerationNow() {
    setRunningGenerationNow(true);
    try {
      const response = await mockTestService.runGenerationScheduleNow();
      if (response.success) toast.success(response.message);
      else toast.error(response.message);
      await Promise.all([loadItems({ ...query, page: 1 }), refreshGenerationLogs()]);
    } catch (error) {
      toast.error(error.message);
      await refreshGenerationLogs().catch(() => { });
    } finally {
      setRunningGenerationNow(false);
    }
  }

  async function handleAutoGenerate() {
    setAutoGenerating(true);
    try {
      const payload = {
        ...autoForm,
        isPremiumOnly: false,
        difficulty: autoForm.difficulty === "mixed" ? "" : autoForm.difficulty,
        title: String(autoForm.title || "").trim() || undefined,
        unusedQuestionPercentage: Number(autoForm.unusedQuestionPercentage || 0),
        incorrectQuestionPercentage: Number(autoForm.incorrectQuestionPercentage || 0),
        usedQuestionPercentage: Number(autoForm.usedQuestionPercentage || 0),
        includedQuestionIds: String(autoForm.includedQuestionIdsText || "")
          .split(/[\s,]+/)
          .map((item) => item.trim())
          .filter(Boolean),
        markingSchemeVersion: getDefaultSchemeForExam(markingSettings, autoForm.examType).version,
      };
      const response = await mockTestService.autoGenerate(payload);
      toast.success("Mock test generated. Review and save to publish.");
      setAutoForm({ ...defaultAutoGenerateForm, isPremiumOnly: false });
      if (response?.data) {
        setEditingItem(null);
        setFormState(buildFormFromItem(response.data));
        setQuestionResults(response.data.manualQuestions || []);
        setShowForm(true);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAutoGenerating(false);
    }
  }

  async function handleRegenerate(item) {
    const adminPassword = window.prompt("Enter Admin Password to regenerate this mock test pattern");
    if (!adminPassword) return;
    const key = String(item.id);
    setRowRegenerating((current) => ({ ...current, [key]: true }));
    try {
      await mockTestService.regenerate(item.id, { adminPassword });
      toast.success("Mock test regenerated");
      await loadItems({ ...query, page: query.page });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRowRegenerating((current) => ({ ...current, [key]: false }));
    }
  }

  async function handleOpenGenerationHistory(item) {
    try {
      const response = await mockTestService.generationHistory(item.id);
      setHistoryModal({
        id: item.id,
        title: item.title,
        generationSource: response?.data?.generationSource || "manual",
        generationConfig: response?.data?.generationConfig || null,
        history: Array.isArray(response?.data?.history) ? response.data.history : [],
      });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleSaveMarkingSettings() {
    setSavingMarkingSettings(true);
    try {
      const payload = {
        predictionMinimumMockTests: Number(markingSettings.predictionMinimumMockTests || 5),
        neet: markingSettings.neet,
        jeeMain: markingSettings.jeeMain,
        jeeAdvanced: markingSettings.jeeAdvanced,
      };
      const response = await mockTestService.saveMarkingSettings(payload);
      setMarkingSettings({
        predictionMinimumMockTests: response.data?.predictionMinimumMockTests || payload.predictionMinimumMockTests,
        neet: response.data?.neet || payload.neet,
        jeeMain: response.data?.jeeMain || payload.jeeMain,
        jeeAdvanced: response.data?.jeeAdvanced || payload.jeeAdvanced,
      });
      toast.success("Marking settings saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingMarkingSettings(false);
    }
  }

  async function openBlueprintEditor(blueprint) {
    const adminPassword = window.prompt(`Enter Admin Password to edit ${blueprint.title || blueprint.key} blueprint`);
    if (!adminPassword) return;
    try {
      await mockTestService.verifyEditPassword(adminPassword);
      setBlueprintEditor({
        adminPassword,
        data: {
          ...JSON.parse(JSON.stringify(blueprint)),
          automaticPattern: getAutomaticPatternRows(blueprint, blueprint.key),
        },
      });
      toast.success("Admin password verified");
    } catch (error) {
      toast.error(error.message || "Admin password verification failed");
    }
  }

  function updateBlueprintCell(tableKey, rowIndex, field, value) {
    setBlueprintEditor((current) => {
      if (!current) return current;
      const rows = Array.isArray(current.data?.[tableKey]) ? [...current.data[tableKey]] : [];
      rows[rowIndex] = { ...(rows[rowIndex] || {}), [field]: value };
      return { ...current, data: { ...current.data, [tableKey]: rows } };
    });
  }

  function addBlueprintRow(tableKey, fields) {
    setBlueprintEditor((current) => {
      if (!current) return current;
      const blank = Object.fromEntries(fields.map(([field]) => [field, ""]));
      return {
        ...current,
        data: {
          ...current.data,
          [tableKey]: [...(current.data?.[tableKey] || []), blank],
        },
      };
    });
  }

  function removeBlueprintRow(tableKey, rowIndex) {
    setBlueprintEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          [tableKey]: (current.data?.[tableKey] || []).filter((_, index) => index !== rowIndex),
        },
      };
    });
  }

  async function handleSaveBlueprint(event) {
    event.preventDefault();
    if (!blueprintEditor?.data?.key) return;
    const subjectTotal = getSubjectWiseTotal(blueprintEditor.data);
    const automaticPatternSummary = getAutomaticPatternSummary(blueprintEditor.data);
    if (blueprintEditor.data.key === "NEET" && automaticPatternSummary.numericTotal > 0) {
      toast.error("NEET automatic pattern supports MCQ questions only");
      return;
    }
    if (subjectTotal > 0 && automaticPatternSummary.total > 0 && automaticPatternSummary.total !== subjectTotal) {
      toast.error(`Automatic pattern total must equal subject-wise total questions (${subjectTotal})`);
      return;
    }
    setSavingBlueprint(true);
    try {
      const response = await mockTestService.updatePatternBlueprint(blueprintEditor.data.key, {
        ...blueprintEditor.data,
        adminPassword: blueprintEditor.adminPassword,
      });
      setPatternBlueprints((current) => current.map((item) => item.key === response.data?.key ? response.data : item));
      setBlueprintEditor(null);
      toast.success("Pattern blueprint updated");
    } catch (error) {
      toast.error(error.message || "Unable to save pattern blueprint");
    } finally {
      setSavingBlueprint(false);
    }
  }

  function updateMarkingRule(examKey, sectionKey, field, value) {
    setMarkingSettings((current) => ({
      ...current,
      [examKey]: {
        ...(current[examKey] || {}),
        [sectionKey]: {
          ...(current[examKey]?.[sectionKey] || {}),
          [field]: Number(value),
        },
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (formState.generationMode !== "automatic" && (formState.questionIds || []).length < 2) {
        toast.error("Select at least two questions for a manual mock test");
        return;
      }
      if (formState.generationMode === "automatic" && (!Number.isInteger(Number(formState.questionCount)) || Number(formState.questionCount) < 2)) {
        toast.error("Enter an automatic question count of at least 2");
        return;
      }
      if (automaticValidationMessage) {
        toast.error(automaticValidationMessage);
        return;
      }
      if (questionCountValidationMessage) {
        toast.error(questionCountValidationMessage);
        return;
      }
      const parsedDays = parseDaysOfMonth(dayInput);
      const payload = {
        ...formState,
        durationMinutes: Number(formState.durationMinutes),
        marksPerQuestion: Number(formState.marksPerQuestion),
        negativeMarks: Number(formState.negativeMarks),
        maxScore: Number(formState.maxScore),
        questionCount: Number(formState.questionCount || 0),
        isPremiumOnly: subjectOnly ? true : freeOnly ? false : Boolean(formState.isPremiumOnly),
        markingSchemeVersion: String(formState.markingSchemeVersion || getDefaultSchemeForExam(markingSettings, formState.examType).version || "v1"),
        markingOverrideEnabled: Boolean(formState.markingOverrideEnabled),
        freeAccessDurationValue: Number(formState.freeAccessDurationValue || 1),
        freeAccessDurationUnit: formState.freeAccessDurationUnit || "days",
        availableDaysOfMonth: formState.availabilityMode === "day_wise" ? parsedDays : [],
        availableWeekdays: formState.availabilityMode === "week_wise" ? formState.availableWeekdays : [],
        selectionMix: formState.selectionMix || undefined,
        generationConfig: formState.generationConfig || undefined,
        includedQuestionIds: Array.isArray(formState.includedQuestionIds) ? formState.includedQuestionIds : [],
        automaticQuestionDistribution: formState.generationMode === "automatic" ? automaticDistributionRows : undefined,
        instructions: formState.instructions
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      if (editingItem) {
        await mockTestService.update(editingItem.id, { ...payload, adminPassword: verifiedAdminPassword });
        toast.success("Mock test updated");
      } else {
        await mockTestService.create(payload);
        toast.success("Mock test created");
      }
      setShowForm(false);
      await loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete() {
    try {
      await mockTestService.remove(deleteItem.id);
      toast.success("Mock test deleted");
      setDeleteItem(null);
      await loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDownload(item) {
    try {
      const blob = await mockTestService.download(item.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${String(item.slug || item.title || "mock-test").replace(/[^a-z0-9_-]+/gi, "-")}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || "Unable to download mock test");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {subjectOnly ? (
        <div className={`${ui.panel} space-y-4`}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className={ui.eyebrow}>Subject-Based Mock Tests</div>
              <p className={ui.muted}>Manage NEET and JEE subject tests independently. Changes here do not affect full mock tests.</p>
            </div>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} /> Create Subject Mock Test
            </button>
          </div>
          <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2 xl:grid-cols-4">
            <ToggleSwitch checked={subjectSettings.enabled} onChange={(enabled) => setSubjectSettings((current) => ({ ...current, enabled }))} label="Feature enabled" />
            <ToggleSwitch checked={subjectSettings.premiumAccess} onChange={(premiumAccess) => setSubjectSettings((current) => ({ ...current, premiumAccess }))} label="Premium user access" />
            <ToggleSwitch checked={subjectSettings.freeAccess} onChange={(freeAccess) => setSubjectSettings((current) => ({ ...current, freeAccess }))} label="Free user access" />
            <ToggleSwitch checked={subjectSettings.prioritizeUnseenQuestions} onChange={(prioritizeUnseenQuestions) => setSubjectSettings((current) => ({ ...current, prioritizeUnseenQuestions }))} label="Prioritize unseen questions" />
            <ToggleSwitch checked={subjectSettings.allowQuestionReuse} onChange={(allowQuestionReuse) => setSubjectSettings((current) => ({ ...current, allowQuestionReuse }))} label="Allow question reuse" />
            <ToggleSwitch checked={subjectSettings.unlimitedQuestions} onChange={(unlimitedQuestions) => setSubjectSettings((current) => ({ ...current, unlimitedQuestions }))} label="Unlimited questions" />
            <label className={ui.field}><span>Question Limit</span><input className={ui.input} type="number" min="1" max="200" disabled={subjectSettings.unlimitedQuestions} value={subjectSettings.defaultQuestionCount} onChange={(event) => setSubjectSettings((current) => ({ ...current, defaultQuestionCount: event.target.value, maximumQuestionCount: event.target.value }))} /><small className="text-slate-500">{subjectSettings.unlimitedQuestions ? "Disabled while unlimited questions is enabled." : "The app generates exactly this many questions and never exceeds it."}</small></label>
            <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary, "self-end")} disabled={savingSubjectSettings} onClick={() => void saveSubjectSettings()}>{savingSubjectSettings ? "Saving..." : "Save Common Settings"}</button>
          </div>
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div>
              <div className={ui.eyebrow}>Free User Access Card</div>
              <p className={ui.muted}>Configure the card returned by the app backend. HTML supports <code>{"{{title}}"}</code>, <code>{"{{message}}"}</code>, <code>{"{{ctaText}}"}</code>, and <code>{"{{subscriptionUrl}}"}</code>.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={ui.field}><span>Card title</span><input className={ui.input} value={subjectSettings.accessCardTitle || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardTitle: event.target.value }))} /></label>
              <label className={ui.field}><span>Button text</span><input className={ui.input} value={subjectSettings.accessCardCtaText || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardCtaText: event.target.value }))} /></label>
              <label className={`${ui.field} md:col-span-2`}><span>Free-user message</span><textarea className={ui.input} rows={3} value={subjectSettings.accessCardMessage || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardMessage: event.target.value }))} /></label>
              <label className={`${ui.field} md:col-span-2`}><span>Subscription page link</span><input className={ui.input} value={subjectSettings.accessCardSubscriptionUrl || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardSubscriptionUrl: event.target.value }))} placeholder="/subscription or https://..." /></label>
              <label className={ui.field}><span>Card HTML</span><textarea className={`${ui.input} min-h-72 font-mono text-xs`} value={subjectSettings.accessCardHtml || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardHtml: event.target.value }))} spellCheck={false} /></label>
              <label className={ui.field}><span>Card CSS</span><textarea className={`${ui.input} min-h-72 font-mono text-xs`} value={subjectSettings.accessCardCss || ""} onChange={(event) => setSubjectSettings((current) => ({ ...current, accessCardCss: event.target.value }))} spellCheck={false} /></label>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Responsive preview</p>
              <iframe
                title="Subject mock access card preview"
                sandbox=""
                className="h-96 w-full rounded-xl border border-slate-200 bg-white"
                srcDoc={`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${String(subjectSettings.accessCardCss || "").replace(/<\/?style\b[^>]*>/gi, "")}</style><section class="subject-mock-access-card">${String(subjectSettings.accessCardHtml || "").replace(/{{title}}/g, subjectSettings.accessCardTitle || "").replace(/{{message}}/g, subjectSettings.accessCardMessage || "").replace(/{{ctaText}}/g, subjectSettings.accessCardCtaText || "").replace(/{{subscriptionUrl}}/g, subjectSettings.accessCardSubscriptionUrl || "/subscription")}</section>`}
              />
            </div>
            <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={savingSubjectSettings} onClick={() => void saveSubjectSettings()}>{savingSubjectSettings ? "Saving..." : "Save Access Card"}</button>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 flex gap-2"><input className={ui.input} value={accessUserSearch} onChange={(event) => setAccessUserSearch(event.target.value)} placeholder="Search free user by name, email or mobile" /><button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void searchAccessUsers()}>Search</button></div>
            <div className="max-h-56 overflow-auto rounded border border-slate-200">
              {accessUsers.map((accessUser) => <div key={accessUser.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-xs">
                <div><p className="font-bold text-slate-800">{accessUser.name || accessUser.mobile || "User"}</p><p className="text-slate-500">{accessUser.email || accessUser.mobile || "-"} {accessUser.isPremium ? "· Premium" : "· Free"}</p></div>
                <select className={ui.input} value={accessUser.subjectMockTestAccess === true ? "enabled" : accessUser.subjectMockTestAccess === false ? "disabled" : "inherit"} onChange={(event) => void updateAccessUser(accessUser.id, event.target.value === "enabled" ? true : event.target.value === "disabled" ? false : null)}><option value="inherit">Use common rule</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select>
              </div>)}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div><p className="text-sm font-bold text-slate-900">User-generated tests and attempts</p><p className={ui.muted}>Each generated selection and every submitted attempt is shown separately.</p></div>
              <div className="flex gap-2"><input className={ui.input} value={generatedSubjectSearch} onChange={(event) => setGeneratedSubjectSearch(event.target.value)} placeholder="Search user or selection" /><button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void loadGeneratedSubjectTests()}>Search</button></div>
            </div>
            <div className="max-h-[28rem] overflow-auto rounded border border-slate-200">
              <table className="w-full min-w-[1100px] text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500"><tr><th className="p-2">User</th><th className="p-2">Exam / Selection</th><th className="p-2">Questions</th><th className="p-2">Attempt</th><th className="p-2">Result</th><th className="p-2">Time</th><th className="p-2">Date & Time</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedSubjectTests.map((row) => <tr key={`${row.generatedTestId}-${row.attemptId || "generated"}`} className="align-top">
                    <td className="p-2"><p className="font-bold text-slate-800">{row.user?.name || row.user?.mobile || "User"}</p><p className="text-[10px] text-slate-500">{row.user?.email || row.user?.mobile || row.user?.id}</p></td>
                    <td className="p-2"><p className="font-bold">{row.examType} · {(row.subjects || []).join(", ") || "-"}</p><p className="text-[10px] text-slate-500">Chapters: {(row.chapters || []).join(", ") || "-"}</p><p className="text-[10px] text-slate-500">Topics: {(row.topics || []).join(", ") || "-"}</p></td>
                    <td className="p-2 font-semibold">{row.questionCount || row.totalQuestions || 0}</td>
                    <td className="p-2"><span className={ui.badge}>{row.attemptNumber ? `#${row.attemptNumber}` : "Generated"}</span></td>
                    <td className="p-2"><p className="font-bold">{row.attemptId ? `${row.score} (${row.percentage}%)` : "Not submitted"}</p>{row.attemptId ? <p className="text-[10px] text-slate-500">{row.correctAnswers} correct · {row.wrongAnswers} wrong · {row.unansweredQuestions} unanswered</p> : null}</td>
                    <td className="p-2">{row.attemptId ? `${Math.floor(Number(row.timeTaken || 0) / 60)}m ${Number(row.timeTaken || 0) % 60}s` : "-"}</td>
                    <td className="p-2">{new Date(row.attemptedAt || row.generatedAt).toLocaleString()}</td>
                  </tr>)}
                  {!generatedSubjectLoading && !generatedSubjectTests.length ? <tr><td colSpan="7" className="p-6 text-center text-slate-500">No user-generated subject tests found.</td></tr> : null}
                  {generatedSubjectLoading ? <tr><td colSpan="7" className="p-6 text-center text-slate-500">Loading generated tests...</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
      {/* <div className={ui.panel}>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className={ui.eyebrow}>Assessment Control</div>
            <p className={ui.muted}>{freeOnly ? "Manage free mock tests with enable/disable options and free access duration." : "Create NEET and JEE mock tests with real score prediction, fixed papers, and schedule-based availability."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={ui.badge}>{meta?.total ?? items.length} tests</div>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} />
              {subjectOnly ? "Create Subject Mock Test" : freeOnly ? "Create Free Mock Test" : "Create Mock Test"}
            </button>
          </div>
        </div>
      </div> */}

      {!subjectOnly ? <div className="space-y-3">
        {/* Pattern Blueprints */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <Layers size={14} className="text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Pattern Blueprints</h3>
            <span className="text-[10px] text-slate-400">(Read-only)</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {patternBlueprints.map((blueprint) => (
              <div key={blueprint.key} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {blueprint.title || `${blueprint.key} Pattern`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(blueprint.chapterWise || []).length} chapters · {(blueprint.topicWise || []).length} topics
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    type="button"
                    onClick={() => void openBlueprintEditor(blueprint)}
                  >
                    <EditIcon size={11} />
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
                    {getBlueprintSummaryValue(blueprint, "total questions")} Qs
                  </span>
                  <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-medium text-emerald-700">
                    {getBlueprintSummaryValue(blueprint, "total marks")} marks
                  </span>
                  {(blueprint.subjectWise || []).slice(0, 3).map((item) => (
                    <span key={`${blueprint.key}-${item.subject}`} className="inline-flex px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-medium text-slate-600">
                      {item.subject}: {item.questions}
                    </span>
                  ))}
                  {(() => {
                    const autoSummary = getAutomaticPatternSummary({ ...blueprint, automaticPattern: getAutomaticPatternRows(blueprint, blueprint.key) });
                    return (
                      <span className="inline-flex px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[9px] font-medium text-blue-700">
                        Auto: {autoSummary.mcqTotal} MCQ / {autoSummary.numericTotal} Numeric
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Patterns are read-only until Edit is clicked and Admin Password is verified.</p>
        </div>

        {/* Premium Scheduler */}
        {!freeOnly && (
          <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-600" />
                <h3 className="text-xs font-semibold text-slate-900">Premium Scheduler</h3>
                <span className="text-[10px] text-slate-400">Auto-generate mock tests</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700 rounded transition-colors disabled:opacity-50"
                  type="button"
                  disabled={runningGenerationNow}
                  onClick={() => void handleRunGenerationNow()}
                >
                  {runningGenerationNow ? "Generating..." : "Run Now"}
                </button>
                <button
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-medium text-white rounded transition-colors disabled:opacity-50"
                  type="button"
                  disabled={savingGenerationSchedule}
                  onClick={() => void handleSaveGenerationSchedule()}
                >
                  {savingGenerationSchedule ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {["NEET", "JEE"].map((examType) => {
                const schedule = generationSchedules[examType];
                const examSubjects = subjects.filter((item) => item.examType === examType);
                const selectedSubjects = new Set(schedule.subjectIds.map(String));
                const examChapters = chapters.filter((item) =>
                  item.examType === examType &&
                  (!selectedSubjects.size || selectedSubjects.has(String(item.subjectId?.id || item.subjectId)))
                );
                const examLogs = generationLogs.filter((log) =>
                  log.examType === examType && ["weekly", "manual"].includes(log.scheduleType)
                );

                return (
                  <div key={examType} className="bg-slate-50 rounded-lg border border-slate-200/50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{examType}</span>
                        <span className="text-[10px] text-slate-400">Weekly</span>
                      </div>
                      <ToggleSwitch
                        checked={Boolean(schedule.enabled)}
                        onChange={(enabled) => updateGenerationSchedule(examType, (current) => ({ ...current, enabled }))}
                        label=""
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Time</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          type="time"
                          value={schedule.generationTime}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, generationTime: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Difficulty</label>
                        <select
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          value={schedule.difficulty}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, difficulty: event.target.value }))}
                        >
                          <option value="mixed">Mixed</option>
                          <option value="easy">Easy</option>
                          <option value="moderate">Moderate</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Question Count</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          type="number"
                          min="0"
                          max="300"
                          value={schedule.questionCount}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, questionCount: event.target.value }))}
                          placeholder="0 uses blueprint"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Title Prefix</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          value={schedule.titlePrefix}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, titlePrefix: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Unused %</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          type="number"
                          min="0"
                          max="100"
                          value={schedule.unusedQuestionPercentage}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, unusedQuestionPercentage: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Incorrect %</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          type="number"
                          min="0"
                          max="100"
                          value={schedule.incorrectQuestionPercentage}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, incorrectQuestionPercentage: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Used %</label>
                        <input
                          className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          type="number"
                          min="0"
                          max="100"
                          value={schedule.usedQuestionPercentage}
                          onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, usedQuestionPercentage: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Weekly Days</label>
                      <div className="flex flex-wrap gap-1">
                        {WEEKDAY_OPTIONS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            className={cn(
                              "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors",
                              schedule.weeklyDays.includes(day.value)
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => toggleScheduleDay(examType, day.value)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Subjects</label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {examSubjects.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            className={cn(
                              "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors",
                              schedule.subjectIds.includes(subject.id)
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => toggleScheduleSubject(examType, subject.id)}
                          >
                            {subject.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Chapters</label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {examChapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            type="button"
                            className={cn(
                              "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors",
                              schedule.chapterIds.includes(chapter.id)
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => toggleScheduleChapter(examType, chapter.id)}
                          >
                            {chapter.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Specific Question IDs</label>
                      <textarea
                        className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[30px]"
                        rows={1}
                        value={schedule.includedQuestionIdsText}
                        onChange={(event) => updateGenerationSchedule(examType, (current) => ({ ...current, includedQuestionIdsText: event.target.value }))}
                        placeholder="Comma or space separated"
                      />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <h4 className="text-[10px] font-semibold text-slate-700 mb-1.5">{examType} Weekly Tests</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {examLogs.length > 0 ? (
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-200">
                                <th className="text-left py-0.5 font-medium">Generated</th>
                                <th className="text-left py-0.5 font-medium">Test</th>
                                <th className="text-left py-0.5 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {examLogs.map((log) => (
                                <tr key={log.id} className="border-b border-slate-100">
                                  <td className="py-0.5 text-[9px] text-slate-600">{new Date(log.generatedAt).toLocaleDateString()}</td>
                                  <td className="py-0.5 text-[9px] text-slate-600 truncate max-w-[100px]">{log.testName || log.message || "-"}</td>
                                  <td className="py-0.5">
                                    <span className={cn(
                                      "inline-flex px-1 py-0.5 text-[8px] font-medium rounded",
                                      log.status === "success"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-700"
                                    )}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-[10px] text-slate-400 py-1">No weekly tests generated yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto Generation */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <Zap size={14} className="text-amber-600" />
            <h3 className="text-xs font-semibold text-slate-900">Auto Generate Mock Test</h3>
            <span className="text-[10px] text-slate-400">Quick creation</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Exam Type</label>
              <select
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={autoForm.examType}
                onChange={(event) => setAutoForm((current) => ({ ...current, examType: event.target.value, subjectIds: [] }))}
              >
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Difficulty</label>
              <select
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={autoForm.difficulty}
                onChange={(event) => setAutoForm((current) => ({ ...current, difficulty: event.target.value }))}
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Title (Optional)</label>
              <input
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={autoForm.title}
                onChange={(event) => setAutoForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Auto title if blank"
              />
            </div>
            {!freeOnly && (
              <>
                <div>
                  <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Duration Type</label>
                  <select
                    className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={autoForm.premiumDurationType}
                    onChange={(event) => setAutoForm((current) => ({ ...current, premiumDurationType: event.target.value }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Validity Days</label>
                  <input
                    className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    type="number"
                    min="1"
                    value={autoForm.premiumValidityDays}
                    onChange={(event) => setAutoForm((current) => ({ ...current, premiumValidityDays: event.target.value }))}
                  />
                </div>
              </>
            )}
            {!freeOnly && (
              <div className="flex items-end">
                <ToggleSwitch
                  checked={autoForm.autoDailyQuestionRearrangement}
                  onChange={(value) => setAutoForm((current) => ({ ...current, autoDailyQuestionRearrangement: value }))}
                  label="Daily rearrange"
                  size="sm"
                />
              </div>
            )}
            {!freeOnly && (
              <div className="flex items-end">
                <ToggleSwitch
                  checked={autoForm.autoDailyQuestionGeneration}
                  onChange={(value) => setAutoForm((current) => ({ ...current, autoDailyQuestionGeneration: value }))}
                  label="Daily generate"
                  size="sm"
                />
              </div>
            )}
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Unused %</label>
              <input
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                type="number"
                min="0"
                max="100"
                value={autoForm.unusedQuestionPercentage}
                onChange={(event) => setAutoForm((current) => ({ ...current, unusedQuestionPercentage: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Incorrect %</label>
              <input
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                type="number"
                min="0"
                max="100"
                value={autoForm.incorrectQuestionPercentage}
                onChange={(event) => setAutoForm((current) => ({ ...current, incorrectQuestionPercentage: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Used %</label>
              <input
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                type="number"
                min="0"
                max="100"
                value={autoForm.usedQuestionPercentage}
                onChange={(event) => setAutoForm((current) => ({ ...current, usedQuestionPercentage: event.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Specific Question IDs</label>
              <textarea
                className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[28px]"
                rows={1}
                value={autoForm.includedQuestionIdsText}
                onChange={(event) => setAutoForm((current) => ({ ...current, includedQuestionIdsText: event.target.value }))}
                placeholder="Comma or space separated question IDs"
              />
            </div>
            <div className="flex items-end">
              <button
                className="w-full px-3 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25 disabled:opacity-50"
                type="button"
                disabled={autoGenerating}
                onClick={() => void handleAutoGenerate()}
              >
                {autoGenerating ? "Generating..." : "Generate Mock Test"}
              </button>
            </div>
          </div>

          <div className="mt-2.5">
            <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Subjects (optional)</label>
            <div className="flex flex-wrap gap-1">
              {autoExamSubjects.map((subject) => {
                const active = autoForm.subjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    className={cn(
                      "px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors",
                      active
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                    onClick={() => toggleAutoSubject(subject.id)}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Marking Rules */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-slate-600" />
              <h3 className="text-xs font-semibold text-slate-900">Default Marking Rules</h3>
              <span className="text-[10px] text-slate-400">Used for generated mocks</span>
            </div>
            <button
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-medium text-white rounded transition-colors disabled:opacity-50"
              type="button"
              disabled={savingMarkingSettings}
              onClick={() => void handleSaveMarkingSettings()}
            >
              {savingMarkingSettings ? "Saving..." : "Save Rules"}
            </button>
          </div>

          <div className="mb-3 max-w-xs">
            <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block">Min. Tests for Prediction</label>
            <input
              className="w-full px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="number"
              min="1"
              max="50"
              value={markingSettings.predictionMinimumMockTests || 5}
              onChange={(event) =>
                setMarkingSettings((current) => ({
                  ...current,
                  predictionMinimumMockTests: Number(event.target.value),
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { key: "neet", label: "NEET" },
              { key: "jeeMain", label: "JEE Main" },
              { key: "jeeAdvanced", label: "JEE Advanced" },
            ].map((exam) => (
              <div key={exam.key} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2.5">
                <div className="text-[10px] font-semibold text-slate-900 mb-1.5">{exam.label}</div>
                <div className="mb-1.5">
                  <label className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Version</label>
                  <input
                    className="w-full px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={markingSettings?.[exam.key]?.version || "v1"}
                    onChange={(event) =>
                      setMarkingSettings((current) => ({
                        ...current,
                        [exam.key]: {
                          ...(current?.[exam.key] || {}),
                          version: event.target.value,
                        },
                      }))}
                  />
                </div>
                <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">MCQ</div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="text-[7px] text-slate-400 block">+ve</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.mcq?.correct ?? 4} onChange={(event) => updateMarkingRule(exam.key, "mcq", "correct", event.target.value)} />
                  </div>
                  <div>
                    <label className="text-[7px] text-slate-400 block">-ve</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.mcq?.wrong ?? -1} onChange={(event) => updateMarkingRule(exam.key, "mcq", "wrong", event.target.value)} />
                  </div>
                  <div>
                    <label className="text-[7px] text-slate-400 block">Unans.</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.mcq?.unanswered ?? 0} onChange={(event) => updateMarkingRule(exam.key, "mcq", "unanswered", event.target.value)} />
                  </div>
                </div>
                <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-1 mb-0.5">Numerical</div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="text-[7px] text-slate-400 block">+ve</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.numerical?.correct ?? 4} onChange={(event) => updateMarkingRule(exam.key, "numerical", "correct", event.target.value)} />
                  </div>
                  <div>
                    <label className="text-[7px] text-slate-400 block">-ve</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.numerical?.wrong ?? 0} onChange={(event) => updateMarkingRule(exam.key, "numerical", "wrong", event.target.value)} />
                  </div>
                  <div>
                    <label className="text-[7px] text-slate-400 block">Unans.</label>
                    <input className="w-full px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" type="number" value={markingSettings?.[exam.key]?.numerical?.unanswered ?? 0} onChange={(event) => updateMarkingRule(exam.key, "numerical", "unanswered", event.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search mock tests by title or description..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Created:</span>
                <input
                  className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-28"
                  type="date"
                  value={filters.createdDate}
                  onChange={(event) => setFilters((current) => ({ ...current, createdDate: event.target.value }))}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
                <select
                  className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={filters.active}
                  onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Exam:</span>
                <select
                  className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={filters.examType}
                  onChange={(event) => setFilters((current) => ({ ...current, examType: event.target.value }))}
                >
                  <option value="">All</option>
                  <option value="NEET">NEET</option>
                  <option value="JEE">JEE</option>
                </select>
              </div>
              {subjectOnly ? <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded" value={filters.subjectId} onChange={(event) => setFilters((current) => ({ ...current, subjectId: event.target.value }))}>
                <option value="">All Subjects</option>{subjects.filter((subject) => !filters.examType || subject.examType === filters.examType).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select> : null}
              {!freeOnly ? <select className="px-1.5 py-0.5 text-[9px] bg-slate-50 border border-slate-200 rounded" value={filters.premium} onChange={(event) => setFilters((current) => ({ ...current, premium: event.target.value }))}>
                <option value="">All Access</option><option value="false">Free</option><option value="true">Premium</option>
              </select> : null}
              <button
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors"
                onClick={() => loadItems({ ...query, page: 1 })}
              >
                <RefreshIcon size={9} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>:null}

      {loading ? <LoadingSpinner label="Loading mock tests..." /> : null}
      {!loading && !items.length ? <EmptyState title={`No ${subjectOnly ? "subject " : ""}mock tests found`} description={subjectOnly ? "Create a separate NEET or JEE subject mock test." : "Create your first full-length mock test to publish it in the learner app."} /> : null}
      {!loading && items.length ? (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Title</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Exam</span>
                  </th>
                  {subjectOnly ? <th className="px-2.5 py-1.5 text-left"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Subject</span></th> : null}
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Duration</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Schedule</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Access</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                  </th>
                  <th className="px-2.5 py-1.5 text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Title Column */}
                    <td className="px-2.5 py-2">
                      <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.description || "No description"}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-flex px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-medium text-slate-600">
                          {item.patternPreset || "CUSTOM"}
                        </span>
                        <span className="inline-flex px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-medium text-slate-600">
                          {item.totalQuestions} Qs
                        </span>
                      </div>
                    </td>

                    {/* Exam Column */}
                    <td className="px-2.5 py-2">
                      <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-medium">
                        {item.examType}
                      </span>
                    </td>
                    {subjectOnly ? <td className="px-2.5 py-2"><span className="inline-flex px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded text-[9px] font-medium">{item.subject || "-"}</span></td> : null}

                    {/* Score Column */}
                    <td className="px-2.5 py-2">
                      <div className="text-xs font-semibold text-slate-900">
                        {item.maxScore || item.totalQuestions * item.marksPerQuestion}
                      </div>
                      <div className="text-[9px] text-slate-500">+{item.marksPerQuestion} / -{item.negativeMarks}</div>
                      <div className="text-[8px] text-slate-400">v{item.markingSchemeVersion || "1"}</div>
                    </td>

                    {/* Duration Column */}
                    <td className="px-2.5 py-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-700">{item.durationMinutes} min</span>
                      </div>
                    </td>

                    {/* Schedule Column */}
                    <td className="px-2.5 py-2">
                      <span className="text-[10px] text-slate-600">{formatAvailability(item)}</span>
                    </td>

                    {/* Access Monitor Column */}
                    <td className="px-2.5 py-2">
                      <div className="space-y-0.5 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Users size={10} className="text-slate-400" />
                          <span><span className="font-semibold text-slate-900">{item.completedLearnerCount || 0}</span> completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award size={10} className="text-amber-500" />
                          <span><span className="font-semibold text-amber-600">{item.freeConvertedLearnerCount || 0}</span> converted</span>
                        </div>
                        {item.lastCompletedAt && (
                          <div className="text-[8px] text-slate-400">
                            <Calendar size={8} className="inline mr-0.5" />
                            {new Date(item.lastCompletedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-2.5 py-2">
                      <div className="flex flex-col gap-0.5">
                        {/* Active/Draft Status */}
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 text-[8px] font-medium rounded",
                          item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {item.isActive ? "Active" : "Draft"}
                        </span>

                        {/* Premium/Free Status */}
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 text-[8px] font-medium rounded",
                          item.isPremiumOnly ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {item.isPremiumOnly ? "Premium" : "Free"}
                        </span>

                        {/* Generation Source */}
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 text-[8px] font-medium rounded",
                          item.generationSource === "auto" ? "bg-purple-50 text-purple-700" : "bg-slate-50 text-slate-600"
                        )}>
                          {item.generationSource === "auto" ? "Auto" : "Manual"}
                        </span>

                        {/* Free once, then premium badge */}
                        <span className="inline-flex px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[7px] font-medium text-blue-700">
                          Free once, then premium
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-2.5 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-0.5">
                        <button
                          className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          onClick={() => void openEdit(item)}
                          title="Edit"
                        >
                          <EditIcon size={12} />
                        </button>
                        <button
                          className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                          onClick={() => void handleDownload(item)}
                          title="Download"
                        >
                          <Download size={12} />
                        </button>
                        {item.generationSource === "auto" && (
                          <button
                            className="p-0.5 text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-50"
                            onClick={() => void handleRegenerate(item)}
                            disabled={Boolean(rowRegenerating[String(item.id)])}
                            title="Regenerate"
                          >
                            <RotateCw size={12} className={rowRegenerating[String(item.id)] ? "animate-spin" : ""} />
                          </button>
                        )}
                        <button
                          className="p-0.5 text-slate-600 hover:bg-slate-50 rounded transition-colors"
                          onClick={() => void handleOpenGenerationHistory(item)}
                          title="History"
                        >
                          {/* <History size={12} /> */}
                        </button>
                        <button
                          className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          onClick={() => setDeleteItem(item)}
                          title="Delete"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with record count */}
          <div className="border-t border-slate-100 px-3 py-1.5 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-slate-400">
                {items.length} record{items.length !== 1 ? 's' : ''}
              </span>
              <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingItem ? `Edit ${subjectOnly ? "Subject " : ""}Mock Test` : `Create ${subjectOnly ? "Subject " : ""}Mock Test`}
          subtitle="Set up the test paper, prediction copy, learner availability, and fixed question paper."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Mock Test" : "Create Mock Test"}
          submitDisabled={Boolean(questionCountValidationMessage || automaticValidationMessage || (formState.testType === "subject" && !formState.subjectId))}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={ui.field}>
              <span>Title</span>
              <input className={ui.input} value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Pattern Preset</span>
              <select
                className={ui.input}
                disabled={subjectOnly}
                value={formState.patternPreset}
                onChange={(event) => setFormState((current) => {
                  const next = applyPresetToForm(event.target.value, current, markingSettings);
                  return {
                    ...next,
                    questionIds: [],
                    automaticQuestionDistribution: resetAutomaticDistribution(next.examType),
                  };
                })}
              >
                {!subjectOnly ? <option value="NEET_REAL">NEET Real Pattern</option> : null}
                {!subjectOnly ? <option value="JEE_REAL">JEE Real Pattern</option> : null}
                <option value="CUSTOM">Custom Pattern</option>
              </select>
            </label>
            <input type="hidden" value={subjectOnly ? "subject" : "full"} />
            <label className={ui.field}>
              <span>Exam Type</span>
              <select className={ui.input} value={formState.examType} onChange={(event) => setFormState((current) => ({
                ...current,
                examType: event.target.value,
                subjectId: "",
                questionIds: [],
                generationMode: event.target.value === "BOTH" ? "fixed" : current.generationMode,
                automaticQuestionDistribution: resetAutomaticDistribution(event.target.value),
              }))}>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                {!subjectOnly ? <option value="BOTH">BOTH</option> : null}
              </select>
            </label>
            {subjectOnly ? (
              <label className={ui.field}>
                <span>Subject</span>
                <select className={ui.input} required value={formState.subjectId} onChange={(event) => setFormState((current) => {
                  const selectedSubject = formSubjects.find((subject) => subject.id === event.target.value);
                  const row = selectedSubject
                    ? buildDefaultAutomaticDistribution(current.examType, [{ subject: selectedSubject.name, questions: Number(current.questionCount || 0) }], [selectedSubject])
                    : [];
                  return { ...current, subjectId: event.target.value, questionIds: [], automaticQuestionDistribution: row };
                })}>
                  <option value="">Select subject</option>
                  {formSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
            ) : null}
            {formState.examType !== "BOTH" ? <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
              <span className="mb-2 block text-xs font-bold text-slate-700">Question Selection Mode</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "fixed", label: "Manual" },
                  { value: "automatic", label: "Automatic" },
                ].map((mode) => {
                  const active = formState.generationMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      className={cn(
                        "rounded-sm border px-3 py-2 text-sm font-bold transition-colors",
                        active ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      )}
                      onClick={() => {
                        const enabled = mode.value === "automatic";
                        setFormState((current) => ({
                          ...current,
                          generationMode: mode.value,
                          isOneTimeFree: enabled ? false : current.isOneTimeFree,
                          isPremiumOnly: enabled ? true : current.isPremiumOnly,
                          questionIds: enabled ? [] : current.questionIds,
                          questionCount: enabled ? automaticSummary.requiredTotal || current.questionCount : current.questionCount,
                          automaticQuestionDistribution: enabled
                            ? (current.automaticQuestionDistribution?.length ? current.automaticQuestionDistribution : resetAutomaticDistribution(current.examType))
                            : current.automaticQuestionDistribution,
                        }));
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formState.generationMode === "automatic"
                  ? "Automatic mode selects questions from the bank using subject-wise MCQ/Numeric counts."
                  : "Manual mode uses Subject -> Chapter -> Topic -> Question selection below."}
              </p>
            </div> : null}
            {subjectOnly && formState.generationMode === "automatic" ? <>
              <label className={ui.field}><span>Frequency</span><select className={ui.input} value="daily" disabled><option value="daily">Daily</option></select></label>
              <label className={ui.field}><span>Daily Generation Time</span><input className={ui.input} type="time" value={formState.generationTime} onChange={(event) => setFormState((current) => ({ ...current, generationTime: event.target.value }))} /></label>
              <label className={ui.field}><span>Questions Per Test</span><input className={ui.input} type="number" min="2" max="300" value={formState.questionCount} onChange={(event) => setFormState((current) => {
                const questionCount = Number(event.target.value || 0);
                const automaticQuestionDistribution = current.automaticQuestionDistribution?.length
                  ? current.automaticQuestionDistribution.map((row, index) => index === 0 ? { ...row, mcqCount: current.examType === "NEET" ? questionCount : row.mcqCount, numericCount: current.examType === "NEET" ? 0 : row.numericCount } : row)
                  : current.automaticQuestionDistribution;
                return { ...current, questionCount: event.target.value, automaticQuestionDistribution };
              })} /><small className="text-xs text-slate-500">Questions are selected automatically from the chosen exam and subject.</small></label>
            </> : null}
            <label className={ui.field}>
              <span>Difficulty</span>
              <select className={ui.input} value={formState.difficulty} onChange={(event) => setFormState((current) => ({ ...current, difficulty: event.target.value }))}>
                <option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </label>
            <label className={ui.field}><span>Start Date</span><input className={ui.input} type="date" value={formState.startDate} onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label className={ui.field}><span>End Date</span><input className={ui.input} type="date" min={formState.startDate || undefined} value={formState.endDate} onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))} /></label>
            <label className={ui.field}>
              <span>Availability</span>
              <select
                className={ui.input}
                value={formState.availabilityMode}
                onChange={(event) => setFormState((current) => ({ ...current, availabilityMode: event.target.value }))}
              >
                <option value="all">All Days</option>
                <option value="day_wise">Day Wise</option>
                <option value="week_wise">Week Wise</option>
              </select>
            </label>
            <label className={cn(ui.field, ui.fieldFull)}>
              <span>Description</span>
              <textarea className={ui.textarea} value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Duration Minutes</span>
              <input className={ui.input} type="number" min="1" value={formState.durationMinutes} onChange={(event) => setFormState((current) => ({ ...current, durationMinutes: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Max Score</span>
              <input className={ui.input} type="number" min="1" value={formState.maxScore} onChange={(event) => setFormState((current) => ({ ...current, maxScore: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Marks Per Question</span>
              <input className={ui.input} type="number" min="1" disabled={!formState.markingOverrideEnabled} value={formState.marksPerQuestion} onChange={(event) => setFormState((current) => ({ ...current, marksPerQuestion: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Negative Marks</span>
              <input className={ui.input} type="number" min="0" step="0.25" disabled={!formState.markingOverrideEnabled} value={formState.negativeMarks} onChange={(event) => setFormState((current) => ({ ...current, negativeMarks: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Marking Scheme Version</span>
              <input className={ui.input} value={formState.markingSchemeVersion || "v1"} onChange={(event) => setFormState((current) => ({ ...current, markingSchemeVersion: event.target.value }))} />
            </label>
            <div className="pt-8"><ToggleSwitch checked={Boolean(formState.markingOverrideEnabled)} onChange={(value) => setFormState((current) => ({ ...current, markingOverrideEnabled: value }))} label="Manual mark override" /></div>
            <label className={ui.field}>
              <span>Prediction Title</span>
              <input className={ui.input} value={formState.predictionTitle} onChange={(event) => setFormState((current) => ({ ...current, predictionTitle: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Prediction Description</span>
              <input className={ui.input} value={formState.predictionDescription} onChange={(event) => setFormState((current) => ({ ...current, predictionDescription: event.target.value }))} />
            </label>
            {formState.availabilityMode === "day_wise" ? (
              <label className={cn(ui.field, ui.fieldFull)}>
                <span>Allowed Month Days</span>
                <input
                  className={ui.input}
                  placeholder="Example: 1, 5, 12, 20"
                  value={dayInput}
                  onChange={(event) => setDayInput(event.target.value)}
                />
              </label>
            ) : null}
            {formState.availabilityMode === "week_wise" ? (
              <div className={cn(ui.field, ui.fieldFull)}>
                <span>Allowed Weekdays</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((item) => {
                    const active = formState.availableWeekdays.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={cn(ui.buttonBase, active ? ui.buttonPrimary : ui.buttonSecondary)}
                        onClick={() => toggleWeekday(item.value)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {!freeOnly ? <div className="pt-8"><ToggleSwitch checked={subjectOnly || formState.isPremiumOnly} onChange={(value) => !subjectOnly && setFormState((current) => ({ ...current, isPremiumOnly: value }))} label={subjectOnly ? "Premium only (required)" : "Premium only"} /></div> : null}
            {!freeOnly ? (
              <label className={ui.field}>
                <span>Premium Duration Type</span>
                <select className={ui.input} value={formState.premiumDurationType} onChange={(event) => setFormState((current) => ({ ...current, premiumDurationType: event.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            ) : null}
            {!freeOnly ? (
              <label className={ui.field}>
                <span>Premium Validity Days</span>
                <input className={ui.input} type="number" min="1" value={formState.premiumValidityDays} onChange={(event) => setFormState((current) => ({ ...current, premiumValidityDays: event.target.value }))} />
              </label>
            ) : null}
            {!freeOnly && !subjectOnly ? <div className="pt-8"><ToggleSwitch checked={Boolean(formState.autoDailyQuestionRearrangement)} onChange={(value) => setFormState((current) => ({ ...current, autoDailyQuestionRearrangement: value }))} label="Daily random rearrange" /></div> : null}
            {!freeOnly && !subjectOnly ? <div className="pt-8"><ToggleSwitch checked={Boolean(formState.autoDailyQuestionGeneration)} onChange={(value) => setFormState((current) => ({ ...current, autoDailyQuestionGeneration: value }))} label="Daily question generation" /></div> : null}
            {!subjectOnly ? <label className={ui.field}>
              <span>Free Access Duration</span>
              <input className={ui.input} type="number" min="1" value={formState.freeAccessDurationValue} onChange={(event) => setFormState((current) => ({ ...current, freeAccessDurationValue: event.target.value }))} />
            </label> : null}
            {!subjectOnly ? <label className={ui.field}>
              <span>Free Access Unit</span>
              <select className={ui.input} value={formState.freeAccessDurationUnit} onChange={(event) => setFormState((current) => ({ ...current, freeAccessDurationUnit: event.target.value }))}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </label> : null}
            <div className="pt-8"><ToggleSwitch checked={formState.isActive} onChange={(value) => setFormState((current) => ({ ...current, isActive: value }))} label="Publish as active" /></div>
            <label className={cn(ui.field, ui.fieldFull)}>
              <span>Instructions</span>
              <textarea className={ui.textarea} value={formState.instructions} onChange={(event) => setFormState((current) => ({ ...current, instructions: event.target.value }))} />
            </label>
          </div>

          {formState.generationMode === "automatic" ? (
            <div className="space-y-4 rounded-sm border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-sm font-bold text-blue-950">Automatic Question Configuration</h3>
                  <p className="mt-1 text-xs text-blue-800">
                    Questions will be selected from the matching exam, subject, type, and available question bank. Chapters and topics are derived from the selected questions.
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-9 px-3 py-2 text-xs")}
                  onClick={() => setFormState((current) => ({
                    ...current,
                    automaticQuestionDistribution: resetAutomaticDistribution(current.examType),
                    questionCount: requiredQuestionCount || current.questionCount,
                  }))}
                >
                  Reset Pattern
                </button>
              </div>

              <div className="overflow-x-auto rounded-sm border border-blue-100 bg-white">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="p-2">Subject</th>
                      <th className="p-2">MCQ Questions</th>
                      <th className="p-2">Numeric Questions</th>
                      <th className="p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {automaticDistributionRows.map((row, index) => (
                      <tr key={`${row.subjectId || row.subjectName}-${index}`}>
                        <td className="p-2 font-semibold text-slate-800">{row.subjectName}</td>
                        <td className="p-2">
                          <input
                            className={ui.input}
                            type="number"
                            min="0"
                            max="300"
                            value={row.mcqCount}
                            onChange={(event) => updateAutomaticDistribution(index, "mcqCount", event.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className={ui.input}
                            type="number"
                            min="0"
                            max="300"
                            disabled={formState.examType === "NEET"}
                            value={row.numericCount}
                            onChange={(event) => updateAutomaticDistribution(index, "numericCount", event.target.value)}
                          />
                        </td>
                        <td className="p-2 font-bold text-slate-900">{Number(row.mcqCount || 0) + Number(row.numericCount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-2 sm:grid-cols-5">
                {[
                  ["Total MCQs", automaticSummary.mcqTotal],
                  ["Total Numeric", automaticSummary.numericTotal],
                  ["Required", automaticSummary.requiredTotal],
                  ["Selected", automaticSummary.selectedTotal],
                  [automaticSummary.difference > 0 ? "Excess" : "Remaining", Math.abs(automaticSummary.difference)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-sm border border-blue-100 bg-white p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="text-lg font-black text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
              {automaticValidationMessage ? <p className="text-sm font-semibold text-rose-600">{automaticValidationMessage}</p> : null}
            </div>
          ) : <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
            <div className={ui.compactPanel}>
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-semibold text-slate-700">Find Questions</div>
                  <SearchBar value={questionSearch} onChange={(value) => { setQuestionSearch(value); setQuestionPage(1); }} placeholder="Search question text..." />
                </div>
                <select className={cn(ui.input, "lg:max-w-[220px]")} disabled={lockedReplacement} value={questionSubjectId} onChange={(event) => { setQuestionSubjectId(event.target.value); setQuestionChapterId(""); setQuestionTopicId(""); setQuestionPage(1); }}>
                  <option value="">All Subjects</option>
                  {subjects.filter((item) => formState.examType === "BOTH" || item.examType === formState.examType).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select className={cn(ui.input, "lg:max-w-[220px]")} disabled={lockedReplacement} value={questionChapterId} onChange={(event) => { setQuestionChapterId(event.target.value); setQuestionTopicId(""); setQuestionPage(1); }}>
                  <option value="">All Chapters</option>
                  {filteredChapters.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select className={cn(ui.input, "lg:max-w-[220px]")} disabled={lockedReplacement} value={questionTopicId} onChange={(event) => { setQuestionTopicId(event.target.value); setQuestionPage(1); }}>
                  <option value="">All Topics</option>
                  {filteredTopics.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              {replacementTarget ? (
                <div className="mb-4 rounded-sm border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  Replacing one question. Choose only from the same Subject, Chapter, and Topic: {replacementTarget.subjectName} | {replacementTarget.chapterName} | {replacementTarget.topicName || "-"}
                  <button type="button" className="ml-3 text-amber-900 underline" onClick={() => setReplacementTarget(null)}>Cancel</button>
                </div>
              ) : null}

              {questionLoading ? <LoadingSpinner label="Loading questions..." /> : null}
              {!questionLoading ? (
                <div className="space-y-3">
                  {questionResults.map((item) => {
                    const isSelected = selectedQuestionIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(ui.tile, "w-full text-left", isSelected && "border-blue-300 bg-blue-50")}
                        onClick={() => toggleQuestion(item.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <MathText className="line-clamp-2 font-semibold text-slate-900">{item.question}</MathText>
                            {item.questionImageUrl ? (
                              <img src={item.questionImageUrl} alt="Question visual" className="mt-2 max-h-20 rounded-sm border border-slate-200 object-contain" />
                            ) : null}
                            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.subjectName} | {item.chapterName} | {item.topicName || "-"} | {item.difficulty}</div>
                          </div>
                          <span className={ui.pill}>{isSelected ? "Selected" : "Add"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <Pagination meta={questionMeta} onChange={(page) => setQuestionPage(page)} />
            </div>

            <div className={ui.compactPanel}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Selected Questions</h3>
                  <p className={ui.muted}>{selectedQuestionIds.length} questions added to this mock test.</p>
                  {questionCountValidationMessage ? (
                    <p className="mt-2 text-sm font-semibold text-rose-600">{questionCountValidationMessage}</p>
                  ) : null}
                </div>
                <span className={ui.badge}>{selectedQuestionIds.length} total</span>
              </div>
              <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                {selectedQuestions.map((item, index) => (
                  <div key={item.id} className="rounded-sm border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className={ui.pill}>#{index + 1}</span>
                      <div className="flex gap-3">
                        <button type="button" className="text-sm font-semibold text-blue-700" onClick={() => beginReplaceQuestion(item)}>Replace</button>
                        <button type="button" className="text-sm font-semibold text-rose-600" onClick={() => removeSelectedQuestion(item.id)}>Remove</button>
                      </div>
                    </div>
                    <MathText className="line-clamp-3 text-sm font-semibold text-slate-900">{item.question}</MathText>
                    {item.questionImageUrl ? (
                      <img src={item.questionImageUrl} alt="Question visual" className="mt-2 max-h-20 rounded-sm border border-slate-200 object-contain" />
                    ) : null}
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.subjectName} | {item.chapterName} | {item.topicName || "-"} | {item.difficulty}</div>
                  </div>
                ))}
                {!selectedQuestions.length ? <EmptyState title="No questions selected" description="Use the question finder to build a fixed test paper." /> : null}
              </div>
            </div>
          </div>}
        </EntityFormWrapper>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteItem)}
        title="Delete mock test"
        description="This will remove the mock test from the app catalog."
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      {blueprintEditor ? (
        <EntityFormWrapper
          title={`Edit ${blueprintEditor.data.title || blueprintEditor.data.key} Blueprint`}
          subtitle="This edits the read-only pattern blueprint shown above the mock-test list."
          onCancel={() => setBlueprintEditor(null)}
          onSubmit={handleSaveBlueprint}
          submitLabel={savingBlueprint ? "Saving..." : "Save Blueprint"}
          submitDisabled={savingBlueprint}
        >
          <label className={cn(ui.field, "mb-4")}>
            <span>Blueprint Title</span>
            <input
              className={ui.input}
              value={blueprintEditor.data.title || ""}
              onChange={(event) => setBlueprintEditor((current) => ({ ...current, data: { ...current.data, title: event.target.value } }))}
            />
          </label>
          <div className="space-y-5">
            {BLUEPRINT_TABLES.map((table) => (
              <div key={table.key} className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">{table.title}</h3>
                  <button className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-9 px-3 py-2 text-xs")} type="button" onClick={() => addBlueprintRow(table.key, table.fields)}>
                    <PlusIcon size={14} />
                    Add Row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className={ui.table}>
                    <thead>
                      <tr>
                        {table.fields.map(([, label]) => <th key={label} className={ui.tableHead}>{label}</th>)}
                        <th className={ui.tableHead}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(blueprintEditor.data?.[table.key] || []).map((row, rowIndex) => (
                        <tr key={`${table.key}-${rowIndex}`}>
                          {table.fields.map(([field]) => (
                            <td key={field} className={ui.tableCell}>
                              <input
                                className={ui.input}
                                value={row?.[field] ?? ""}
                                onChange={(event) => updateBlueprintCell(table.key, rowIndex, field, event.target.value)}
                              />
                            </td>
                          ))}
                          <td className={ui.tableCell}>
                            <button className="text-sm font-semibold text-rose-600" type="button" onClick={() => removeBlueprintRow(table.key, rowIndex)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </EntityFormWrapper>
      ) : null}

      {historyModal ? (
        <EntityFormWrapper
          title={`Generation History: ${historyModal.title}`}
          subtitle={`Source: ${historyModal.generationSource}`}
          onCancel={() => setHistoryModal(null)}
          onSubmit={(event) => {
            event.preventDefault();
            setHistoryModal(null);
          }}
          submitLabel="Close"
        >
          <div className="space-y-3">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Config:</strong> {historyModal.generationConfig ? JSON.stringify(historyModal.generationConfig) : "No config available"}
            </div>
            {(historyModal.history || []).map((entry) => (
              <div key={entry.id || entry.generatedAt} className="rounded-sm border border-slate-200 bg-white p-3">
                <div className="text-sm font-bold text-slate-900">{entry.mode || "generate"} | {entry.examType || "-"}</div>
                <div className="text-xs text-slate-500">Generated: {entry.generatedAt || "-"}</div>
                <div className="mt-1 text-xs text-slate-600">
                  Difficulty: {entry.difficulty || "mixed"} | Questions: {entry.totalQuestions || 0} | Attempt: {entry.totalAttemptQuestions || 0}
                </div>
              </div>
            ))}
            {!(historyModal.history || []).length ? (
              <EmptyState title="No generation history" description="This mock test has not been auto-generated yet." />
            ) : null}
          </div>
        </EntityFormWrapper>
      ) : null}
    </div>
  );
}
