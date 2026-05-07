import { ui } from "../../ui";

export function TagInput({ value = [], onChange }) {
  return (
    <div className="flex flex-col gap-6">
      <input
        className={ui.input}
        placeholder="comma,separated,tags"
        value={value.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
      />
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => <span key={tag} className={ui.pill}>{tag}</span>)}
      </div>
    </div>
  );
}
