import { useEffect, useMemo, useState } from "react";
import { mockTestService } from "../../api/mockTestService";
import { subjectService } from "../../api/subjectService";
import { chapterService } from "../../api/chapterService";
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
  titlePrefix: "Premium Auto Mock",
};

function buildFormFromItem(item) {
  return {
    title: item.title || "",
    description: item.description || "",
    examType: item.examType || "NEET",
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

const BLUEPRINT_TABLES = [
  { key: "summary", title: "Answer Sheet", fields: [["label", "Question"], ["value", "Answer"]] },
  { key: "subjectWise", title: "Subject Wise", fields: [["subject", "Subject"], ["questions", "Questions"], ["marks", "Marks"], ["weightage", "Weightage %"]] },
  { key: "chapterWise", title: "Chapter Wise Blueprint", fields: [["subject", "Subject"], ["chapter", "Chapter"], ["expectedQuestions", "Expected Questions"]] },
  { key: "topicWise", title: "Topic Wise Rules", fields: [["subject", "Subject"], ["chapter", "Chapter"], ["topic", "Topic"], ["expectedQuestions", "Expected Questions"]] },
  { key: "rules", title: "Mock Test Rules", fields: [["rule", "Rule"], ["value", "Value"]] },
];

function getBlueprintSummaryValue(blueprint, labelPart) {
  const found = (blueprint?.summary || []).find((item) => String(item.label || "").toLowerCase().includes(labelPart.toLowerCase()));
  return found?.value || "-";
}

export function MockTestsPage({ freeOnly = false } = {}) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({ createdDate: "", active: "", examType: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionSubjectId, setQuestionSubjectId] = useState("");
  const [questionChapterId, setQuestionChapterId] = useState("");
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
  const [generationSchedule, setGenerationSchedule] = useState(defaultGenerationSchedule);
  const [generationLogs, setGenerationLogs] = useState([]);
  const [savingGenerationSchedule, setSavingGenerationSchedule] = useState(false);
  const [runningGenerationNow, setRunningGenerationNow] = useState(false);

  const selectedQuestionIds = formState.questionIds || [];
  const requiredQuestionCount = getRequiredQuestionCount(formState, patternBlueprints);
  const questionCountValidationMessage = requiredQuestionCount && selectedQuestionIds.length !== requiredQuestionCount
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

  const lockedReplacement = Boolean(replacementTarget);
  const autoExamSubjects = useMemo(
    () => subjects.filter((item) => autoForm.examType === "BOTH" || item.examType === autoForm.examType),
    [subjects, autoForm.examType],
  );
  const scheduleExamSubjects = useMemo(
    () => subjects.filter((item) => generationSchedule.examType === "BOTH" || item.examType === generationSchedule.examType),
    [subjects, generationSchedule.examType],
  );
  const scheduleChapters = useMemo(() => {
    const selectedSubjects = new Set((generationSchedule.subjectIds || []).map(String));
    return chapters.filter((item) => {
      if (generationSchedule.examType !== "BOTH" && item.examType && item.examType !== generationSchedule.examType) return false;
      if (!selectedSubjects.size) return true;
      return selectedSubjects.has(String(item.subjectId?.id || item.subjectId));
    });
  }, [chapters, generationSchedule.examType, generationSchedule.subjectIds]);

  function buildListParams(nextQuery = query) {
    return {
      ...nextQuery,
      search,
      ...(filters.createdDate ? { createdDate: filters.createdDate } : {}),
      ...(filters.active ? { isActive: filters.active } : {}),
      ...(filters.examType ? { examType: filters.examType } : {}),
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
      const [subjectsResponse, chaptersResponse, markingSettingsResponse, patternBlueprintsResponse, scheduleResponse, logsResponse] = await Promise.all([
        subjectService.list({ limit: 200 }),
        chapterService.list({ limit: 500 }),
        mockTestService.getMarkingSettings(),
        mockTestService.listPatternBlueprints(),
        mockTestService.getGenerationSchedule(),
        mockTestService.listGenerationLogs({ limit: 10 }),
      ]);
      setSubjects(subjectsResponse.data || []);
      setChapters(chaptersResponse.data || []);
      setPatternBlueprints(patternBlueprintsResponse.data || []);
      setGenerationSchedule({ ...defaultGenerationSchedule, ...(scheduleResponse.data || {}) });
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
    setQuestionLoading(true);
    try {
      const response = await mockTestService.listQuestions({
        page: nextPage,
        limit: 10,
        search: questionSearch,
        examType: formState.examType,
        subjectId: questionSubjectId,
        chapterId: lockedReplacement ? replacementTarget.chapterId : questionChapterId,
        topicId: lockedReplacement ? replacementTarget.topicId : undefined,
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
  }, [search, filters.createdDate, filters.active, filters.examType]);

  useEffect(() => {
    if (!showForm) return;
    const timeout = window.setTimeout(() => {
      loadQuestions(questionPage);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [showForm, questionSearch, questionSubjectId, questionChapterId, formState.examType, questionPage, selectedQuestionIds.join(","), replacementTarget?.id]);

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
      isPremiumOnly: false,
    });
    setQuestionSearch("");
    setQuestionSubjectId("");
    setQuestionChapterId("");
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

  function toggleScheduleDay(day) {
    setGenerationSchedule((current) => {
      const days = current.weeklyDays || [];
      const exists = days.includes(day);
      const nextDays = exists ? days.filter((item) => item !== day) : [...days, day];
      return { ...current, weeklyDays: nextDays.length ? nextDays : ["FRI"] };
    });
  }

  function toggleScheduleSubject(subjectId) {
    setGenerationSchedule((current) => {
      const exists = current.subjectIds.includes(subjectId);
      return {
        ...current,
        subjectIds: exists ? current.subjectIds.filter((id) => id !== subjectId) : [...current.subjectIds, subjectId],
        chapterIds: [],
      };
    });
  }

  function toggleScheduleChapter(chapterId) {
    setGenerationSchedule((current) => {
      const exists = current.chapterIds.includes(chapterId);
      return {
        ...current,
        chapterIds: exists ? current.chapterIds.filter((id) => id !== chapterId) : [...current.chapterIds, chapterId],
      };
    });
  }

  async function refreshGenerationLogs() {
    const response = await mockTestService.listGenerationLogs({ limit: 10 });
    setGenerationLogs(response.data || []);
  }

  async function handleSaveGenerationSchedule() {
    setSavingGenerationSchedule(true);
    try {
      const response = await mockTestService.saveGenerationSchedule({
        ...generationSchedule,
        monthlyDay: Number(generationSchedule.monthlyDay || 1),
        questionCount: Number(generationSchedule.questionCount || 0),
      });
      setGenerationSchedule({ ...defaultGenerationSchedule, ...(response.data || {}) });
      toast.success("Automatic generation schedule saved");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingGenerationSchedule(false);
    }
  }

  async function handleRunGenerationNow() {
    setRunningGenerationNow(true);
    try {
      await mockTestService.runGenerationScheduleNow();
      toast.success("Premium mock test generated and published");
      await Promise.all([loadItems({ ...query, page: 1 }), refreshGenerationLogs()]);
    } catch (error) {
      toast.error(error.message);
      await refreshGenerationLogs().catch(() => {});
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
        data: JSON.parse(JSON.stringify(blueprint)),
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
      if ((formState.questionIds || []).length < 2) {
        toast.error("Select at least two questions for a manual mock test");
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
        isPremiumOnly: freeOnly ? false : Boolean(formState.isPremiumOnly),
        markingSchemeVersion: String(formState.markingSchemeVersion || getDefaultSchemeForExam(markingSettings, formState.examType).version || "v1"),
        markingOverrideEnabled: Boolean(formState.markingOverrideEnabled),
        freeAccessDurationValue: Number(formState.freeAccessDurationValue || 1),
        freeAccessDurationUnit: formState.freeAccessDurationUnit || "days",
        availableDaysOfMonth: formState.availabilityMode === "day_wise" ? parsedDays : [],
        availableWeekdays: formState.availabilityMode === "week_wise" ? formState.availableWeekdays : [],
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
              {freeOnly ? "Create Free Mock Test" : "Create Mock Test"}
            </button>
          </div>
        </div>
      </div> */}

      <div className={ui.compactPanel}>
        <div className="mb-4 border-b border-slate-200 pb-4">
          <div className={ui.eyebrow}>Read-Only Pattern Blueprints</div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {patternBlueprints.map((blueprint) => (
              <div key={blueprint.key} className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">{blueprint.title || `${blueprint.key} Pattern Blueprint`}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{(blueprint.chapterWise || []).length} chapter rows | {(blueprint.topicWise || []).length} topic rules</div>
                  </div>
                  <button className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-9 px-3 py-2 text-xs")} type="button" onClick={() => void openBlueprintEditor(blueprint)}>
                    <EditIcon size={14} />
                    Edit
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className={ui.pill}>{getBlueprintSummaryValue(blueprint, "total questions")} questions</span>
                  <span className={ui.pill}>{getBlueprintSummaryValue(blueprint, "total marks")} marks</span>
                  {(blueprint.subjectWise || []).slice(0, 4).map((item) => (
                    <span key={`${blueprint.key}-${item.subject}`} className={ui.pill}>{item.subject}: {item.questions}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Patterns are read-only until Edit is clicked and the Admin Password is verified.</p>
        </div>
        {!freeOnly ? (
          <div className="mb-4 border-b border-slate-200 pb-4">
            <div className={ui.eyebrow}>Premium Scheduler</div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Automatic Mock Test Generation</h2>
                <p className={ui.muted}>Scheduled mocks are auto-published and visible only to premium users.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={cn(ui.buttonBase, ui.buttonSecondary)} type="button" disabled={runningGenerationNow} onClick={() => void handleRunGenerationNow()}>
                  {runningGenerationNow ? "Generating..." : "Run Now"}
                </button>
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={savingGenerationSchedule} onClick={() => void handleSaveGenerationSchedule()}>
                  {savingGenerationSchedule ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="pt-8">
                <ToggleSwitch checked={Boolean(generationSchedule.enabled)} onChange={(value) => setGenerationSchedule((current) => ({ ...current, enabled: value }))} label="Enable automatic generation" />
              </div>
              <label className={ui.field}>
                <span>Recurrence</span>
                <select className={ui.input} value={generationSchedule.recurrenceType} onChange={(event) => setGenerationSchedule((current) => ({ ...current, recurrenceType: event.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className={ui.field}>
                <span>Generation Time</span>
                <input className={ui.input} type="time" value={generationSchedule.generationTime} onChange={(event) => setGenerationSchedule((current) => ({ ...current, generationTime: event.target.value }))} />
              </label>
              <label className={ui.field}>
                <span>Exam Type</span>
                <select className={ui.input} value={generationSchedule.examType} onChange={(event) => setGenerationSchedule((current) => ({ ...current, examType: event.target.value, subjectIds: [], chapterIds: [] }))}>
                  <option value="NEET">NEET</option>
                  <option value="JEE">JEE</option>
                </select>
              </label>
              {generationSchedule.recurrenceType === "monthly" ? (
                <label className={ui.field}>
                  <span>Monthly Date</span>
                  <input className={ui.input} type="number" min="1" max="31" value={generationSchedule.monthlyDay} onChange={(event) => setGenerationSchedule((current) => ({ ...current, monthlyDay: event.target.value }))} />
                </label>
              ) : null}
              <label className={ui.field}>
                <span>Difficulty</span>
                <select className={ui.input} value={generationSchedule.difficulty} onChange={(event) => setGenerationSchedule((current) => ({ ...current, difficulty: event.target.value }))}>
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className={ui.field}>
                <span>Question Count</span>
                <input className={ui.input} type="number" min="0" max="300" value={generationSchedule.questionCount} onChange={(event) => setGenerationSchedule((current) => ({ ...current, questionCount: event.target.value }))} placeholder="0 uses blueprint" />
              </label>
              <label className={ui.field}>
                <span>Title Prefix</span>
                <input className={ui.input} value={generationSchedule.titlePrefix} onChange={(event) => setGenerationSchedule((current) => ({ ...current, titlePrefix: event.target.value }))} />
              </label>
            </div>

            {generationSchedule.recurrenceType === "weekly" ? (
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold text-slate-700">Weekly Days</div>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const active = generationSchedule.weeklyDays?.includes(day.value);
                    return (
                      <button key={day.value} type="button" className={cn(ui.buttonBase, active ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => toggleScheduleDay(day.value)}>
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Subjects</div>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
                  {scheduleExamSubjects.map((subject) => {
                    const active = generationSchedule.subjectIds.includes(subject.id);
                    return (
                      <button key={subject.id} type="button" className={cn(ui.buttonBase, active ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => toggleScheduleSubject(subject.id)}>
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Chapters</div>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
                  {scheduleChapters.map((chapter) => {
                    const active = generationSchedule.chapterIds.includes(chapter.id);
                    return (
                      <button key={chapter.id} type="button" className={cn(ui.buttonBase, active ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => toggleScheduleChapter(chapter.id)}>
                        {chapter.name}
                      </button>
                    );
                  })}
                  {!scheduleChapters.length ? <span className="text-sm font-semibold text-slate-500">No chapters available for the selected filters.</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-sm border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">Generation History</h3>
                <button className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-9 px-3 py-2 text-xs")} type="button" onClick={() => void refreshGenerationLogs()}>Refresh</button>
              </div>
              <div className="overflow-x-auto">
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th className={ui.tableHead}>Generated At</th>
                      <th className={ui.tableHead}>Schedule</th>
                      <th className={ui.tableHead}>Test Name</th>
                      <th className={ui.tableHead}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generationLogs.map((log) => (
                      <tr key={log.id}>
                        <td className={ui.tableCell}>{log.generatedAt ? new Date(log.generatedAt).toLocaleString() : "-"}</td>
                        <td className={ui.tableCell}>{log.scheduleType}</td>
                        <td className={ui.tableCell}>{log.testName || log.message || "-"}</td>
                        <td className={ui.tableCell}>
                          <span className={cn(ui.badge, log.status === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700")}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!generationLogs.length ? <EmptyState title="No generation logs" description="Scheduled generation history will appear here." /> : null}
            </div>
          </div>
        ) : null}
        <div className="mb-4 border-b border-slate-200 pb-4">
          <div className={ui.eyebrow}>Auto Generation</div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Generate Mock Test</h2>
          <p className={ui.muted}>Generated mocks start free for every learner. After a free learner completes one, that mock becomes premium for that learner.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className={ui.field}>
              <span>Exam Type</span>
              <select className={ui.input} value={autoForm.examType} onChange={(event) => setAutoForm((current) => ({ ...current, examType: event.target.value, subjectIds: [] }))}>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
              </select>
            </label>
            <label className={ui.field}>
              <span>Difficulty</span>
              <select className={ui.input} value={autoForm.difficulty} onChange={(event) => setAutoForm((current) => ({ ...current, difficulty: event.target.value }))}>
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className={ui.field}>
              <span>Title (Optional)</span>
              <input className={ui.input} value={autoForm.title} onChange={(event) => setAutoForm((current) => ({ ...current, title: event.target.value }))} placeholder="Auto title if blank" />
            </label>
            {!freeOnly ? (
              <label className={ui.field}>
                <span>Duration Type</span>
                <select className={ui.input} value={autoForm.premiumDurationType} onChange={(event) => setAutoForm((current) => ({ ...current, premiumDurationType: event.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            ) : null}
            {!freeOnly ? (
              <label className={ui.field}>
                <span>Validity Days</span>
                <input className={ui.input} type="number" min="1" value={autoForm.premiumValidityDays} onChange={(event) => setAutoForm((current) => ({ ...current, premiumValidityDays: event.target.value }))} />
              </label>
            ) : null}
            {!freeOnly ? (
              <div className="pt-8"><ToggleSwitch checked={autoForm.autoDailyQuestionRearrangement} onChange={(value) => setAutoForm((current) => ({ ...current, autoDailyQuestionRearrangement: value }))} label="Daily rearrange" /></div>
            ) : null}
            {!freeOnly ? (
              <div className="pt-8"><ToggleSwitch checked={autoForm.autoDailyQuestionGeneration} onChange={(value) => setAutoForm((current) => ({ ...current, autoDailyQuestionGeneration: value }))} label="Daily generate" /></div>
            ) : null}
            <div className="flex items-end">
              <button className={cn(ui.buttonBase, ui.buttonPrimary, "w-full")} type="button" disabled={autoGenerating} onClick={() => void handleAutoGenerate()}>
                {autoGenerating ? "Generating..." : "Generate Mock Test"}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm font-semibold text-slate-700">Subjects (optional, auto if none selected)</div>
            <div className="flex flex-wrap gap-2">
              {autoExamSubjects.map((subject) => {
                const active = autoForm.subjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    className={cn(ui.buttonBase, active ? ui.buttonPrimary : ui.buttonSecondary)}
                    onClick={() => toggleAutoSubject(subject.id)}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-5 rounded-sm border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Default Marking Rules</h3>
                <p className="text-sm text-slate-500">Used automatically for all future generated mocks unless per-test override is enabled.</p>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="button" disabled={savingMarkingSettings} onClick={() => void handleSaveMarkingSettings()}>
                {savingMarkingSettings ? "Saving..." : "Save Marking Rules"}
              </button>
            </div>
            <label className={cn(ui.field, "mb-4 max-w-xs")}>
              <span>Minimum mock tests for prediction</span>
              <input
                className={ui.input}
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
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { key: "neet", label: "NEET" },
                { key: "jeeMain", label: "JEE Main" },
                { key: "jeeAdvanced", label: "JEE Advanced" },
              ].map((exam) => (
                <div key={exam.key} className="rounded-sm border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-sm font-bold text-slate-900">{exam.label}</div>
                  <label className={ui.field}>
                    <span>Scheme Version</span>
                    <input
                      className={ui.input}
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
                  </label>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">MCQ</div>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <label className={ui.field}>
                      <span>+ve</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.mcq?.correct ?? 4} onChange={(event) => updateMarkingRule(exam.key, "mcq", "correct", event.target.value)} />
                    </label>
                    <label className={ui.field}>
                      <span>-ve</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.mcq?.wrong ?? -1} onChange={(event) => updateMarkingRule(exam.key, "mcq", "wrong", event.target.value)} />
                    </label>
                    <label className={ui.field}>
                      <span>Unans.</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.mcq?.unanswered ?? 0} onChange={(event) => updateMarkingRule(exam.key, "mcq", "unanswered", event.target.value)} />
                    </label>
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Numerical</div>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <label className={ui.field}>
                      <span>+ve</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.numerical?.correct ?? 4} onChange={(event) => updateMarkingRule(exam.key, "numerical", "correct", event.target.value)} />
                    </label>
                    <label className={ui.field}>
                      <span>-ve</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.numerical?.wrong ?? 0} onChange={(event) => updateMarkingRule(exam.key, "numerical", "wrong", event.target.value)} />
                    </label>
                    <label className={ui.field}>
                      <span>Unans.</span>
                      <input className={ui.input} type="number" value={markingSettings?.[exam.key]?.numerical?.unanswered ?? 0} onChange={(event) => updateMarkingRule(exam.key, "numerical", "unanswered", event.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Search mock tests by title or description..." />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Created Date
              <input
                className={ui.input}
                type="date"
                value={filters.createdDate}
                onChange={(event) => setFilters((current) => ({ ...current, createdDate: event.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Status
              <select className={ui.input} value={filters.active} onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}>
                <option value="">All Mocks</option>
                <option value="true">Active Mocks</option>
                <option value="false">Inactive Mocks</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Exam
              <select className={ui.input} value={filters.examType} onChange={(event) => setFilters((current) => ({ ...current, examType: event.target.value }))}>
                <option value="">All Exams</option>
                <option value="NEET">NEET only</option>
                <option value="JEE">JEE only</option>
              </select>
            </label>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => loadItems({ ...query, page: 1 })}>
            <RefreshIcon size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading mock tests..." /> : null}
      {!loading && !items.length ? <EmptyState title="No mock tests found" description="Create your first full-length mock test to publish it in the learner app." /> : null}
      {!loading && items.length ? (
        <>
          <div className={ui.tableWrap}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHead}>Title</th>
                    <th className={ui.tableHead}>Exam</th>
                    <th className={ui.tableHead}>Score</th>
                    <th className={ui.tableHead}>Duration</th>
                    <th className={ui.tableHead}>Schedule</th>
                    <th className={ui.tableHead}>Access Monitor</th>
                    <th className={ui.tableHead}>Status</th>
                    <th className={ui.tableHead}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className={ui.tableCell}>
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-sm text-slate-500">{item.description || "No description"}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className={ui.pill}>{item.patternPreset || "CUSTOM"}</span>
                          <span>{item.totalQuestions} questions</span>
                        </div>
                      </td>
                      <td className={ui.tableCell}>{item.examType}</td>
                      <td className={ui.tableCell}>
                        <div className="font-semibold text-slate-900">{item.maxScore || item.totalQuestions * item.marksPerQuestion}</div>
                        <div className="text-xs text-slate-500">+{item.marksPerQuestion} / -{item.negativeMarks}</div>
                        <div className="text-xs text-slate-500">Scheme: {item.markingSchemeVersion || "v1"}</div>
                      </td>
                      <td className={ui.tableCell}>{item.durationMinutes} min</td>
                      <td className={ui.tableCell}>{formatAvailability(item)}</td>
                      <td className={ui.tableCell}>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div><span className="font-bold text-slate-900">{item.completedLearnerCount || 0}</span> learners completed</div>
                          <div><span className="font-bold text-amber-700">{item.freeConvertedLearnerCount || 0}</span> free learners converted</div>
                          <div><span className="font-bold text-slate-900">{item.completedAttemptCount || 0}</span> completed attempts</div>
                          {item.lastCompletedAt ? <div>Last: {new Date(item.lastCompletedAt).toLocaleString()}</div> : null}
                        </div>
                      </td>
                      <td className={ui.tableCell}>
                        <div className="flex flex-col gap-2">
                          <span className={ui.pill}>{item.isActive ? "Active" : "Draft"}</span>
                          <span className="inline-flex items-center rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-black uppercase tracking-wider text-blue-700">
                            Free once, then premium
                          </span>
                          <span className={item.isPremiumOnly ? "inline-flex items-center rounded-sm border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-black uppercase tracking-wider text-amber-700" : "inline-flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black uppercase tracking-wider text-emerald-700"}>
                            {item.isPremiumOnly ? "Gold Crown Premium" : "Free Mock Test"}
                          </span>
                          <span className={ui.pill}>{item.generationSource === "auto" ? "Auto" : "Manual"}</span>
                        </div>
                      </td>
                      <td className={ui.tableCell}>
                        <div className="flex flex-wrap items-center gap-3">
                          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void openEdit(item)}>
                            <EditIcon size={16} />
                            Edit
                          </button>
                          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void handleDownload(item)}>
                            Download
                          </button>
                          {item.generationSource === "auto" ? (
                            <button
                              className={cn(ui.buttonBase, ui.buttonSecondary)}
                              onClick={() => void handleRegenerate(item)}
                              disabled={Boolean(rowRegenerating[String(item.id)])}
                            >
                              {rowRegenerating[String(item.id)] ? "Regenerating..." : "Regenerate"}
                            </button>
                          ) : null}
                          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void handleOpenGenerationHistory(item)}>
                            History
                          </button>
                          <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(item)}>
                            <TrashIcon size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingItem ? "Edit Mock Test" : "Create Mock Test"}
          subtitle="Set up the test paper, prediction copy, learner availability, and fixed question paper."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Mock Test" : "Create Mock Test"}
          submitDisabled={Boolean(questionCountValidationMessage)}
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
                value={formState.patternPreset}
                onChange={(event) => setFormState((current) => applyPresetToForm(event.target.value, current, markingSettings))}
              >
                <option value="NEET_REAL">NEET Real Pattern</option>
                <option value="JEE_REAL">JEE Real Pattern</option>
                <option value="CUSTOM">Custom Pattern</option>
              </select>
            </label>
            <label className={ui.field}>
              <span>Exam Type</span>
              <select className={ui.input} value={formState.examType} onChange={(event) => setFormState((current) => ({ ...current, examType: event.target.value }))}>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="BOTH">BOTH</option>
              </select>
            </label>
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
            {!freeOnly ? <div className="pt-8"><ToggleSwitch checked={formState.isPremiumOnly} onChange={(value) => setFormState((current) => ({ ...current, isPremiumOnly: value }))} label="Premium only" /></div> : null}
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
            {!freeOnly ? <div className="pt-8"><ToggleSwitch checked={Boolean(formState.autoDailyQuestionRearrangement)} onChange={(value) => setFormState((current) => ({ ...current, autoDailyQuestionRearrangement: value }))} label="Daily random rearrange" /></div> : null}
            {!freeOnly ? <div className="pt-8"><ToggleSwitch checked={Boolean(formState.autoDailyQuestionGeneration)} onChange={(value) => setFormState((current) => ({ ...current, autoDailyQuestionGeneration: value }))} label="Daily question generation" /></div> : null}
            <label className={ui.field}>
              <span>Free Access Duration</span>
              <input className={ui.input} type="number" min="1" value={formState.freeAccessDurationValue} onChange={(event) => setFormState((current) => ({ ...current, freeAccessDurationValue: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Free Access Unit</span>
              <select className={ui.input} value={formState.freeAccessDurationUnit} onChange={(event) => setFormState((current) => ({ ...current, freeAccessDurationUnit: event.target.value }))}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </label>
            <div className="pt-8"><ToggleSwitch checked={formState.isActive} onChange={(value) => setFormState((current) => ({ ...current, isActive: value }))} label="Publish as active" /></div>
            <label className={cn(ui.field, ui.fieldFull)}>
              <span>Instructions</span>
              <textarea className={ui.textarea} value={formState.instructions} onChange={(event) => setFormState((current) => ({ ...current, instructions: event.target.value }))} />
            </label>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
            <div className={ui.compactPanel}>
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <div className="mb-2 text-sm font-semibold text-slate-700">Find Questions</div>
                  <SearchBar value={questionSearch} onChange={(value) => { setQuestionSearch(value); setQuestionPage(1); }} placeholder="Search question text..." />
                </div>
                <select className={cn(ui.input, "lg:max-w-[220px]")} disabled={lockedReplacement} value={questionSubjectId} onChange={(event) => { setQuestionSubjectId(event.target.value); setQuestionChapterId(""); setQuestionPage(1); }}>
                  <option value="">All Subjects</option>
                  {subjects.filter((item) => formState.examType === "BOTH" || item.examType === formState.examType).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select className={cn(ui.input, "lg:max-w-[220px]")} disabled={lockedReplacement} value={questionChapterId} onChange={(event) => { setQuestionChapterId(event.target.value); setQuestionPage(1); }}>
                  <option value="">All Chapters</option>
                  {filteredChapters.map((item) => (
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
          </div>
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
