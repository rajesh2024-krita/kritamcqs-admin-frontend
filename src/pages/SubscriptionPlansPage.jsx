import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function SubscriptionPlansPage() {
  const platformOptions = [
    { label: "Android", value: "android" },
    { label: "iOS", value: "ios" },
  ];

  return (
    <EntityManagerPage
      title="Subscription Plans"
      description="Configure separate subscription plans for the Android and iOS apps."
      service={subscriptionPlanService}
      mapItemToForm={(item, formState) => ({
        ...formState,
        platform: item.platform || "android",
        strikeOutAmount: item.strikeOutAmount ?? item.stikeOutAmount ?? item.strikeoutAmount ?? item.originalPrice ?? item.mrp ?? 0,
      })}
      filterStorageKey="admin.subscription-plans.filters"
      filters={[
        {
          name: "platform",
          label: "Platform",
          placeholder: "All Platforms",
          options: platformOptions,
        },
      ]}
      fields={[
        { name: "planId", label: "Plan ID", required: true },
        { name: "platform", label: "Platform", type: "select", required: true, defaultValue: "android", options: platformOptions },
        { name: "name", label: "Plan Name", required: true },
        { name: "price", label: "Price", required: true, type: "number" },
        { name: "strikeOutAmount", label: "Strike Out Amount", type: "number", defaultValue: 0 },
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
        { key: "platform", label: "Platform", render: (row) => row.platform === "ios" ? "iOS" : "Android" },
        { key: "name", label: "Name" },
        { key: "price", label: "Price", render: (row) => `Rs. ${row.price}` },
        { key: "strikeOutAmount", label: "Strike Out", render: (row) => {
          const value = row.strikeOutAmount ?? row.stikeOutAmount ?? row.strikeoutAmount ?? row.originalPrice ?? row.mrp ?? 0;
          return Number(value || 0) > 0 ? `Rs. ${value}` : "-";
        } },
        { key: "durationMonths", label: "Duration", render: (row) => `${row.durationMonths} months` },
        { key: "status", label: "Status", render: (row) => row.status || (row.active ? "active" : "inactive") },
      ]}
    />
  );
}
