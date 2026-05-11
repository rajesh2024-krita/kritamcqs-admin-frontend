import { couponService } from "../api/couponService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function CouponsPage() {
  return (
    <EntityManagerPage
      title="Coupons"
      description="Create and manage discount codes for the live subscription plan stored in the database."
      service={couponService}
      fields={[
        { name: "code", label: "Coupon Code", required: true },
        {
          name: "type",
          label: "Discount Type",
          required: true,
          type: "select",
          defaultValue: "amount",
          options: [
            { label: "Fixed Amount", value: "amount" },
            { label: "Percentage", value: "percent" },
          ],
        },
        { name: "value", label: "Value", required: true, type: "number" },
        { name: "active", label: "Active", type: "checkbox", checkboxStyle: "simple", toggleLabel: "Coupon is active", defaultValue: true },
        { name: "validFrom", label: "Valid From", type: "datetime-local" },
        { name: "validUntil", label: "Valid Until", type: "datetime-local" },
        { name: "usageLimit", label: "Usage Limit", type: "number" },
        { name: "usedCount", label: "Used Count", type: "number", disabled: true },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "type", label: "Type" },
        { key: "value", label: "Value" },
        { key: "active", label: "Active", render: (row) => (row.active ? "Yes" : "No") },
        { key: "usedCount", label: "Used" },
        { key: "usageLimit", label: "Limit", render: (row) => row.usageLimit ?? "-" },
        { key: "validUntil", label: "Valid Until", render: (row) => row.validUntil ? new Date(row.validUntil).toLocaleString() : "-" },
      ]}
    />
  );
}
