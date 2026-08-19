import { cn } from "../../ui";
import { SearchIcon } from "../common/AdminIcons";
import { X } from "lucide-react";

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  onClear,
  className = "",
  compact = true 
}) {
  return (
    <div className={cn(
      "relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg transition-all duration-200",
      "focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20",
      "hover:border-slate-300",
      compact ? "px-2.5 py-1" : "px-3 py-1.5",
      className
    )}>
      <SearchIcon size={compact ? 14 : 16} className="text-slate-400 flex-shrink-0" />
      <input
        className={cn(
          "w-full bg-transparent border-0 outline-none ring-0 shadow-none",
          "placeholder:text-slate-400 focus:ring-0",
          compact ? "text-[10px]" : "text-sm"
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
        >
          <X size={compact ? 12 : 14} />
        </button>
      )}
    </div>
  );
}