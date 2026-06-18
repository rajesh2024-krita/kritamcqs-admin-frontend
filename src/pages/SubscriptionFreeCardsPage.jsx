import { subscriptionFreeCardService } from "../api/subscriptionFreeCardService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function SubscriptionFreeCardsPage() {
  return (
    <EntityManagerPage
      title="Subscription Free Cards"
      description="Manage the free-user cards shown on the app subscription page."
      service={subscriptionFreeCardService}
      fields={[
        { name: "key", label: "Key", required: true },
        { name: "title", label: "Title", required: true },
        { name: "subtitle", label: "Subtitle", type: "textarea" },
        { name: "items", label: "Items", type: "tags", defaultValue: [] },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Show in app", defaultValue: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
      ]}
      columns={[
        { key: "sortOrder", label: "Order" },
        { key: "title", label: "Title" },
        { key: "subtitle", label: "Subtitle" },
        { key: "items", label: "Items", render: (row) => Array.isArray(row.items) ? row.items.join(", ") : "" },
        { key: "active", label: "Active", render: (row) => row.active ? "Yes" : "No" },
      ]}
    />
  );
}
