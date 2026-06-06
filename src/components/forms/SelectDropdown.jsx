import { ui } from "../../ui";

export function SelectDropdown({ value, onChange, options = [], placeholder = "Select an option", disabled = false }) {
  return (
    <select className={ui.input} value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
