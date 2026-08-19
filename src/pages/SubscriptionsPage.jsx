import { useEffect, useMemo, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { userService } from "../api/userService";
import { ConfirmDeleteModal } from "../components/common/ConfirmDeleteModal";
import { EmptyState } from "../components/common/EmptyState";
import { PlusIcon, RefreshIcon, TrashIcon } from "../components/common/AdminIcons";
import { EntityFormWrapper } from "../components/forms/EntityFormWrapper";
import { Field } from "../components/forms/Field";
import { SelectDropdown } from "../components/forms/SelectDropdown";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { formatDate } from "../utils/format";
import {
  CreditCard,
  Users,
  Calendar,
  Clock,
  Crown,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Percent,
  TrendingUp,
  Zap,
  Layers,
  Smartphone,
  Apple,
  // Android
} from "lucide-react";

const defaultForm = {
  userId: "",
  planId: "",
  couponCode: "",
  startDate: "",
  endDate: "",
};

function toDateTimeLocal(value) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function SubscriptionsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [platform, setPlatform] = useState("android");
  const [meta, setMeta] = useState(null);
  const [plan, setPlan] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [pricing, setPricing] = useState({ baseAmount: 0, discountAmount: 0, finalAmount: 0, coupon: null });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [cancelItem, setCancelItem] = useState(null);

  const activeCount = useMemo(
    () =>
      meta?.activeTotal ??
      items.filter(
        (item) =>
          ["active", "manual", "completed"].includes(
            String(item.status || item.subscriptionStatus).toLowerCase(),
          ) &&
          (!(item.endDate || item.expiryDate) || new Date(item.endDate || item.expiryDate) > new Date()),
      ).length,
    [items, meta],
  );

  async function loadPage(nextQuery = query) {
    setLoading(true);
    try {
      const response =
        platform === "apple"
          ? await subscriptionService.listApple({ ...nextQuery, search })
          : await subscriptionService.list({ ...nextQuery, search });
      setItems(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const [plansResponse, usersResponse] = await Promise.all([
        subscriptionService.listPlans(platform === "apple" ? "ios" : "android"),
        userService.list({ limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      setPlan(plansResponse.data?.[0] || null);
      setUsers(usersResponse.data || []);
      if (plansResponse.data?.[0]) {
        const primaryPlan = plansResponse.data[0];
        setFormState((current) => ({ ...current, planId: primaryPlan.id }));
        setPricing({
          baseAmount: primaryPlan.price,
          discountAmount: 0,
          finalAmount: primaryPlan.price,
          coupon: null,
        });
      } else {
        setFormState((current) => ({ ...current, planId: "" }));
        setPricing({ baseAmount: 0, discountAmount: 0, finalAmount: 0, coupon: null });
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadPage(query);
  }, [query.page, platform]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadPage({ ...current, page: 1 });
        return current;
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPlan(null);
    loadLookups();
  }, [platform]);

  function openCreate() {
    setFormState({
      ...defaultForm,
      planId: plan?.id || "",
      startDate: toDateTimeLocal(new Date().toISOString()),
    });
    setPricing({
      baseAmount: plan?.price ?? 0,
      discountAmount: 0,
      finalAmount: plan?.price ?? 0,
      coupon: null,
    });
    setShowForm(true);
  }

  async function previewCoupon() {
    setPricingLoading(true);
    try {
      const response = await subscriptionService.previewCoupon({
        planId: formState.planId,
        couponCode: formState.couponCode,
      });
      setPricing(response.data);
      if (formState.couponCode && !response.data.coupon) {
        toast.info("Coupon removed");
      } else if (response.data.coupon) {
        toast.success(`Coupon ${response.data.coupon.code} applied`);
      }
    } catch (error) {
      setPricing({
        baseAmount: plan?.price ?? 0,
        discountAmount: 0,
        finalAmount: plan?.price ?? 0,
        coupon: null,
      });
      toast.error(error.message);
    } finally {
      setPricingLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const payload = {
        userId: formState.userId,
        planId: formState.planId,
        couponCode: formState.couponCode.trim(),
        startDate: formState.startDate ? new Date(formState.startDate).toISOString() : "",
        endDate: formState.endDate ? new Date(formState.endDate).toISOString() : "",
      };
      await subscriptionService.createManual(payload);
      toast.success("Manual subscription activated");
      setShowForm(false);
      await loadPage({ ...query, page: 1 });
      await loadLookups();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCancelSubscription() {
    try {
      if (platform === "apple") {
        await subscriptionService.cancelApple(cancelItem.id, { status: "cancelled" });
      } else {
        await subscriptionService.cancel(cancelItem.id, { status: "cancelled" });
      }
      toast.success("Subscription cancelled");
      setCancelItem(null);
      await loadPage(query);
      await loadLookups();
    } catch (error) {
      toast.error(error.message);
    }
  }

  const userOptions = users.map((item) => ({
    label: `${item.name || item.mobile}${item.email ? ` - ${item.email}` : ""}`,
    value: item.id,
  }));

  const planOptions = plan ? [{ label: `${plan.name} - Rs. ${plan.price}`, value: plan.id }] : [];

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <CreditCard size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Subscriptions</h1>
              <p className="text-xs text-slate-500">Review App Store and Razorpay subscription history</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total ?? items.length} records
            </span>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[9px] font-medium rounded-lg transition-all shadow-sm shadow-indigo-500/25" onClick={openCreate}>
              <Plus size={10} /> Manual
            </button>
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-1 shadow-sm inline-flex">
        {[
          { id: "android", label: "Android / Razorpay", icon: Smartphone },
          { id: "apple", label: "iOS / App Store", icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = platform === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium rounded-lg transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              onClick={() => {
                setItems([]);
                setMeta(null);
                setQuery((current) => ({ ...current, page: 1 }));
                setPlatform(tab.id);
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { label: "Base Plan Price", value: `Rs. ${plan?.price ?? 0}`, icon: DollarSign, color: "blue" },
          { label: "Active Plans", value: activeCount, icon: CheckCircle, color: "emerald" },
          { label: "Plan Duration", value: `${plan?.durationMonths ?? 0}m`, icon: Calendar, color: "purple" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            purple: "bg-purple-50 text-purple-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1 rounded ${colorClasses[stat.color]}`}>
                  <Icon size={12} className={colorClasses[stat.color]} />
                </div>
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={
                platform === "apple"
                  ? "Search by learner, product, transaction, or status..."
                  : "Search by learner, coupon, plan, order, payment ref, or status..."
              }
            />
          </div>
          <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[8px] font-medium rounded transition-colors" onClick={() => loadPage({ ...query, page: 1 })}>
            <RefreshCw size={9} /> Search
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Empty State */}
      {!loading && !items.length && (
        <EmptyState
          title="No subscriptions found"
          description={
            platform === "apple"
              ? "Verified App Store subscriptions will appear here."
              : "Successful Razorpay purchases will appear here."
          }
        />
      )}

      {/* Android Table */}
      {!loading && platform === "android" && items.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Learner", "Plan", "Coupon", "Base", "Discount", "Paid", "Status", "Start", "End", "Payment Ref", "Actions"].map(x => (
                      <th key={x} className="px-2.5 py-1.5 text-left">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2.5 py-1.5">
                        <div className="text-[10px] font-semibold text-slate-900">{item.user?.name || item.user?.mobile || item.userId}</div>
                        <div className="text-[8px] text-slate-500">{item.user?.email || item.user?.mobile || "—"}</div>
                      </td>
                      <td className="px-2.5 py-1.5 text-[9px] text-slate-600">{item.plan?.name || plan?.name || item.planId}</td>
                      <td className="px-2.5 py-1.5">
                        {item.couponCode ? (
                          <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">{item.couponCode}</span>
                        ) : "-"}
                      </td>
                      <td className="px-2.5 py-1.5 text-[9px] text-slate-600">₹{Number(item.baseAmount ?? item.plan?.price ?? plan?.price ?? 0)}</td>
                      <td className="px-2.5 py-1.5 text-[9px] text-slate-600">₹{Number(item.discountAmount ?? 0)}</td>
                      <td className="px-2.5 py-1.5 text-[9px] font-semibold text-slate-900">₹{Number(item.amount ?? 0)}</td>
                      <td className="px-2.5 py-1.5">
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                          item.status === "active" || item.status === "manual" ? "bg-emerald-50 text-emerald-700" :
                          item.status === "completed" ? "bg-blue-50 text-blue-700" :
                          item.status === "cancelled" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-[8px] text-slate-500">{formatDate(item.startDate || item.createdAt)}</td>
                      <td className="px-2.5 py-1.5 text-[8px] text-slate-500">{item.endDate ? formatDate(item.endDate) : "-"}</td>
                      <td className="px-2.5 py-1.5 text-[7px] text-slate-400 font-mono">{item.razorpayPaymentId || item.razorpayOrderId || "-"}</td>
                      <td className="px-2.5 py-1.5">
                        {["active", "manual", "completed"].includes(String(item.status).toLowerCase()) ? (
                          <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => setCancelItem(item)}>
                            <TrashIcon size={11} />
                          </button>
                        ) : (
                          <span className="text-[7px] text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      )}

      {/* Apple Table */}
      {!loading && platform === "apple" && items.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    {["Learner", "Product", "Status", "Auto-renew", "Purchase", "Expiry", "Actions"].map(x => (
                      <th key={x} className="px-2.5 py-1.5 text-left">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2.5 py-1.5">
                        <div className="text-[10px] font-semibold text-slate-900">{item.user?.name || item.user?.mobile || item.userId}</div>
                        <div className="text-[8px] text-slate-500">{item.user?.email || item.user?.mobile || "—"}</div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="text-[9px] font-semibold text-slate-900">{item.planName || item.planId || "iOS Subscription"}</div>
                        <div className="text-[7px] text-slate-400 font-mono">{item.productId}</div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                          item.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" :
                          item.subscriptionStatus === "failed" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {item.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5 text-[9px] text-slate-600">{item.autoRenewStatus ? "On" : "Off"}</td>
                      <td className="px-2.5 py-1.5 text-[8px] text-slate-500">{formatDate(item.purchaseDate)}</td>
                      <td className="px-2.5 py-1.5 text-[8px] text-slate-500">{formatDate(item.expiryDate)}</td>
                      <td className="px-2.5 py-1.5">
                        {["active", "failed", "cancelled"].includes(String(item.subscriptionStatus).toLowerCase()) &&
                        new Date(item.expiryDate) > new Date() ? (
                          <button className="p-0.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={() => setCancelItem(item)}>
                            <TrashIcon size={11} />
                          </button>
                        ) : (
                          <span className="text-[7px] text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <EntityFormWrapper
          title="Manual Subscription"
          subtitle="Grant the active database plan and optionally apply a coupon."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel="Activate Subscription"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label="Learner">
              <SelectDropdown
                value={formState.userId}
                onChange={(value) => setFormState((current) => ({ ...current, userId: value }))}
                options={userOptions}
                placeholder="Select learner"
              />
            </Field>
            <Field label="Plan">
              <SelectDropdown
                value={formState.planId}
                onChange={(value) => setFormState((current) => ({ ...current, planId: value }))}
                options={planOptions}
                placeholder="Select plan"
              />
            </Field>
            <Field label="Coupon Code">
              <div className="flex gap-1">
                <input className={compactInput} value={formState.couponCode} onChange={(event) => setFormState((current) => ({ ...current, couponCode: event.target.value.toUpperCase() }))} placeholder="Optional" />
                <button type="button" className="inline-flex items-center px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[9px] font-medium text-slate-700 rounded transition-colors disabled:opacity-50" onClick={previewCoupon} disabled={pricingLoading}>
                  {pricingLoading ? "..." : "Apply"}
                </button>
              </div>
            </Field>
            <Field label="Start Date">
              <input className={compactInput} type="datetime-local" value={formState.startDate} onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))} />
            </Field>
            <Field label="End Date Override" wide>
              <input className={compactInput} type="datetime-local" value={formState.endDate} onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))} />
            </Field>
          </div>

          {/* Price Preview */}
          <div className="mt-2 bg-slate-50 rounded-lg border border-slate-200/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold text-slate-900">Price Preview</h3>
              {pricing.coupon && <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[8px] font-medium text-indigo-700">{pricing.coupon.code}</span>}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="bg-white rounded border border-slate-200 p-1.5 text-center">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Base</span>
                <div className="text-xs font-bold text-slate-900">₹{pricing.baseAmount}</div>
              </div>
              <div className="bg-white rounded border border-slate-200 p-1.5 text-center">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Discount</span>
                <div className="text-xs font-bold text-slate-900">₹{pricing.discountAmount}</div>
              </div>
              <div className="bg-white rounded border border-slate-200 p-1.5 text-center">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Final</span>
                <div className="text-xs font-bold text-indigo-600">₹{pricing.finalAmount}</div>
              </div>
              <div className="bg-white rounded border border-slate-200 p-1.5 text-center">
                <span className="text-[6px] font-medium text-slate-500 uppercase tracking-wider">Coupon</span>
                <div className="text-[8px] font-semibold text-slate-700">{pricing.coupon ? `${pricing.coupon.type} (${pricing.coupon.value})` : "None"}</div>
              </div>
            </div>
          </div>
        </EntityFormWrapper>
      )}

      {/* Cancel Modal */}
      <ConfirmDeleteModal
        open={Boolean(cancelItem)}
        title={`Cancel ${platform === "apple" ? "iOS" : "Android"} subscription`}
        description={`This will end the selected ${platform === "apple" ? "iOS" : "Android"} subscription immediately and update the learner premium status.`}
        onCancel={() => setCancelItem(null)}
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}