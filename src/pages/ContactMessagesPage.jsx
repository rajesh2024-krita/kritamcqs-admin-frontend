import { useEffect, useState } from "react";
import { contactService } from "../api/contactService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

export function ContactMessagesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, status: "all" });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const response = await contactService.list({ ...nextQuery, search });
      setItems(response.data || []);
      setMeta(response.meta || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems(query);
  }, [query.page, query.status]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextQuery = { ...query, page: 1 };
      setQuery(nextQuery);
      void loadItems(nextQuery);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  async function openMessage(message) {
    setSelected(message);
    if (message.status === "unread") {
      const response = await contactService.markRead(message.id);
      setSelected(response.data || message);
      await loadItems(query);
    }
  }

  async function toggleStatus(message) {
    try {
      const response = message.status === "unread"
        ? await contactService.markRead(message.id)
        : await contactService.markUnread(message.id);
      if (selected?.id === message.id) setSelected(response.data);
      await loadItems(query);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const response = await contactService.reply(selected.id, { message: reply.trim() });
      setSelected(response.data);
      setReply("");
      await loadItems(query);
      toast.success(response.message || "Reply sent");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Website Inbox</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Contact Messages</h2>
            <p className={ui.muted}>Review inquiries from the website and reply by email using configured SMTP settings.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select className={ui.input} value={query.status} onChange={(event) => setQuery({ page: 1, status: event.target.value })}>
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <SearchBar value={search} onChange={setSearch} placeholder="Search messages..." />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading contact messages..." /> : null}
      {!loading && !items.length ? <EmptyState title="No contact messages" description="Website inquiries will appear here." /> : null}

      {!loading && items.length ? (
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Sender</th>
                  <th className={ui.tableHead}>Interest</th>
                  <th className={ui.tableHead}>Message</th>
                  <th className={ui.tableHead}>Status</th>
                  <th className={ui.tableHead}>Received</th>
                  <th className={ui.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={item.status === "unread" ? "bg-sky-50" : ""}>
                    <td className={ui.tableCell}>
                      <div className="font-black text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className={ui.tableCell}>{item.interest || "-"}</td>
                    <td className={ui.tableCell}>
                      <div className="max-w-sm truncate text-sm text-slate-700">{item.message}</div>
                    </td>
                    <td className={ui.tableCell}>
                      <span className={item.status === "unread" ? "inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700" : ui.pill}>
                        {item.status}
                      </span>
                    </td>
                    <td className={ui.tableCell}>
                      <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                    </td>
                    <td className={ui.tableCell}>
                      <div className="flex flex-wrap gap-2">
                        <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void openMessage(item)}>
                          View / Reply
                        </button>
                        <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => void toggleStatus(item)}>
                          Mark {item.status === "unread" ? "Read" : "Unread"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="admin-modal flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-200 p-5">
              <div>
                <div className={ui.eyebrow}>{selected.status}</div>
                <h3 className="text-xl font-black text-slate-900">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-xl bg-slate-100 p-4 text-slate-900">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{selected.interest || "General inquiry"}</div>
                <p className="whitespace-pre-wrap text-sm font-semibold">{selected.message}</p>
                <p className="mt-3 text-xs text-slate-500">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              {(selected.replies || []).map((item, index) => (
                <div key={`${item.createdAt}-${index}`} className="ml-12 rounded-xl bg-slate-900 p-4 text-white">
                  <p className="whitespace-pre-wrap text-sm font-semibold">{item.message}</p>
                  <p className="mt-2 text-xs opacity-70">
                    {new Date(item.createdAt).toLocaleString()} · Email {item.emailStatus}
                  </p>
                  {item.emailError ? <p className="mt-2 text-xs text-rose-200">{item.emailError}</p> : null}
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-slate-200 p-5">
              <textarea className={cn(ui.input, "min-h-28")} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type email reply..." />
              <div className="mt-3 flex flex-wrap gap-3">
                <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={sending || !reply.trim()} onClick={() => void sendReply()}>
                  {sending ? "Sending..." : "Send Email Reply"}
                </button>
                <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => void toggleStatus(selected)}>
                  Mark {selected.status === "unread" ? "Read" : "Unread"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
