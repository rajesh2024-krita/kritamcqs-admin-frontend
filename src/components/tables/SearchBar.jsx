import { SearchIcon } from "../common/AdminIcons";

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
      <SearchIcon size={16} />
      <input
        className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
