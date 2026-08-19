import { ui } from "../../ui";
import { useState } from "react";
import { X } from "lucide-react";

export function TagInput({ value = [], onChange, placeholder = "Type and press Enter to add", label = "" }) {
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

  const compactInput = "w-full px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-[9px] placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed";

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[9px] font-medium text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      <input
        className={compactInput}
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => flushInput()}
      />
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {value.map((tag) => (
            <span 
              key={tag} 
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-medium text-indigo-700 transition-all hover:bg-indigo-100"
            >
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-indigo-200 transition-colors text-indigo-500 hover:text-indigo-700"
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {value.length === 0 && (
        <p className="text-[8px] text-slate-400">No tags added yet</p>
      )}
    </div>
  );
}