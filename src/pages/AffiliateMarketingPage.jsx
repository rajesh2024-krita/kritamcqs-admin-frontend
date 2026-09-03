import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Copy, Eye, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { affiliateMarketingService as api } from "../api/affiliateMarketingService";
import { useToast } from "../context/ToastContext";

const tabs = ["Dashboard", "Affiliates", "Journeys", "Purchases", "Notifications", "Milestones", "Settings"];
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleString() : "-";
const pick = (response) => response.data?.data ?? response.data;
const emptyPage = { items: [], total: 0, page: 1, limit: 25 };

export function AffiliateMarketingPage() {
  const toast = useToast();
  const [tab, setTab] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ affiliates: emptyPage, referrals: emptyPage, purchases: emptyPage, notifications: emptyPage, adminNotifications: emptyPage });
  const [filters, setFilters] = useState({ affiliates: { page: 1, limit: 25 }, activity: { page: 1, limit: 25 }, notifications: { page: 1, limit: 25 } });
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const affiliateItems = data.affiliates?.items || [];
  const activityFilters = useMemo(() => clean(filters.activity), [filters.activity]);
  const affiliateFilters = useMemo(() => clean(filters.affiliates), [filters.affiliates]);
  const notificationFilters = useMemo(() => clean(filters.notifications), [filters.notifications]);

  async function load() {
    setLoading(true);
    try {
      const [dashboard, affiliates, referrals, purchases, settings, notifications, adminNotifications] = await Promise.all([
        api.dashboard(activityFilters),
        api.affiliates(affiliateFilters),
        api.referrals(activityFilters),
        api.purchases(activityFilters),
        api.settings(),
        api.notifications(notificationFilters),
        api.adminNotifications({ page: 1, limit: 25 }),
      ]);
      setData({ dashboard: pick(dashboard), affiliates: pick(affiliates), referrals: pick(referrals), purchases: pick(purchases), settings: pick(settings), notifications: pick(notifications), adminNotifications: pick(adminNotifications) });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [affiliateFilters, activityFilters, notificationFilters]);

  async function openDetails(affiliate) {
    setSelectedLoading(true);
    setSelected(null);
    try {
      const response = await api.affiliate(affiliate.id);
      setSelected(pick(response));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSelectedLoading(false);
    }
  }

  async function saveAffiliate(event) {
    event.preventDefault();
    const values = clean(Object.fromEntries(new FormData(event.currentTarget)));
    try {
      if (modal?.mode === "edit") {
        await api.update(modal.affiliate.id, values);
        toast.success("Affiliate updated");
      } else {
        await api.create(values);
        toast.success("Affiliate created");
      }
      setModal(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function updateStatus(affiliate, status) {
    try {
      await api.update(affiliate.id, { status });
      toast.success(`Affiliate ${status.toLowerCase()}`);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteAffiliate(affiliate) {
    if (!window.confirm(`Delete ${affiliate.affiliateName}? Historical purchases/referrals are preserved.`)) return;
    try {
      await api.remove(affiliate.id, true);
      toast.success("Affiliate deleted");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function sendNotification(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.sendNotification(modal.affiliate.id, values);
      toast.success("Notification sent");
      setModal(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function updateCommission(purchase, commissionStatus) {
    try {
      await api.updateCommission(purchase.id, { commissionStatus });
      toast.success("Commission status updated");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function markMilestoneRead(notification) {
    try {
      await api.markAdminNotificationRead(notification.id);
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  const cards = data.dashboard || {};
  const referrals = data.referrals?.items || [];
  const purchases = data.purchases?.items || [];
  const notifications = data.notifications?.items || [];
  const milestones = data.adminNotifications?.items || [];

  return (
    <div className="space-y-5">
      <Header unread={data.adminNotifications?.unread || cards.unreadAdminNotifications || 0} onCreate={() => setModal({ mode: "create" })} />
      <Tabs active={tab} onChange={setTab} />

      {loading && <div className="rounded-2xl border bg-white p-5 text-sm font-bold text-slate-500">Loading affiliate data...</div>}

      {tab === "Dashboard" && <Dashboard cards={cards} />}
      {tab === "Affiliates" && (
        <AffiliatesTab
          affiliates={affiliateItems}
          filters={filters.affiliates}
          page={data.affiliates}
          onCopy={(link) => { navigator.clipboard.writeText(link || ""); toast.success("Referral link copied"); }}
          onDelete={deleteAffiliate}
          onDetails={openDetails}
          onEdit={(affiliate) => setModal({ mode: "edit", affiliate })}
          onFilter={(next) => setFilters((current) => ({ ...current, affiliates: next }))}
          onNotify={(affiliate) => setModal({ mode: "notify", affiliate })}
          onStatus={updateStatus}
        />
      )}
      {tab === "Journeys" && <ActivityTab affiliates={affiliateItems} filters={filters.activity} page={data.referrals} rows={referrals} type="referrals" onFilter={(next) => setFilters((current) => ({ ...current, activity: next }))} />}
      {tab === "Purchases" && <PurchasesTab affiliates={affiliateItems} filters={filters.activity} page={data.purchases} rows={purchases} onCommission={updateCommission} onFilter={(next) => setFilters((current) => ({ ...current, activity: next }))} />}
      {tab === "Notifications" && <NotificationsTab affiliates={affiliateItems} filters={filters.notifications} page={data.notifications} rows={notifications} onFilter={(next) => setFilters((current) => ({ ...current, notifications: next }))} />}
      {tab === "Milestones" && <MilestonesTab rows={milestones} onRead={markMilestoneRead} />}
      {tab === "Settings" && data.settings && <Settings settings={data.settings} onSave={async (values) => { await api.updateSettings(values); toast.success("Settings saved"); await load(); }} />}

      {(selected || selectedLoading) && <DetailsPanel data={selected} loading={selectedLoading} onClose={() => setSelected(null)} />}
      {modal?.mode !== "notify" && modal && <AffiliateModal affiliate={modal.affiliate} mode={modal.mode} onClose={() => setModal(null)} onSubmit={saveAffiliate} />}
      {modal?.mode === "notify" && <NotificationModal affiliate={modal.affiliate} onClose={() => setModal(null)} onSubmit={sendNotification} />}
    </div>
  );
}

function Header({ unread, onCreate }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black text-slate-950">Affiliate User Management</h1><p className="text-sm text-slate-500">Create affiliates, monitor referral revenue, manage commissions, and send affiliate notifications.</p></div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700"><Bell size={16}/>{unread} milestones</span><button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16}/>New Affiliate</button></div></div>;
}

function Tabs({ active, onChange }) {
  return <div className="flex gap-2 overflow-x-auto border-b">{tabs.map((item) => <button key={item} onClick={() => onChange(item)} className={`whitespace-nowrap px-3 py-3 text-sm font-bold ${active === item ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}>{item}</button>)}</div>;
}

function Dashboard({ cards }) {
  const values = [["Total Affiliates", cards.totalAffiliates], ["Active Affiliates", cards.activeAffiliates], ["Total Clicks", cards.totalClicks], ["New Users", cards.newUsers], ["Existing Users", cards.existingUsers], ["Successful Purchases", cards.successfulPurchases], ["Purchase Amount", money(cards.totalPurchaseAmount)], ["Commission Earned", money(cards.commissionEarned)], ["Pending Commission", money(cards.pendingCommission)], ["Paid Commission", money(cards.paidCommission)], ["Conversion Rate", `${Number(cards.conversionRate || 0).toFixed(1)}%`], ["Milestone Alerts", cards.unreadAdminNotifications]];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{values.map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-2xl font-black text-slate-950">{value ?? 0}</p><p className="text-sm font-semibold text-slate-500">{label}</p></div>)}</div>;
}

function AffiliatesTab({ affiliates, filters, page, onCopy, onDelete, onDetails, onEdit, onFilter, onNotify, onStatus }) {
  return <div className="space-y-4"><SearchFilters filters={filters} onFilter={onFilter} fields={["search", "status"]} /><Table headers={["Affiliate", "Code", "Contact", "Status", "Purchases", "Amount", "Commission", "Pending", "Actions"]} rows={affiliates.map((item) => [<button onClick={() => onDetails(item)} className="text-left font-black text-indigo-700">{item.affiliateName}</button>, item.affiliateCode, <span>{item.email}<br/>{item.mobile || "-"}</span>, <select value={item.status} onChange={(event) => onStatus(item, event.target.value)} className="rounded-lg border px-2 py-1 text-xs font-bold"><option>ACTIVE</option><option>INACTIVE</option><option>SUSPENDED</option></select>, item.successfulPurchases, money(item.totalPurchaseAmount), money(item.commissionEarned), money(item.pendingCommission), <div className="flex flex-wrap gap-1"><IconAction title="View" onClick={() => onDetails(item)} icon={Eye} /><IconAction title="Edit" onClick={() => onEdit(item)} icon={Pencil} /><IconAction title="Copy link" onClick={() => onCopy(item.referralLink)} icon={Copy} /><IconAction title="Notify" onClick={() => onNotify(item)} icon={Send} /><IconAction title="Delete" onClick={() => onDelete(item)} icon={Trash2} danger /></div>])} /><Pagination page={page} onPage={(next) => onFilter({ ...filters, page: next })} /></div>;
}

function ActivityTab({ affiliates, filters, page, rows, onFilter }) {
  return <div className="space-y-4"><SearchFilters affiliates={affiliates} filters={filters} onFilter={onFilter} fields={["date", "affiliate", "campaign", "platform", "userType", "conversionStatus"]} /><Table headers={["Affiliate", "Click ID", "Campaign", "Type", "Install", "Registration", "Purchase", "Clicked", "Conversion", "Commission"]} rows={rows.map((item) => [item.affiliateId?.affiliateName, item.referralClickId, item.campaign || "-", userType(item), item.installationStatus, item.registrationStatus, item.purchaseStatus, date(item.clickAt), item.conversionStatus, money(item.commissionAmount)])} /><Pagination page={page} onPage={(next) => onFilter({ ...filters, page: next })} /></div>;
}

function PurchasesTab({ affiliates, filters, page, rows, onCommission, onFilter }) {
  return <div className="space-y-4"><SearchFilters affiliates={affiliates} filters={filters} onFilter={onFilter} fields={["date", "affiliate", "platform", "conversionStatus"]} /><Table headers={["Affiliate", "User", "Platform", "Plan", "Amount", "Commission", "Commission Status", "Transaction", "Date", "Status"]} rows={rows.map((item) => [item.affiliateId?.affiliateName, item.userId, item.platform, item.planId, money(item.amount), money(item.commissionAmount), <select value={item.commissionStatus || "PENDING"} onChange={(event) => onCommission(item, event.target.value)} className="rounded-lg border px-2 py-1 text-xs font-bold"><option>PENDING</option><option>PAID</option></select>, item.transactionId, date(item.purchaseAt), item.conversionStatus || item.subscriptionStatus])} /><Pagination page={page} onPage={(next) => onFilter({ ...filters, page: next })} /></div>;
}

function NotificationsTab({ affiliates, filters, page, rows, onFilter }) {
  return <div className="space-y-4"><SearchFilters affiliates={affiliates} filters={filters} onFilter={onFilter} fields={["affiliate", "notificationStatus"]} /><Table headers={["Affiliate", "Title", "Message", "Delivery", "Read Status", "Sent"]} rows={rows.map((item) => [item.affiliateId?.affiliateName, item.title, item.message, item.appNotificationStatus, item.readAt ? "Read" : "Unread", date(item.createdAt)])} /><Pagination page={page} onPage={(next) => onFilter({ ...filters, page: next })} /></div>;
}

function MilestonesTab({ rows, onRead }) {
  return <Table headers={["Status", "Affiliate", "Threshold", "Purchases", "Message", "Created", "Action"]} rows={rows.map((item) => [item.status, item.affiliateId?.affiliateName || item.metadata?.affiliateName, item.threshold, item.purchaseCount, item.message, date(item.createdAt), item.status === "UNREAD" ? <button onClick={() => onRead(item)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Mark read</button> : <span className="font-bold text-emerald-600">Read</span>])} />;
}

function SearchFilters({ affiliates = [], fields, filters, onFilter }) {
  function submit(event) { event.preventDefault(); onFilter({ ...clean(Object.fromEntries(new FormData(event.currentTarget))), page: 1, limit: filters.limit || 25 }); }
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-6">{fields.includes("search") && <input name="search" defaultValue={filters.search || ""} placeholder="Search affiliate" className="rounded-lg border p-2 text-sm" />}{fields.includes("date") && <><input name="from" type="date" defaultValue={filters.from || ""} className="rounded-lg border p-2 text-sm" /><input name="to" type="date" defaultValue={filters.to || ""} className="rounded-lg border p-2 text-sm" /></>}{fields.includes("affiliate") && <select name="affiliateId" defaultValue={filters.affiliateId || ""} className="rounded-lg border p-2 text-sm"><option value="">All affiliates</option>{affiliates.map((item) => <option key={item.id} value={item.id}>{item.affiliateName}</option>)}</select>}{fields.includes("campaign") && <input name="campaign" defaultValue={filters.campaign || ""} placeholder="Campaign" className="rounded-lg border p-2 text-sm" />}{fields.includes("status") && <Select name="status" value={filters.status} options={["", "ACTIVE", "INACTIVE", "SUSPENDED"]} />}{fields.includes("platform") && <Select name="platform" value={filters.platform} options={["", "WEB", "ANDROID", "IOS"]} />}{fields.includes("userType") && <Select name="userType" value={filters.userType} options={["", "NEW_USER", "EXISTING_USER"]} />}{fields.includes("conversionStatus") && <Select name="conversionStatus" value={filters.conversionStatus} options={["", "SUCCESSFUL", "PENDING", "FAILED", "CANCELLED"]} />}{fields.includes("notificationStatus") && <Select name="status" value={filters.status} options={["", "READ", "UNREAD"]} />}<button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Search size={16}/>Apply</button></form>;
}

function Select({ name, options, value }) {
  return <select name={name} defaultValue={value || ""} className="rounded-lg border p-2 text-sm">{options.map((item) => <option key={item || "ALL"} value={item}>{item || "All"}</option>)}</select>;
}

function Settings({ settings, onSave }) {
  async function submit(event) { event.preventDefault(); await onSave(Object.fromEntries(new FormData(event.currentTarget))); }
  return <form className="grid max-w-2xl gap-4 rounded-2xl border bg-white p-6 shadow-sm" onSubmit={submit}><label className="text-sm font-bold">Referral base URL<input name="referralBaseUrl" defaultValue={settings.referralBaseUrl} className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm font-bold">Attribution window days<input name="attributionWindowDays" type="number" defaultValue={settings.attributionWindowDays} className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm font-bold">Commission rate percent<input name="commissionRatePercent" type="number" step="0.01" defaultValue={settings.commissionRatePercent} className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm font-bold">Successful subscription users per milestone cycle<input name="milestoneCount" type="number" min="1" defaultValue={settings.milestoneCount || 25} className="mt-1 w-full rounded-lg border p-2"/><span className="text-xs font-medium text-slate-500">Affiliate Panel reads this backend value for progress such as 10 / 25 users.</span></label><label className="text-sm font-bold">Purchase milestone alert thresholds<input name="milestoneThresholds" defaultValue={(settings.milestoneThresholds || [settings.milestoneCount || 25]).join(",")} className="mt-1 w-full rounded-lg border p-2"/><span className="text-xs font-medium text-slate-500">Comma separated admin alert thresholds, for example: 25,50,100</span></label><button className="w-fit rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">Save settings</button></form>;
}

function AffiliateModal({ affiliate = {}, mode, onClose, onSubmit }) {
  const editing = mode === "edit";
  const fields = [["firstName", "First name"], ["lastName", "Last name"], ["affiliateName", "Affiliate name"], ["email", "Email"], ["mobile", "Mobile"], ["username", "Username"], ["company", "Company"], ["profession", "Profession"], ["accountHolderName", "Account holder"], ["bankName", "Bank"], ["accountNumber", "Account number"], ["ifsc", "IFSC"], ["upiId", "UPI ID"], ["pan", "PAN"], ["gst", "GST"]];
  return <Modal title={editing ? "Edit affiliate" : "Create affiliate"} onClose={onClose}><form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">{fields.map(([name, label]) => <label key={name} className="text-sm font-bold">{label}<input name={name} defaultValue={name === "accountNumber" ? "" : affiliate[name] || ""} placeholder={name === "accountNumber" && editing ? "Enter only to update" : ""} required={!editing && ["affiliateName", "email", "username"].includes(name)} className="mt-1 w-full rounded-lg border p-2"/></label>)}{!editing && <label className="text-sm font-bold">Password<input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-lg border p-2"/></label>}<label className="text-sm font-bold">Status<Select name="status" value={affiliate.status || "ACTIVE"} options={["ACTIVE", "INACTIVE", "SUSPENDED"]} /></label><div className="col-span-full flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button className="rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white">{editing ? "Save" : "Create"}</button></div></form></Modal>;
}

function NotificationModal({ affiliate, onClose, onSubmit }) {
  return <Modal title={`Notify ${affiliate.affiliateName}`} onClose={onClose}><form onSubmit={onSubmit} className="grid gap-3"><label className="text-sm font-bold">Title<input name="title" required className="mt-1 w-full rounded-lg border p-2"/></label><label className="text-sm font-bold">Message<textarea name="message" required rows={5} className="mt-1 w-full rounded-lg border p-2"/></label><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white"><Send size={16}/>Send</button></div></form></Modal>;
}

function DetailsPanel({ data, loading, onClose }) {
  const item = data?.affiliate;
  return <div className="fixed inset-0 z-[100] flex justify-end bg-black/50"><aside className="h-full w-full max-w-4xl overflow-auto bg-white p-6 shadow-2xl"><div className="mb-4 flex justify-between gap-3"><h2 className="text-xl font-black">Affiliate Details</h2><button onClick={onClose} className="rounded-lg border px-3 py-1">Close</button></div>{loading || !item ? <p className="font-bold text-slate-500">Loading details...</p> : <div className="space-y-5"><div className="grid gap-4 md:grid-cols-4">{[["Name", item.affiliateName], ["Code", item.affiliateCode], ["Status", item.status], ["Commission", money(item.commissionEarned)], ["Purchases", item.successfulPurchases], ["Amount", money(item.totalPurchaseAmount)], ["Pending", money(item.pendingCommission)], ["Paid", money(item.paidCommission)]].map(([label, value]) => <div key={label} className="rounded-xl border bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="font-black">{value}</p></div>)}</div><Table headers={["Click", "Campaign", "Type", "Conversion", "Commission"]} rows={(data.referrals || []).map((row) => [row.referralClickId, row.campaign || "-", userType(row), row.conversionStatus, money(row.commissionAmount)])} /><Table headers={["Plan", "Amount", "Commission", "Status", "Date"]} rows={(data.purchases || []).map((row) => [row.planId, money(row.amount), money(row.commissionAmount), row.commissionStatus || "PENDING", date(row.purchaseAt)])} /><Table headers={["Title", "Delivery", "Read", "Sent"]} rows={(data.notifications || []).map((row) => [row.title, row.appNotificationStatus, row.readAt ? "Read" : "Unread", date(row.createdAt)])} /></div>}</aside></div>;
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"><section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button onClick={onClose} className="rounded-lg border px-3 py-1">Close</button></div>{children}</section></div>;
}

function Table({ headers, rows }) {
  return <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{headers.map((header) => <th key={header} className="px-3 py-3 text-left text-xs font-black uppercase text-slate-500">{header}</th>)}</tr></thead><tbody className="divide-y">{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-3 text-slate-700">{cell || "-"}</td>)}</tr>) : <tr><td className="px-3 py-6 text-center font-bold text-slate-500" colSpan={headers.length}>No records found.</td></tr>}</tbody></table></div>;
}

function Pagination({ page, onPage }) {
  const current = Number(page?.page || 1);
  const total = Number(page?.total || 0);
  const limit = Number(page?.limit || 25);
  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="flex items-center justify-between gap-3 text-sm text-slate-500"><span>{total} records</span><div className="flex gap-2"><button disabled={current <= 1} onClick={() => onPage(current - 1)} className="rounded-lg border px-3 py-1 font-bold">Prev</button><span className="px-2 py-1 font-bold">Page {current} of {pages}</span><button disabled={current >= pages} onClick={() => onPage(current + 1)} className="rounded-lg border px-3 py-1 font-bold">Next</button></div></div>;
}

function IconAction({ danger, icon: Icon, onClick, title }) {
  return <button title={title} onClick={onClick} className={`rounded-lg border p-2 ${danger ? "text-rose-600" : "text-slate-600"}`}><Icon size={15}/></button>;
}

function userType(item) {
  if (item.userType === "NEW_USER" || item.registrationStatus === "REGISTERED") return "New User";
  if (item.userType === "EXISTING_USER" || item.registrationStatus === "EXISTING_USER") return "Existing User";
  return "Unknown";
}

function clean(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ""));
}
