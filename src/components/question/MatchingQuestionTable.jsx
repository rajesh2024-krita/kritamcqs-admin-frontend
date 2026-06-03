import { MathText } from "../common/MathText";

const LEFT_LABELS = new Set(["A", "B", "C", "D", "1", "2", "3", "4"]);
const RIGHT_LABELS = new Set(["P", "Q", "R", "S", "I", "II", "III", "IV"]);
const LABEL_PATTERN = /(?:^|[\s|,;])(?:\((IV|I{1,3}|[A-DP-S1-4])\)|(IV|I{1,3}|[A-DP-S1-4])[).:-])\s*/gi;

function normalizeInput(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<\/?(?:p|div)[^>]*>/gi, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function cleanEntryText(value) {
  return String(value || "")
    .replace(/^\s*[-:.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isMatchingQuestion(question, text) {
  const typeText = [
    question?.questionType,
    question?.questionTypeLabel,
    question?.responseType,
    text,
  ].join(" ").toLowerCase();

  return /\b(match|matching|matrix)\b/.test(typeText);
}

function collectEntries(text) {
  const entries = new Map();

  for (const line of text.split(/\n+/)) {
    const markers = [...line.matchAll(LABEL_PATTERN)]
      .map((match) => ({
        label: String(match[1] || match[2] || "").toUpperCase(),
        index: match.index || 0,
        end: (match.index || 0) + match[0].length,
      }))
      .filter((marker) => marker.label);

    markers.forEach((marker, index) => {
      const next = markers[index + 1];
      const textValue = cleanEntryText(line.slice(marker.end, next?.index ?? line.length));
      if (textValue && !entries.has(marker.label)) entries.set(marker.label, textValue);
    });
  }

  if (entries.size < 2) {
    const markers = [...text.matchAll(LABEL_PATTERN)]
      .map((match) => ({
        label: String(match[1] || match[2] || "").toUpperCase(),
        index: match.index || 0,
        end: (match.index || 0) + match[0].length,
      }))
      .filter((marker) => marker.label);

    markers.forEach((marker, index) => {
      const next = markers[index + 1];
      const textValue = cleanEntryText(text.slice(marker.end, next?.index ?? text.length));
      if (textValue && !entries.has(marker.label)) entries.set(marker.label, textValue);
    });
  }

  return {
    left: [...entries.entries()].filter(([label]) => LEFT_LABELS.has(label)).map(([label, textValue]) => ({ label, text: textValue })),
    right: [...entries.entries()].filter(([label]) => RIGHT_LABELS.has(label)).map(([label, textValue]) => ({ label, text: textValue })),
  };
}

function stripTableEntries(text, left, right) {
  let nextText = text;
  [...left, ...right].forEach((entry) => {
    const escaped = entry.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const label = entry.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    nextText = nextText.replace(new RegExp(`(?:^|\\n|\\s)(?:\\(${label}\\)|${label}[).:-])\\s*${escaped}`, "gi"), " ");
  });
  return nextText
    .replace(/\b(?:Column|List)\s*[- ]?(?:I|1|II|2)\b\s*:*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildMatchingQuestionParts(question, textOverride) {
  const rawText = String(textOverride ?? question?.question ?? "").trim();
  const normalizedText = normalizeInput(rawText);
  if (!normalizedText || !isMatchingQuestion(question, normalizedText)) return null;

  const { left, right } = collectEntries(normalizedText);
  if (!left.length || !right.length) return null;

  return {
    intro: stripTableEntries(normalizedText, left, right),
    left,
    right,
  };
}

export function MatchingQuestionTable({ question, text, className = "", textClassName = "" }) {
  const parts = buildMatchingQuestionParts(question, text);
  const displayText = String(text ?? question?.question ?? "");

  if (!parts) {
    return <MathText className={textClassName}>{displayText}</MathText>;
  }

  const rowCount = Math.max(parts.left.length, parts.right.length);

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.intro ? <MathText className={textClassName}>{parts.intro}</MathText> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2">Column I</th>
              <th className="border-b border-slate-200 px-3 py-2">Column II</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, index) => {
              const left = parts.left[index];
              const right = parts.right[index];
              return (
                <tr key={`${left?.label || "left"}-${right?.label || "right"}-${index}`} className="border-b border-slate-100 last:border-b-0">
                  <td className="min-w-[12rem] align-top px-3 py-3">
                    {left ? (
                      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                        <span className="font-black text-slate-900">{left.label}.</span>
                        <MathText className="text-sm font-semibold leading-6 text-slate-900">{left.text}</MathText>
                      </div>
                    ) : null}
                  </td>
                  <td className="min-w-[12rem] align-top px-3 py-3">
                    {right ? (
                      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
                        <span className="font-black text-slate-900">{right.label}.</span>
                        <MathText className="text-sm font-semibold leading-6 text-slate-900">{right.text}</MathText>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
