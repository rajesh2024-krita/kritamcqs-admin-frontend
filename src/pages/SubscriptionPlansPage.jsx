import { useMemo, useState } from "react";
import { subscriptionPlanService } from "../api/subscriptionPlanService";
import { EntityManagerPage } from "./common/EntityManagerPage";

const PLATFORM_CONFIGS = {
  ios: {
    label: "iOS",
    title: "iOS Subscription Plans",
    description: "Manage plans available only in the iOS app. Purchases use the mapped App Store Product ID.",
    planIdLabel: "Internal iOS Plan ID",
    billingLabel: "App Store Product ID",
  },
  android: {
    label: "Android",
    title: "Android Subscription Plans",
    description: "Manage plans available only in the Android app. The Plan ID is used for Razorpay orders and verification.",
    planIdLabel: "Android / Razorpay Plan ID",
  },
};

const PLATFORM_TABS = Object.entries(PLATFORM_CONFIGS).map(([value, config]) => ({
  value,
  label: config.label,
}));

function detectDefaultPlatform() {
  if (typeof navigator === "undefined") return "android";
  const isiPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || isiPadOs ? "ios" : "android";
}

export function SubscriptionPlansPage() {
  const [platform, setPlatform] = useState(detectDefaultPlatform);
  const platformConfig = PLATFORM_CONFIGS[platform];
  const scopedService = useMemo(
    () => ({
      ...subscriptionPlanService,
      list: (params = {}) => subscriptionPlanService.list({ ...params, platform }),
      getById: (id) => subscriptionPlanService.getById(id, { platform }),
      create: (payload) => subscriptionPlanService.create({ ...payload, platform }),
      update: (id, payload) => subscriptionPlanService.update(id, { ...payload, platform }),
      remove: (id) => subscriptionPlanService.remove(id, { platform }),
      removeMany: (ids) => subscriptionPlanService.removeMany(ids, { platform }),
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
        title={platformConfig.title}
        description={platformConfig.description}
        service={scopedService}
        defaultQuery={{ platform }}
        mapItemToForm={(item, formState) => ({
          ...formState,
          strikeOutAmount: item.strikeOutAmount ?? item.stikeOutAmount ?? item.strikeoutAmount ?? item.originalPrice ?? item.mrp ?? 0,
        })}
        fields={[
          { name: "planId", label: platformConfig.planIdLabel, required: true },
          ...(platform === "ios"
            ? [{
                name: "billingProductId",
                label: platformConfig.billingLabel,
                required: true,
                placeholder: "app.kritamcqs.iosapp.premium.6months",
              }]
            : []),
          { name: "name", label: "Plan Name", required: true },
          { name: "price", label: "Price", required: true, type: "number" },
          { name: "strikeOutAmount", label: "Strike Out Amount", type: "number", defaultValue: 0 },
          { name: "durationMonths", label: "Duration (Months)", required: true, type: "number" },
          { name: "description", label: "Description", full: true },
          { name: "savings", label: "Savings Label" },
          { name: "features", label: "Features", type: "tags", full: true },
          {
            name: "status",
            label: "Availability",
            type: "select",
            required: true,
            defaultValue: "active",
            options: () => [
              { label: "Enabled", value: "active" },
              { label: "Disabled", value: "inactive" },
            ],
          },
          { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 1 },
        ]}
        columns={[
          {
            key: "platform",
            label: "Platform",
            render: () => (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                platform === "ios"
                  ? "bg-slate-900 text-white"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {platformConfig.label}
              </span>
            ),
          },
          { key: "planId", label: platformConfig.planIdLabel },
          ...(platform === "ios" ? [{ key: "billingProductId", label: "App Store Product ID" }] : []),
          { key: "name", label: "Name" },
          { key: "price", label: "Price", render: (row) => `Rs. ${row.price}` },
          { key: "strikeOutAmount", label: "Strike Out", render: (row) => {
            const value = row.strikeOutAmount ?? row.stikeOutAmount ?? row.strikeoutAmount ?? row.originalPrice ?? row.mrp ?? 0;
            return Number(value || 0) > 0 ? `Rs. ${value}` : "-";
          } },
          { key: "durationMonths", label: "Duration", render: (row) => `${row.durationMonths} months` },
          {
            key: "status",
            label: "Availability",
            render: (row) => {
              const enabled = (row.status || (row.active ? "active" : "inactive")) === "active";
              return (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  enabled ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                }`}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              );
            },
          },
        ]}
      />
    </div>
  );
}
