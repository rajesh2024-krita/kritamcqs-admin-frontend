import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function SubscriptionPlansPage() {
  return (
    <EntityManagerPage
      title="Subscription Plans"
      description="Create active or inactive subscription plans shown dynamically in the app."
      service={subscriptionPlanService}
      fields={[
        { name: "planId", label: "Plan ID", required: true },
        { name: "name", label: "Plan Name", required: true },
        { name: "price", label: "Price", required: true, type: "number" },
        { name: "durationMonths", label: "Duration (Months)", required: true, type: "number" },
        { name: "description", label: "Description", full: true },
        { name: "savings", label: "Savings Label" },
        { name: "features", label: "Features", type: "tags", full: true },
        { name: "status", label: "Status", type: "select", options: () => [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Plan is active", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
      ]}
      columns={[
        { key: "planId", label: "Plan ID" },
        { key: "name", label: "Name" },
        { key: "price", label: "Price", render: (row) => `Rs. ${row.price}` },
        { key: "durationMonths", label: "Duration", render: (row) => `${row.durationMonths} months` },
        { key: "status", label: "Status", render: (row) => row.status || (row.active ? "active" : "inactive") },
      ]}
    />
  );
}
