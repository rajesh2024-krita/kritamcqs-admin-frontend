import { cn } from "../../ui";
import { ChevronDown } from "lucide-react";

export function SelectDropdown({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option", 
  disabled = false,
  className = "",
  label = "",
  error = false,
}) {
  const compactSelect = cn(
    "w-full px-2.5 py-1 text-sm bg-slate-50 border rounded-lg appearance-none cursor-pointer transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
    "hover:border-slate-300",
    error ? "border-rose-300 bg-rose-50" : "border-slate-200",
    disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : "",
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-600 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          className={compactSelect}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="" className="text-slate-400 text-sm">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-slate-700 text-sm">
              {option.label}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          size={14} 
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200",
            error ? "text-rose-400" : "text-slate-400"
          )}
        />
      </div>

      {error && typeof error === 'string' && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-sm text-rose-600 font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}