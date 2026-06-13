import { dashboardCarouselService } from "../api/dashboardCarouselService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function DashboardCarouselPage() {
  return (
    <EntityManagerPage
      title="Dashboard Carousel"
      description="Manage app dashboard banners, ordering, visibility, and redirect links."
      service={dashboardCarouselService}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "subtitle", label: "Subtitle", full: true },
        { name: "imageUrl", label: "Image URL", required: true, full: true },
        { name: "redirectLink", label: "Redirect Link", full: true },
        { name: "displayOrder", label: "Display Order", type: "number", defaultValue: 0 },
        { name: "enabled", label: "Enabled", type: "checkbox", toggleLabel: "Show this banner in the app", defaultValue: true },
      ]}
      columns={[
        { key: "displayOrder", label: "Order" },
        { key: "title", label: "Title" },
        { key: "subtitle", label: "Subtitle" },
        { key: "enabled", label: "Enabled", render: (row) => (row.enabled ? "Yes" : "No") },
      ]}
    />
  );
}
