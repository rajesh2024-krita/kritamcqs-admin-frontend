import { cn, ui } from "../../ui";
import { X } from "lucide-react";

export function EntityFormWrapper({ 
  title, 
  subtitle, 
  children, 
  onCancel, 
  onSubmit, 
  submitLabel, 
  submitDisabled = false, 
  modalClassName = "", 
  formClassName = "" 
}) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={cn(
        "admin-modal w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 animate-in slide-in-from-bottom-4 duration-300",
        modalClassName
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            <X size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-160px)]">
          <form className={cn("flex flex-col gap-6", formClassName)} onSubmit={onSubmit}>
            {/* Form Progress Indicator - Optional decorative element */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">Fill in the details</span>
              <div className="flex-1 h-0.5 bg-slate-200 rounded-full" />
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {children}
            </div>

            {/* Footer Actions */}
            <div className="sticky -bottom-5 -mx-6 -mb-6 mt-2 bg-white/95 backdrop-blur-sm border-t border-slate-200/60 px-6 py-4 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    All fields are required unless marked optional
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium text-white rounded-lg transition-all duration-200 shadow-sm",
                      submitDisabled
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                    )}
                  >
                    {submitDisabled && (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {submitDisabled ? 'Saving...' : submitLabel}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}