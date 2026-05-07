export function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <label className="inline-flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label || "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
          checked
            ? "border-blue-500 bg-blue-500"
            : "border-slate-300 bg-slate-200"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      {label ? (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      ) : null}
    </label>
  );
}
