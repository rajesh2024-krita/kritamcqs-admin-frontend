export const EXAM_MODE_OPTIONS = [
  { label: "NEET", value: "NEET" },
  { label: "JEE", value: "JEE" },
  { label: "Both", value: "BOTH" },
];

export const EXAM_TYPE_OPTIONS = [
  { label: "NEET", value: "NEET" },
  { label: "JEE", value: "JEE" },
];

export const EXAM_OPTIONS = [
  { label: "NEET", value: "NEET" },
  { label: "JEE Main", value: "JEE_MAIN" },
  { label: "JEE Advanced", value: "JEE_ADVANCED" },
];

export const SUBJECTS_BY_EXAM_TYPE = {
  NEET: ["Biology", "Physics", "Chemistry"],
  JEE: ["Physics", "Chemistry", "Mathematics"],
};

export const EXAM_PATTERN_CONFIG = {
  NEET: {
    durationMinutes: 180,
    totalQuestions: 180,
    totalMarks: 720,
    subjects: { Biology: 90, Physics: 45, Chemistry: 45 },
    responseTypes: ["single"],
    marking: { mcq: { correct: 4, wrong: -1, unanswered: 0 } },
  },
  JEE: {
    durationMinutes: 180,
    totalQuestions: 90,
    totalMarks: 300,
    subjects: {
      Physics: 30,
      Chemistry: 30,
      Mathematics: 30,
    },
    responseTypes: ["single", "numeric"],
    marking: { mcq: { correct: 4, wrong: -1, unanswered: 0 }, numerical: { correct: 4, wrong: 0, unanswered: 0 } },
  },
};

export function deriveExamType(examMode, exam) {
  if (String(exam || "").startsWith("JEE")) return "JEE";
  if (exam === "NEET") return "NEET";
  if (examMode === "JEE") return "JEE";
  return "NEET";
}

export function getExamOptionsForMode(examMode) {
  if (examMode === "NEET") return EXAM_OPTIONS.filter((item) => item.value === "NEET");
  if (examMode === "JEE") return EXAM_OPTIONS.filter((item) => item.value !== "NEET");
  return EXAM_OPTIONS;
}

export function getSubjectOptionsForExamType(examType) {
  return (SUBJECTS_BY_EXAM_TYPE[examType] || []).map((name) => ({ label: name, value: name }));
}

export function getAllowedExamTypes(examMode, exam) {
  if (examMode === "NEET") return ["NEET"];
  if (examMode === "JEE") return ["JEE"];
  if (examMode === "BOTH" && exam) return [deriveExamType(examMode, exam)];
  return ["NEET", "JEE"];
}

export function formatSubjectLabel(subject) {
  if (!subject) return "-";
  return `${subject.name} (${subject.examType})`;
}
