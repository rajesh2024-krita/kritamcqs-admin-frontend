import { useMemo, useState } from "react";
import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { EntityManagerPage } from "./common/EntityManagerPage";

const PLATFORM_TABS = [
  { label: "iOS", value: "ios" },
  { label: "Android", value: "android" },
];

function detectDefaultPlatform() {
  if (typeof navigator === "undefined") return "android";
  const isiPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || isiPadOs ? "ios" : "android";
}

export function SubscriptionPlansPage() {
  const [platform, setPlatform] = useState(detectDefaultPlatform);
  const scopedService = useMemo(
    () => ({
      ...subscriptionPlanService,
      list: (params = {}) => subscriptionPlanService.list({ ...params, platform }),
      create: (payload) => subscriptionPlanService.create({ ...payload, platform }),
      update: (id, payload) => subscriptionPlanService.update(id, { ...payload, platform }),
    }),
    [platform],
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
        role="tablist"
        aria-label="Subscription plan platform"
      >
        {PLATFORM_TABS.map((tab) => {
          const active = platform === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPlatform(tab.value)}
              className={`min-w-32 rounded-lg px-6 py-3 text-sm font-black transition ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <EntityManagerPage
        key={platform}
        title="Subscription Plans"
        description={`Configure plans shown only in the ${platform === "ios" ? "iOS" : "Android"} app.`}
        service={scopedService}
        defaultQuery={{ platform }}
        mapItemToForm={(item, formState) => ({
          ...formState,
          strikeOutAmount: item.strikeOutAmount ?? item.stikeOutAmount ?? item.strikeoutAmount ?? item.originalPrice ?? item.mrp ?? 0,
        })}
        fields={[
          { name: "planId", label: "Plan ID", required: true },
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
    </div>
  );
}
