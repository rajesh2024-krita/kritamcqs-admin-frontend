import katex from "katex";
import { useMemo } from "react";

const DELIMITER_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
const BARE_MATH_PATTERN = /\\(?:frac|sqrt|sum|int|lim|log|sin|cos|tan|theta|alpha|beta|gamma|Delta|pi|cdot|times|leq|geq|neq)|(?:[A-Za-z0-9)}]\s*[_^]\s*\{?[A-Za-z0-9+\-=]+\}?)|(?:^[A-Za-z0-9\\_^{},+\-*/().\s]+=[A-Za-z0-9\\_^{},+\-*/().\s]+$)/;

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
    if (offset > lastIndex) {
      segments.push({ text: input.slice(lastIndex, offset), math: false, display: false });
    }
    const stripped = stripDelimiter(match);
    segments.push({ text: stripped.text, math: true, display: stripped.display });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), math: false, display: false });
  }

  if (segments.length === 1 && !segments[0].math && BARE_MATH_PATTERN.test(input.trim())) {
    return [{ text: input.trim(), math: true, display: false }];
  }

  return segments.length ? segments : [{ text: input, math: false, display: false }];
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

export function MathText({ children, className = "", inline = false }) {
  const value = String(children ?? "");
  const segments = useMemo(() => parseMathText(value), [value]);
  if (!value) return null;

  const Root = inline ? "span" : "div";

  return (
    <Root className={`math-text whitespace-pre-wrap break-words ${className}`}>
      {segments.map((segment, index) => {
        if (!segment.math) return <span key={index}>{segment.text}</span>;

        const html = renderKatex(segment.text, segment.display);
        if (!html) return <span key={index}>{segment.text}</span>;

        const MathRoot = segment.display ? "div" : "span";
        return (
          <MathRoot
            key={index}
            className={segment.display ? "my-3 overflow-x-auto" : "inline-block max-w-full align-baseline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Root>
  );
}
