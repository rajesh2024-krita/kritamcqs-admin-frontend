import { ui } from "../../ui";
import { useState } from "react";

export function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState("");

  function flushInput() {
    const parts = String(input || "").split(",").map((p) => p.trim()).filter(Boolean);
    const newParts = parts.filter((p) => p && !value.includes(p));
    if (newParts.length) {
      onChange([...value, ...newParts]);
    }
    setInput("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      flushInput();
    }
    if (event.key === "Backspace" && input === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        className={ui.input}
        placeholder="Type a feature and press Enter to add"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => flushInput()}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className={ui.pill}>
            <span className="mr-2">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-sky-700 border border-slate-200"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
