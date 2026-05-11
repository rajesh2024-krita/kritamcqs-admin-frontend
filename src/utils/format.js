export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  if (Math.abs(number) < 1000) return String(number);

  const compact = number / 1000;
  return `${Number(compact.toFixed(2))}K`;
}

export function optionize(items = [], labelKey = "label", valueKey = "id") {
  return items.map((item) => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
}
