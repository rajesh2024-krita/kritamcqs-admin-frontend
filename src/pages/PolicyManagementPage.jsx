import { policyPageService } from "../api/policyPageService";
import { EntityManagerPage } from "./common/EntityManagerPage";
import { HtmlPreviewFrame } from "./common/HtmlPreviewFrame";

const policyTypes = () => [
  { label: "Privacy Policy", value: "privacy" },
  { label: "Terms & Conditions", value: "terms" },
  { label: "Refund Policy", value: "refund" },
  { label: "Cancellation Policy", value: "cancellation" },
  { label: "Shipping Policy", value: "shipping" },
  { label: "Custom Policy", value: "custom" },
];

const statuses = () => [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

export function PolicyManagementPage() {
  return (
    <EntityManagerPage
      title="Policy Pages"
      description="Create, preview, publish, and unpublish app and website policy pages with HTML, CSS, Tailwind, and Bootstrap support."
      service={policyPageService}
      fields={[
        { name: "title", label: "Page Title", required: true },
        { name: "slug", label: "Page Slug", required: true },
        { name: "type", label: "Policy Type", type: "select", options: policyTypes, defaultValue: "custom" },
        { name: "seoTitle", label: "SEO Title" },
        { name: "seoDescription", label: "SEO Description", type: "textarea" },
        { name: "seoKeywords", label: "SEO Keywords" },
        { name: "ogTitle", label: "Open Graph Title" },
        { name: "ogDescription", label: "Open Graph Description", type: "textarea" },
        { name: "ogImage", label: "Open Graph Image" },
        { name: "canonicalUrl", label: "Canonical URL" },
        { name: "noIndex", label: "Indexing", type: "checkbox", toggleLabel: "No index", defaultValue: false },
        { name: "html", label: "HTML / Rich Text Content", type: "textarea", preserveWhitespace: true },
        { name: "css", label: "CSS", type: "textarea", preserveWhitespace: true },
        { name: "status", label: "Draft / Published", type: "select", options: statuses, defaultValue: "draft" },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Active", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
      ]}
      columns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "active", label: "Active", render: (row) => row.active ? "Yes" : "No" },
      ]}
      renderFormPreview={({ formState }) => <HtmlPreviewFrame html={formState.html} css={formState.css} />}
    />
  );
}
