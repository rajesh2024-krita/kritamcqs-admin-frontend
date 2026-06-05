import { listStyleService } from "../../api/listStyleService";
import { EntityManagerPage } from "../common/EntityManagerPage";

const CATEGORY_OPTIONS = [
  { label: "Bullet List", value: "unordered" },
  { label: "Numbered List", value: "ordered" },
  { label: "Alphabetical List", value: "alphabetical" },
  { label: "Roman Numeral List", value: "roman" },
  { label: "Parenthesis List", value: "parenthesis" },
  { label: "Multi-level List", value: "multilevel" },
  { label: "Custom List", value: "custom" },
];

const CSS_LIST_STYLE_OPTIONS = [
  { label: "Disc", value: "disc" },
  { label: "Circle", value: "circle" },
  { label: "Square", value: "square" },
  { label: "Decimal", value: "decimal" },
  { label: "Decimal Leading Zero", value: "decimal-leading-zero" },
  { label: "Upper Alpha", value: "upper-alpha" },
  { label: "Lower Alpha", value: "lower-alpha" },
  { label: "Upper Roman", value: "upper-roman" },
  { label: "Lower Roman", value: "lower-roman" },
  { label: "None", value: "none" },
];

const DEFAULT_LEVELS = [
  { level: 1, listStyleType: "decimal", markerTemplate: "{value}.", markerSuffix: ".", indentation: 24 },
  { level: 2, listStyleType: "lower-alpha", markerTemplate: "{value}.", markerSuffix: ".", indentation: 40 },
  { level: 3, listStyleType: "lower-roman", markerTemplate: "{value}.", markerSuffix: ".", indentation: 56 },
];

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function parseLevels(value) {
  if (Array.isArray(value)) return value;
  const text = String(value || "").trim();
  if (!text) return DEFAULT_LEVELS;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : DEFAULT_LEVELS;
  } catch {
    return DEFAULT_LEVELS;
  }
}

function stringifyLevels(levels) {
  return JSON.stringify(parseLevels(levels), null, 2);
}

export function ListStylesPage() {
  return (
    <EntityManagerPage
      title="List Styles"
      description="Manage list symbols, numbering formats, hierarchy levels, defaults, and display order for content rendering."
      service={listStyleService}
      sortable
      defaultQuery={{ sortBy: "sortOrder", sortOrder: "asc" }}
      mapItemToForm={(item, form) => ({
        ...form,
        name: item.name || "",
        key: item.key || "",
        category: item.category || "ordered",
        listStyleType: item.listStyleType || "decimal",
        markerTemplate: item.markerTemplate || "{value}.",
        markerSuffix: item.markerSuffix || ".",
        startAt: item.startAt || 1,
        levels: stringifyLevels(item.levels),
        description: item.description || "",
        isActive: item.isActive !== false,
        isDefault: Boolean(item.isDefault),
        sortOrder: item.sortOrder || 0,
      })}
      filters={[
        {
          name: "category",
          label: "Category",
          placeholder: "All Categories",
          options: CATEGORY_OPTIONS,
        },
        {
          name: "isActive",
          label: "Status",
          placeholder: "All Statuses",
          options: [
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
      ]}
      fields={[
        { name: "name", label: "Style Name", required: true },
        { name: "key", label: "Style Key", placeholder: "auto-generated from name" },
        {
          name: "category",
          label: "Category",
          type: "select",
          required: true,
          defaultValue: "ordered",
          options: CATEGORY_OPTIONS,
        },
        {
          name: "listStyleType",
          label: "CSS List Style",
          type: "select",
          defaultValue: "decimal",
          options: CSS_LIST_STYLE_OPTIONS,
        },
        { name: "markerTemplate", label: "Marker Template", defaultValue: "{value}.", placeholder: "{value}. or ({value})" },
        { name: "markerSuffix", label: "Marker Suffix", defaultValue: ".", placeholder: "." },
        { name: "startAt", label: "Start At", type: "number", defaultValue: 1 },
        { name: "sortOrder", label: "Display Order", type: "number", defaultValue: 0 },
        { name: "isActive", label: "Active", type: "switch", defaultValue: true },
        { name: "isDefault", label: "Default Style", type: "switch", defaultValue: false },
        {
          name: "levels",
          label: "Hierarchy Levels JSON",
          type: "textarea",
          full: true,
          defaultValue: stringifyLevels(DEFAULT_LEVELS),
        },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "sortOrder", label: "Order" },
        { key: "name", label: "Name" },
        { key: "category", label: "Category", render: (row) => categoryLabel(row.category) },
        { key: "listStyleType", label: "CSS Style" },
        { key: "markerTemplate", label: "Marker" },
        {
          key: "isDefault",
          label: "Default",
          render: (row) => (row.isDefault ? "Yes" : "No"),
        },
        {
          key: "isActive",
          label: "Status",
          render: (row) => (row.isActive === false ? "Inactive" : "Active"),
        },
      ]}
    />
  );
}
