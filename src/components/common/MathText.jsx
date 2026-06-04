import katex from "katex";
import "katex/contrib/mhchem";
import { useMemo } from "react";

const DELIMITER_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
const BARE_MATH_PATTERN = /\\(?:frac|sqrt|sum|int|lim|log|sin|cos|tan|theta|alpha|beta|gamma|Delta|pi|cdot|times|leq|geq|neq)|[αβγδθλμπσφωΔΩ]|(?:[A-Za-z0-9)}]\s*[_^]\s*\{?[A-Za-z0-9+\-=]+\}?)|(?:^[A-Za-z0-9\\_^{},+\-*/().\s]+=[A-Za-z0-9\\_^{},+\-*/().\s]+$)|\\ce\{[^{}]+\}/;
const BARE_MATH_FRAGMENT_PATTERN =
  /(?:\\frac\s*\{[^{}]+\}\s*\{[^{}]+\}|\\sqrt\s*\{[^{}]+\}|\\(?:sum|int|lim)(?:\s*[_^]\s*\{?[^{}\s]+\}?)*|\\(?:log|sin|cos|tan|theta|alpha|beta|gamma|Delta|pi|cdot|times|leq|geq|neq)|[αβγδθλμπσφωΔΩ]|[A-Za-z0-9]+(?:\s*[_^]\s*\{?[^{}\s]+\}?)+|[A-Za-zαβγδθλμπσφωΔΩ][A-Za-z0-9_{}\\^().+\-αβγδθλμπσφωΔΩ]*(?:\s*=\s*[A-Za-z0-9_{}\\^().+\-*/αβγδθλμπσφωΔΩ]+)+|\d+(?:\.\d+)?\s*(?:x|X|×)\s*10\^?-?\d+|\d+(?:\.\d+)?e[+-]?\d+)/g;
const CHEMISTRY_FRAGMENT_PATTERN =
  /(?:\\ce\{[^{}]+\}|(?:\d*[A-Z][a-z]?\d*){2,}(?:\^\{?[0-9]*[+-]\}?|[+-])?(?:\s*(?:->|<-|<=>|=>|=|⇌|→|←|\+)\s*(?:\d*[A-Z][a-z]?\d*){2,}(?:\^\{?[0-9]*[+-]\}?|[+-])?)+|(?:\d*[A-Z][a-z]?\d*){2,}(?:\^\{?[0-9]*[+-]\}?|[+-])?)/g;
const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const SECTION_LABEL_PATTERN = /^(explanation|key concept|concept|important notes?|notes?|formula|final answer|answer|solution|steps?|characteristics?|advantages?|examples?|reaction|reactions?|conclusion)\s*[:\-]\s*(.*)$/i;
const BULLET_LINE_PATTERN = /^\s*(?:[-*•]|[A-Za-z]\)|[A-Za-z]\.)\s+(.+)$/;
const NUMBERED_LINE_PATTERN = /^\s*(\d+)[).]\s+(.+)$/;
const INLINE_SECTION_PATTERN = /\b(Explanation|Key Concept|Important Notes?|Formula|Final Answer|Answer|Solution|Reason|Steps?|Characteristics?|Advantages?|Examples?|Reactions?)\s*[:\-]\s*/g;
const ASSERTION_REASON_LINE_PATTERN = /^(assertion\s*(?:\(?a\)?)?|reason\s*(?:\(?r\)?)?)\s*[:\-]\s*(.*)$/i;
const LIST_LINE_PATTERN = /^\s*(?:(?:\d+)[).]|\(\d+\)|\[\d+\]|(?:[ivxlcdm]+|[IVXLCDM]+)[).]|\((?:[ivxlcdm]+|[IVXLCDM]+)\)|[A-Za-z][).]|\([A-Za-z]\)|[-*]|\u2022|\u2192|\u2713|\u2605)\s+(.+)$/;
const ORDERED_LIST_LINE_PATTERN = /^\s*(?:(?:\d+)[).]|\(\d+\)|\[\d+\]|(?:[ivxlcdm]+|[IVXLCDM]+)[).]|\((?:[ivxlcdm]+|[IVXLCDM]+)\)|[A-Za-z][).]|\([A-Za-z]\))\s+/;
const INLINE_ASSERTION_REASON_PATTERN = /\b(Assertion\s*(?:\(?A\)?)?|Reason\s*(?:\(?R\)?)?)\s*[:\-]\s*/gi;
const INLINE_LIST_MARKER_PATTERN = /\s+(?=(?:\d+[).]|\(\d+\)|\[\d+\]|(?:[ivxlcdm]+|[IVXLCDM]+)[).]|\((?:[ivxlcdm]+|[IVXLCDM]+)\)|[A-Za-z][).]|\([A-Za-z]\)|[-*]|\u2022|\u2192|\u2713|\u2605)\s+)/g;
const GREEK_SYMBOLS = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  θ: "\\theta",
  λ: "\\lambda",
  μ: "\\mu",
  π: "\\pi",
  σ: "\\sigma",
  φ: "\\phi",
  ω: "\\omega",
  Δ: "\\Delta",
  Ω: "\\Omega",
};

function stripDelimiter(value) {
  if (value.startsWith("$$") && value.endsWith("$$")) return { text: value.slice(2, -2), display: true };
  if (value.startsWith("$") && value.endsWith("$")) return { text: value.slice(1, -1), display: false };
  if (value.startsWith("\\[") && value.endsWith("\\]")) return { text: value.slice(2, -2), display: true };
  if (value.startsWith("\\(") && value.endsWith("\\)")) return { text: value.slice(2, -2), display: false };
  return { text: value, display: false };
}

function parseMathText(input) {
  const segments = [];
  let lastIndex = 0;

  input.replace(DELIMITER_PATTERN, (match, _whole, offset) => {
    if (offset > lastIndex) segments.push({ text: input.slice(lastIndex, offset), math: false, display: false });
    const stripped = stripDelimiter(match);
    segments.push({ text: stripped.text, math: true, display: stripped.display });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < input.length) segments.push({ text: input.slice(lastIndex), math: false, display: false });

  if (segments.length === 1 && !segments[0].math) {
    const trimmed = input.trim();
    if (isStandaloneMath(trimmed)) return [{ text: normalizeFormulaText(trimmed, isLikelyChemistry(trimmed)), math: true, display: false }];
    const bareSegments = parseBareMathFragments(input);
    if (bareSegments.some((segment) => segment.math)) return bareSegments;
  }

  return expandPlainTextSegments(segments.length ? segments : [{ text: input, math: false, display: false }]);
}

function isStandaloneMath(input) {
  if (!BARE_MATH_PATTERN.test(input)) return false;
  if (/^\\ce\{[^{}]+\}$/.test(input.trim())) return true;
  if (/^[A-Za-z0-9\\_^{},+\-*/().\s]+=[A-Za-z0-9\\_^{},+\-*/().\s]+$/.test(input)) return input.trim().split(/\s+/).length <= 5;
  const withoutMathFragments = input.replace(BARE_MATH_FRAGMENT_PATTERN, " ");
  const proseWords = withoutMathFragments.match(/[A-Za-z]{2,}/g) ?? [];
  if (proseWords.length > 0) return false;
  if (/^\\(?:frac|sqrt|sum|int|lim|log|sin|cos|tan)/.test(input.trim())) return true;
  return !/[.!?]/.test(input) && input.trim().split(/\s+/).length <= 3;
}

function parseBareMathFragments(input) {
  const segments = [];
  let lastIndex = 0;
  const matches = collectBareFragments(input);

  matches.forEach(({ text, offset, chemistry }) => {
    if (offset > lastIndex) segments.push({ text: input.slice(lastIndex, offset), math: false, display: false });
    segments.push({ text: normalizeFormulaText(text.trim(), chemistry), math: true, display: false });
    lastIndex = offset + text.length;
  });

  if (lastIndex < input.length) segments.push({ text: input.slice(lastIndex), math: false, display: false });
  return segments.length ? segments : [{ text: input, math: false, display: false }];
}

function expandPlainTextSegments(segments) {
  return segments.flatMap((segment) => {
    if (segment.math || HTML_PATTERN.test(segment.text)) return [segment];
    const bareSegments = parseBareMathFragments(segment.text);
    return bareSegments.some((bareSegment) => bareSegment.math) ? bareSegments : [segment];
  });
}

function collectBareFragments(input) {
  const matches = [];
  input.replace(CHEMISTRY_FRAGMENT_PATTERN, (match, offset) => {
    if (isLikelyChemistry(match)) matches.push({ text: match, offset, chemistry: true });
    return match;
  });
  input.replace(BARE_MATH_FRAGMENT_PATTERN, (match, offset) => {
    matches.push({ text: match, offset, chemistry: false });
    return match;
  });
  return matches
    .sort((first, second) => first.offset - second.offset || second.text.length - first.text.length)
    .reduce((accepted, match) => {
      const previous = accepted[accepted.length - 1];
      if (previous && match.offset < previous.offset + previous.text.length) return accepted;
      accepted.push(match);
      return accepted;
    }, []);
}

function isLikelyChemistry(value) {
  if (/^\\ce\{[^{}]+\}$/.test(value)) return true;
  if (/(?:->|<-|<=>|=>|⇌|→|←)/.test(value)) return true;
  if (/\^\{?[0-9]*[+-]\}?|[+-]$/.test(value)) return true;
  return /[A-Z][a-z]?\d/.test(value) && /(?:[A-Z][a-z]?){2,}|[A-Z][a-z]?\d/.test(value);
}

function normalizeFormulaText(value, chemistry) {
  if (/^\\ce\{[^{}]+\}$/.test(value)) return value;
  if (chemistry) return `\\ce{${value.replace(/⇌/g, "<=>").replace(/→/g, "->").replace(/←/g, "<-")}}`;
  const scientific = value.match(/^(\d+(?:\.\d+)?)\s*(?:x|X|×)\s*10\^?(-?\d+)$/);
  if (scientific) return `${scientific[1]} \\times 10^{${scientific[2]}}`;
  const eNotation = value.match(/^(\d+(?:\.\d+)?)e([+-]?\d+)$/i);
  if (eNotation) return `${eNotation[1]} \\times 10^{${eNotation[2]}}`;
  return value.replace(/[αβγδθλμπσφωΔΩ]/g, (symbol) => GREEK_SYMBOLS[symbol] ?? symbol);
}

function renderKatex(value, displayMode) {
  try {
    return katex.renderToString(value, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return "";
  }
}

function normalizeStructuredText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?(?:p|div)[^>]*>/gi, "\n\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function exposeInlineSections(value) {
  return value
    .replace(INLINE_ASSERTION_REASON_PATTERN, (_match, label, offset) => {
      const normalized = /^reason/i.test(label) ? "Reason (R)" : "Assertion (A)";
      return `${offset === 0 ? "" : "\n\n"}${normalized}: `;
    })
    .replace(INLINE_SECTION_PATTERN, (_match, label, offset) => `${offset === 0 ? "" : "\n\n"}${label}: `);
}

function exposeInlineListMarkers(value) {
  const matches = value.match(INLINE_LIST_MARKER_PATTERN) ?? [];
  if (matches.length < 2) return value;
  return value.replace(INLINE_LIST_MARKER_PATTERN, "\n");
}

function isStandaloneFormulaLine(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isStandaloneMath(trimmed) || isLikelyChemistry(trimmed)) return true;
  if (/(?:->|<-|<=>|=>|=|⇌|→|←)/.test(trimmed) && trimmed.length <= 120) return true;
  return /^[A-Za-z0-9_{}\\^().+\-*/=,\s]+$/.test(trimmed) && /[=^_\\]/.test(trimmed) && trimmed.split(/\s+/).length <= 8;
}

function pushParagraph(blocks, lines) {
  const text = lines.join(" ").replace(/\s+/g, " ").trim();
  if (text) blocks.push({ type: "paragraph", text });
  lines.length = 0;
}

function parseTableRow(line) {
  if (!line.includes("|")) return null;
  const cells = line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  if (cells.length < 2) return null;
  if (cells.every((cell) => /^:?-{2,}:?$/.test(cell))) return [];
  return cells;
}

function getOrderedListStyle(line) {
  const marker = line.trim().match(/^(\(?[A-Za-z]+\)?|[A-Za-z]+[).]|\(?[ivxlcdmIVXLCDM]+\)?|\d+[).]|\(\d+\)|\[\d+\])/);
  const value = (marker?.[1] ?? "").replace(/[()[\].]/g, "");
  if (/^[ivxlcdm]+$/.test(value)) return "lower-roman";
  if (/^[IVXLCDM]+$/.test(value)) return "upper-roman";
  if (/^[a-z]$/.test(value)) return "lower-alpha";
  if (/^[A-Z]$/.test(value)) return "upper-alpha";
  return "decimal";
}

function parseStructuredBlocks(input) {
  const normalized = exposeInlineListMarkers(exposeInlineSections(normalizeStructuredText(input)));
  if (!normalized) return [];
  const blocks = [];
  const paragraphLines = [];
  let list = null;
  let tableRows = [];
  const flushList = () => {
    if (list?.items?.length) blocks.push({ type: list.type, items: list.items });
    list = null;
  };
  const flushTable = () => {
    if (tableRows.length) blocks.push({ type: "table", rows: tableRows });
    tableRows = [];
  };

  normalized.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      pushParagraph(blocks, paragraphLines);
      flushList();
      flushTable();
      return;
    }
    const tableRow = parseTableRow(line);
    if (tableRow) {
      pushParagraph(blocks, paragraphLines);
      flushList();
      if (tableRow.length) tableRows.push(tableRow);
      return;
    }
    flushTable();

    const assertionReason = line.match(ASSERTION_REASON_LINE_PATTERN);
    if (assertionReason) {
      pushParagraph(blocks, paragraphLines);
      flushList();
      blocks.push({
        type: "labeled",
        label: /^reason/i.test(assertionReason[1]) ? "Reason (R)" : "Assertion (A)",
        text: assertionReason[2].trim(),
      });
      return;
    }
    const section = line.match(SECTION_LABEL_PATTERN);
    if (section) {
      pushParagraph(blocks, paragraphLines);
      flushList();
      blocks.push({ type: "section", text: section[1].replace(/\b\w/g, (char) => char.toUpperCase()) });
      if (section[2]?.trim()) {
        const trailing = section[2].trim();
        blocks.push({ type: isStandaloneFormulaLine(trailing) ? "formula" : "paragraph", text: trailing });
      }
      return;
    }
    const listLine = line.match(LIST_LINE_PATTERN);
    if (listLine) {
      pushParagraph(blocks, paragraphLines);
      const listType = ORDERED_LIST_LINE_PATTERN.test(line) ? "ol" : "ul";
      const listStyle = listType === "ol" ? getOrderedListStyle(line) : undefined;
      if (list?.type !== listType || (listType === "ol" && list?.style !== listStyle)) flushList();
      list ??= { type: listType, items: [], style: listStyle };
      list.items.push(listLine[1].trim());
      return;
    }
    if (isStandaloneFormulaLine(line)) {
      pushParagraph(blocks, paragraphLines);
      flushList();
      blocks.push({ type: "formula", text: line });
      return;
    }
    flushList();
    paragraphLines.push(line);
  });

  pushParagraph(blocks, paragraphLines);
  flushList();
  flushTable();
  return blocks;
}

export function MathText({ children, className = "", inline = false }) {
  const value = String(children ?? "");
  const segments = useMemo(() => parseMathText(value), [value]);
  const blocks = useMemo(() => (!inline && !HTML_PATTERN.test(value) ? parseStructuredBlocks(value) : []), [inline, value]);
  if (!value) return null;

  const Root = inline ? "span" : "div";
  const renderSegments = (items, keyPrefix = "") =>
    items.map((segment, index) => {
      if (!segment.math) return <span key={`${keyPrefix}${index}`}>{segment.text}</span>;
      const html = renderKatex(segment.text, segment.display);
      if (!html) return <span key={`${keyPrefix}${index}`}>{segment.text}</span>;
      const MathRoot = segment.display ? "div" : "span";
      return (
        <MathRoot
          key={`${keyPrefix}${index}`}
          className={segment.display ? "math-text-formula math-text-formula-block" : "math-text-formula math-text-formula-inline"}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });

  if (blocks.length > 1) {
    return (
      <Root className={`math-text math-text-structured ${inline ? "math-text-inline" : "math-text-block"} ${className}`}>
        {blocks.map((block, index) => {
          if (block.type === "section") return <div key={index} className="math-text-section">{block.text}</div>;
          if (block.type === "labeled") {
            return (
              <div key={index} className="math-text-labeled">
                <div className="math-text-label">{block.label}:</div>
                {block.text ? <div className="math-text-line">{renderSegments(parseMathText(block.text), `${index}-`)}</div> : null}
              </div>
            );
          }
          if (block.type === "ul" || block.type === "ol") {
            const ListRoot = block.type;
            return (
              <ListRoot key={index} className="math-text-list" style={block.type === "ol" ? { listStyleType: block.style ?? "decimal" } : undefined}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderSegments(parseMathText(item), `${index}-${itemIndex}-`)}</li>
                ))}
              </ListRoot>
            );
          }
          if (block.type === "table") {
            const [header, ...body] = block.rows;
            return (
              <div key={index} className="math-text-table-wrap">
                <table className="math-text-table">
                  <thead>
                    <tr>
                      {header.map((cell, cellIndex) => (
                        <th key={cellIndex}>{renderSegments(parseMathText(cell), `${index}-h-${cellIndex}-`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{renderSegments(parseMathText(cell), `${index}-${rowIndex}-${cellIndex}-`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          return (
            <div key={index} className={block.type === "formula" ? "math-text-line math-text-line-formula" : "math-text-line"}>
              {renderSegments(parseMathText(block.text), `${index}-`)}
            </div>
          );
        })}
      </Root>
    );
  }

  return <Root className={`math-text ${inline ? "math-text-inline" : "math-text-block"} ${className}`}>{renderSegments(segments)}</Root>;
}
