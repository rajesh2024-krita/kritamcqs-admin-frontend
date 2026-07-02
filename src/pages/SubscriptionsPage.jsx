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
      items.filter(
        (item) =>
          ["active", "manual", "completed"].includes(
            String(item.status || item.subscriptionStatus).toLowerCase(),
          ) &&
          (!(item.endDate || item.expiryDate) || new Date(item.endDate || item.expiryDate) > new Date()),
      ).length,
    [items],
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
        subscriptionService.listPlans(),
        userService.list({ limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      setPlan(plansResponse.data?.[0] || null);
      setUsers(usersResponse.data || []);
      if (plansResponse.data?.[0]) {
        const primaryPlan = plansResponse.data[0];
        setFormState((current) => ({ ...current, planId: current.planId || primaryPlan.id }));
        setPricing({
          baseAmount: primaryPlan.price,
          discountAmount: 0,
          finalAmount: primaryPlan.price,
          coupon: null,
        });
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
    loadLookups();
  }, []);

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
      await subscriptionService.cancel(cancelItem.id, { status: "cancelled" });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Revenue Operations</div>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Subscriptions</h1>
            <p className="text-slate-500">
              Review App Store and Razorpay subscription history in separate platform views.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">{meta?.total ?? items.length} records</div>
          </div>
        </div>
      </div>

      <div className="inline-flex w-fit rounded-sm border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { id: "android", label: "Android / Razorpay" },
          { id: "apple", label: "Apple / App Store" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "rounded-sm px-5 py-2.5 text-sm font-black transition",
              platform === tab.id
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100",
            )}
            onClick={() => {
              setItems([]);
              setMeta(null);
              setQuery((current) => ({ ...current, page: 1 }));
              setPlatform(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-200/50">
          <div className="mb-4 flex items-center justify-between gap-3"><span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Base Plan Price</span><span className="h-3 w-3 rounded-sm bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.16)]" /></div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Rs. {platform === "apple" ? 499 : plan?.price ?? 0}</h2>
        </div>
        <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-200/50">
          <div className="mb-4 flex items-center justify-between gap-3"><span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Active Plans</span><span className="h-3 w-3 rounded-sm bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.16)]" /></div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">{activeCount}</h2>
        </div>
        <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-200/50">
          <div className="mb-4 flex items-center justify-between gap-3"><span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Plan Duration</span><span className="h-3 w-3 rounded-sm bg-blue-400 shadow-[0_0_0_4px_rgba(96,165,250,0.16)]" /></div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">{platform === "apple" ? 6 : plan?.durationMonths ?? 0}m</h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={
            platform === "apple"
              ? "Search by learner, product, transaction, or status..."
              : "Search by learner, coupon, plan, order, payment ref, or status..."
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => loadPage({ ...query, page: 1 })}>
            <RefreshIcon size={16} />
            Search
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading subscriptions..." /> : null}
      {!loading && !items.length ? (
        <EmptyState
          title="No subscriptions found"
          description={
            platform === "apple"
              ? "Verified App Store subscriptions will appear here."
              : "Successful Razorpay purchases will appear here."
          }
        />
      ) : null}
      {!loading && platform === "android" && items.length ? (
        <>
          <div className="overflow-hidden rounded-sm border border-white/60 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Learner</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Plan</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Coupon</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Base</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Discount</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Paid</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Status</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Start</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">End</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Payment Ref</th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                        <strong className="block font-bold text-slate-900">{item.user?.name || item.user?.mobile || item.userId}</strong>
                        <div className="text-slate-500">{item.user?.email || item.user?.mobile || "User record unavailable"}</div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.plan?.name || plan?.name || item.planId}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.couponCode ? <span className={ui.pill}>{item.couponCode}</span> : "-"}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">Rs. {Number(item.baseAmount ?? item.plan?.price ?? plan?.price ?? 0)}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">Rs. {Number(item.discountAmount ?? 0)}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">Rs. {Number(item.amount ?? 0)}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700"><span className={ui.pill}>{item.status}</span></td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{formatDate(item.startDate || item.createdAt)}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.endDate ? formatDate(item.endDate) : "-"}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.razorpayPaymentId || item.razorpayOrderId || "-"}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                        {["active", "manual", "completed"].includes(String(item.status).toLowerCase()) ? (
                          <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setCancelItem(item)}>
                            <TrashIcon size={16} />
                            Cancel
                          </button>
                        ) : (
                          <span className="text-slate-500">Closed</span>
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
      ) : null}

      {!loading && platform === "apple" && items.length ? (
        <>
          <div className="overflow-hidden rounded-sm border border-white/60 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    {["Learner", "Product", "Status", "Auto-renew", "Purchase", "Expiry", "Latest transaction", "Original transaction", "Latest event", "Environment"].map((label) => (
                      <th key={label} className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                        <strong className="block font-bold text-slate-900">{item.user?.name || item.user?.mobile || item.userId}</strong>
                        <div className="text-slate-500">{item.user?.email || item.user?.mobile || "User record unavailable"}</div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                        <span className="block font-semibold">Premium Plan – 6 Months</span>
                        <span className="text-xs text-slate-500">{item.productId}</span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top"><span className={ui.pill}>{item.subscriptionStatus}</span></td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.autoRenewStatus ? "On" : "Off"}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{formatDate(item.purchaseDate)}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{formatDate(item.expiryDate)}</td>
                      <td className="max-w-48 break-all border-b border-slate-100 px-4 py-4 align-top text-xs text-slate-700">{item.transactionId}</td>
                      <td className="max-w-48 break-all border-b border-slate-100 px-4 py-4 align-top text-xs text-slate-700">{item.originalTransactionId}</td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                        {item.latestWebhookEvent?.type || "-"}
                        {item.latestWebhookEvent?.subtype ? <span className="block text-xs text-slate-500">{item.latestWebhookEvent.subtype}</span> : null}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">{item.environment || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title="Manual Subscription"
          subtitle="Grant the active database plan and optionally apply a coupon."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel="Activate Subscription"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className={ui.input}
                  value={formState.couponCode}
                  onChange={(event) => setFormState((current) => ({ ...current, couponCode: event.target.value.toUpperCase() }))}
                  placeholder="Optional coupon code"
                />
                <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={previewCoupon} disabled={pricingLoading}>
                  {pricingLoading ? "Checking..." : "Apply"}
                </button>
              </div>
            </Field>
            <Field label="Start Date">
              <input
                className={ui.input}
                type="datetime-local"
                value={formState.startDate}
                onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
              />
            </Field>
            <Field label="End Date Override (optional)" className={ui.fieldFull}>
              <input
                className={ui.input}
                type="datetime-local"
                value={formState.endDate}
                onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
              />
            </Field>
            <div className={cn(ui.fieldFull, "rounded-sm border border-white/60 bg-white/85 p-5 shadow-lg shadow-slate-200/50")}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Price Preview</h3>
                  <p className="text-slate-500">Server-validated pricing for the active database plan.</p>
                </div>
                {pricing.coupon ? <span className={ui.badge}>{pricing.coupon.code}</span> : null}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Base Price</span><strong className="mt-2 block text-lg font-bold text-slate-900">Rs. {pricing.baseAmount}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Discount</span><strong className="mt-2 block text-lg font-bold text-slate-900">Rs. {pricing.discountAmount}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Final Payable</span><strong className="mt-2 block text-lg font-bold text-slate-900">Rs. {pricing.finalAmount}</strong></div>
                <div className="rounded-sm border border-slate-200/80 bg-slate-50/80 p-4"><span className="text-slate-500">Coupon Type</span><strong className="mt-2 block text-lg font-bold text-slate-900">{pricing.coupon ? `${pricing.coupon.type} (${pricing.coupon.value})` : "No coupon"}</strong></div>
              </div>
            </div>
          </div>
        </EntityFormWrapper>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(cancelItem)}
        title="Cancel subscription"
        description="This will end the selected subscription immediately and update the learner premium status."
        onCancel={() => setCancelItem(null)}
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}
