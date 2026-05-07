import { ui } from "../../ui";

export function SelectDropdown({ value, onChange, options = [], placeholder = "Select an option" }) {
  return (
    <select className={ui.input} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
