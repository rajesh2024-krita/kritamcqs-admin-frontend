import { cn } from "../../ui";

export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false, 
  label,
  size = "sm" // sm, md
}) {
  const sizes = {
    sm: {
      switch: "h-4 w-7",
      thumb: "h-2.5 w-2.5",
      translate: "translate-x-3.5",
      translateOff: "translate-x-0.5",
    },
    md: {
      switch: "h-5 w-9",
      thumb: "h-3.5 w-3.5",
      translate: "translate-x-4.5",
      translateOff: "translate-x-0.5",
    }
  };

  const sizeClasses = sizes[size] || sizes.sm;

  return (
    <label className={cn(
      "inline-flex items-center gap-2 cursor-pointer",
      disabled && "cursor-not-allowed opacity-50"
    )}>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label || "Toggle"}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full border-0 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          sizeClasses.switch,
          checked
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-sm shadow-indigo-500/25"
            : "bg-slate-300 hover:bg-slate-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white transition-all duration-200 shadow-sm",
            sizeClasses.thumb,
            checked ? sizeClasses.translate : sizeClasses.translateOff
          )}
        />
      </button>
      {label && (
        <span className="text-[10px] font-medium text-slate-700 select-none">
          {label}
        </span>
      )}
    </label>
  );
}