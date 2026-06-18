import { cmsPageService } from "../api/cmsPageService";
import { EntityManagerPage } from "./common/EntityManagerPage";
import { HtmlPreviewFrame } from "./common/HtmlPreviewFrame";

const statuses = () => [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

export function CmsPagesPage() {
  return (
    <EntityManagerPage
      title="CMS Pages"
      description="Create unlimited dynamic website pages with HTML, CSS, Tailwind, Bootstrap, and optional scripts."
      service={cmsPageService}
      fields={[
        { name: "title", label: "Page Title", required: true },
        { name: "slug", label: "Page Slug", required: true },
        { name: "metaTitle", label: "Meta Title" },
        { name: "metaDescription", label: "Meta Description", type: "textarea" },
        { name: "seoKeywords", label: "SEO Keywords" },
        { name: "ogTitle", label: "Open Graph Title" },
        { name: "ogDescription", label: "Open Graph Description", type: "textarea" },
        { name: "ogImage", label: "Open Graph Image" },
        { name: "canonicalUrl", label: "Canonical URL" },
        { name: "noIndex", label: "Indexing", type: "checkbox", toggleLabel: "No index", defaultValue: false },
        { name: "featuredImage", label: "Featured Image URL" },
        { name: "menuName", label: "Menu Name" },
        { name: "parentMenu", label: "Parent Menu" },
        { name: "html", label: "HTML Content", type: "textarea", preserveWhitespace: true },
        { name: "css", label: "CSS", type: "textarea", preserveWhitespace: true },
        { name: "scripts", label: "Custom Scripts", type: "textarea", preserveWhitespace: true },
        { name: "status", label: "Draft / Published", type: "select", options: statuses, defaultValue: "draft" },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Active", defaultValue: true },
        { name: "showInMenu", label: "Show In Menu", type: "checkbox", toggleLabel: "Show in navbar settings", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
        { name: "scheduledPublishAt", label: "Schedule Publish", type: "datetime-local" },
      ]}
      columns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "menuName", label: "Menu" },
        { key: "status", label: "Status" },
        { key: "active", label: "Active", render: (row) => row.active ? "Yes" : "No" },
        { key: "showInMenu", label: "Menu", render: (row) => row.showInMenu ? "Show" : "Hide" },
      ]}
      renderFormPreview={({ formState }) => <HtmlPreviewFrame html={formState.html} css={formState.css} scripts={formState.scripts} />}
    />
  );
}
