import { cmsMenuItemService } from "../api/cmsMenuItemService";
import { EntityManagerPage } from "./common/EntityManagerPage";

const linkTypes = () => [
  { label: "Page Route", value: "page" },
  { label: "Single Page Section", value: "section" },
  { label: "External Link", value: "external" },
];

const areas = () => [
  { label: "Navbar", value: "navbar" },
  { label: "Footer", value: "footer" },
  { label: "Navbar and Footer", value: "both" },
];

export function CmsMenusPage() {
  return (
    <EntityManagerPage
      title="CMS Menu Items"
      description="Control navbar/footer visibility, order, dropdown parents, route links, section links, and external links."
      service={cmsMenuItemService}
      fields={[
        { name: "label", label: "Menu Label", required: true },
        { name: "linkType", label: "Link Type", type: "select", options: linkTypes, defaultValue: "page" },
        { name: "pageSlug", label: "Page Slug", visible: (form) => form.linkType === "page" },
        { name: "href", label: "Section / External Link", visible: (form) => form.linkType !== "page" },
        { name: "parentId", label: "Parent Menu ID" },
        { name: "area", label: "Menu Area", type: "select", options: areas, defaultValue: "navbar" },
        { name: "visible", label: "Visible", type: "checkbox", toggleLabel: "Show menu item", defaultValue: true },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Active", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
      ]}
      columns={[
        { key: "sortOrder", label: "Order" },
        { key: "label", label: "Label" },
        { key: "linkType", label: "Type" },
        { key: "pageSlug", label: "Page" },
        { key: "href", label: "Href" },
        { key: "area", label: "Area" },
        { key: "visible", label: "Visible", render: (row) => row.visible ? "Yes" : "No" },
      ]}
    />
  );
}
