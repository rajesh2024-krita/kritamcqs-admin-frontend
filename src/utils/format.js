export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function optionize(items = [], labelKey = "label", valueKey = "id") {
  return items.map((item) => ({
    label: item[labelKey],
    value: item[valueKey],
  }));
}
