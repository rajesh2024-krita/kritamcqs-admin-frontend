import { subscriptionStatCardService } from "../api/subscriptionStatCardService";
import { EntityManagerPage } from "./common/EntityManagerPage";

const valueTypeOptions = () => [
  { label: "Number", value: "number" },
  { label: "Text", value: "text" },
];

const valueModeOptions = () => [
  { label: "Manual", value: "manual" },
  { label: "Live", value: "live" },
];

const liveSourceOptions = () => [
  { label: "All Users", value: "users" },
  { label: "Premium Users", value: "premiumUsers" },
  { label: "Subscriptions", value: "subscriptions" },
];

const iconOptions = () => [
  { label: "Users", value: "users" },
  { label: "Shield", value: "shield" },
  { label: "Zap", value: "zap" },
];

export function SubscriptionStatCardsPage() {
  return (
    <EntityManagerPage
      title="Subscription Stat Cards"
      description="Manage the small stat cards shown on the app subscription page."
      service={subscriptionStatCardService}
      fields={[
        { name: "key", label: "Key", required: true },
        { name: "label", label: "Label", required: true },
        { name: "valueType", label: "Value Type", type: "select", options: valueTypeOptions, defaultValue: "number" },
        { name: "valueMode", label: "Live / Manual", type: "select", options: valueModeOptions, defaultValue: "manual" },
        { name: "manualValue", label: "Manual Number", type: "number", defaultValue: 0, visible: (form) => form.valueType !== "text" },
        { name: "manualText", label: "Manual Text", visible: (form) => form.valueType === "text" },
        { name: "liveSource", label: "Live Source", type: "select", options: liveSourceOptions, defaultValue: "users", visible: (form) => form.valueType !== "text" && form.valueMode === "live" },
        { name: "suffix", label: "Suffix", defaultValue: "", visible: (form) => form.valueType !== "text" },
        { name: "iconKey", label: "Icon", type: "select", options: iconOptions, defaultValue: "users" },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Show in app", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
      ]}
      columns={[
        { key: "sortOrder", label: "Order" },
        { key: "label", label: "Label" },
        { key: "valueType", label: "Type" },
        { key: "valueMode", label: "Mode" },
        { key: "manualValue", label: "Manual Number" },
        { key: "manualText", label: "Manual Text" },
        { key: "active", label: "Active", render: (row) => row.active ? "Yes" : "No" },
      ]}
    />
  );
}
