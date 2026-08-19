import { cn, ui } from "../../ui";
import { AlertCircle, Info } from "lucide-react";

export function Field({ 
  label, 
  error, 
  children, 
  className = "", 
  required = false, 
  description = "",
  full = false,
  inline = false,
  labelWidth = "w-20",
  id
}) {
  // Inline mode for horizontal layouts
  if (inline) {
    return (
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-1",
        full ? "col-span-full" : "",
        className
      )}>
        <div className={cn(
          "flex items-center gap-1 py-1",
          labelWidth
        )}>
          {label && (
            <>
              <label 
                htmlFor={id}
                className="text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap"
              >
                {label}
              </label>
              {required && (
                <span className="text-[10px] text-rose-500 font-medium">*</span>
              )}
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative">
            {children}
            {error && (
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none">
                <AlertCircle size={12} className="text-rose-500" />
              </div>
            )}
          </div>
          {description && !error && (
            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{description}</p>
          )}
          {error && (
            <div className="flex items-start gap-1 mt-0.5">
              <AlertCircle size={10} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-rose-600 font-medium leading-relaxed">{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default stacked layout
  return (
    <div className={cn(
      "flex flex-col gap-1",
      full ? "col-span-full" : "",
      className
    )}>
      {/* Label Section */}
      {label && (
        <div className="flex items-center gap-1">
          <label 
            htmlFor={id}
            className="text-xs font-medium text-slate-600 uppercase tracking-wider select-none"
          >
            {label}
          </label>
          {required && (
            <span className="text-[10px] text-rose-500 font-medium" title="Required field">*</span>
          )}
        </div>
      )}
      
      {/* Input Field */}
      <div className="relative">
        {children}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <AlertCircle size={14} className="text-rose-500" />
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      {description && !error && (
        <div className="flex items-start gap-1">
          <Info size={10} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 leading-relaxed">{description}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-1 animate-in slide-in-from-left-1 duration-200">
          <AlertCircle size={10} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-rose-600 font-medium leading-relaxed">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}