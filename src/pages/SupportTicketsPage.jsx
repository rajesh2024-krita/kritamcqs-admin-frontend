import { useEffect, useState } from "react";
import { supportService } from "../api/supportService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

export function SupportTicketsPage() {
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
      const response = await supportService.list({ ...nextQuery, search });
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
      setQuery((current) => ({ ...current, page: 1 }));
      void loadItems({ ...query, page: 1 });
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  async function openTicket(ticket) {
    setSelected(ticket);
    if (!ticket.isReadByAdmin) {
      const response = await supportService.markRead(ticket.id);
      setSelected(response.data || ticket);
      await loadItems(query);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const response = await supportService.reply(selected.id, {
        message: reply.trim(),
        sendEmail: true,
        sendNotification: true,
      });
      setSelected(response.data);
      setReply("");
      await loadItems(query);
      toast.success("Reply sent");
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
            <div className={ui.eyebrow}>Support Desk</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Help & Support Messages</h2>
            <p className={ui.muted}>Unread rows are highlighted. Replies notify the learner in-app and by email when SMTP is configured.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select className={ui.input} value={query.status} onChange={(event) => setQuery({ page: 1, status: event.target.value })}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
            <SearchBar value={search} onChange={setSearch} placeholder="Search tickets..." />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading support tickets..." /> : null}
      {!loading && !items.length ? <EmptyState title="No support tickets" description="Learner support messages will appear here." /> : null}

      {!loading && items.length ? (
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Ticket</th>
                  <th className={ui.tableHead}>Learner</th>
                  <th className={ui.tableHead}>Category</th>
                  <th className={ui.tableHead}>Last Message</th>
                  <th className={ui.tableHead}>Status</th>
                  <th className={ui.tableHead}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const last = item.messages?.[item.messages.length - 1];
                  return (
                    <tr key={item.id} className={!item.isReadByAdmin ? "bg-sky-50" : ""}>
                      <td className={ui.tableCell}>
                        <div className="font-black text-slate-900">{item.ticketId}</div>
                        <div className="text-xs text-slate-500">{new Date(item.updatedAt).toLocaleString()}</div>
                      </td>
                      <td className={ui.tableCell}>
                        <div className="font-semibold text-slate-900">{item.userName || "Learner"}</div>
                        <div className="text-xs text-slate-500">{item.userEmail || item.userMobile || item.userId}</div>
                      </td>
                      <td className={ui.tableCell}>{item.category}</td>
                      <td className={ui.tableCell}>
                        <div className="max-w-sm truncate text-sm text-slate-700">{last?.message || "-"}</div>
                      </td>
                      <td className={ui.tableCell}>
                        <span className={ui.pill}>{item.status}</span>
                      </td>
                      <td className={ui.tableCell}>
                        <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => void openTicket(item)}>
                          View / Reply
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <div className={ui.eyebrow}>{selected.ticketId}</div>
                <h3 className="text-xl font-black text-slate-900">{selected.category}</h3>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
              {(selected.messages || []).map((message, index) => (
                <div key={`${message.createdAt}-${index}`} className={cn("rounded-xl p-4", message.sender === "admin" ? "ml-12 bg-slate-900 text-white" : "mr-12 bg-slate-100 text-slate-900")}>
                  <p className="text-sm font-semibold">{message.message}</p>
                  {message.attachmentUrl ? (
                    <a className="mt-2 inline-block text-xs font-bold underline" href={message.attachmentUrl} target="_blank" rel="noreferrer">
                      View attachment
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs opacity-70">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-5">
              <textarea className={cn(ui.input, "min-h-28")} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type admin reply..." />
              <button className={cn(ui.buttonBase, ui.buttonPrimary, "mt-3")} disabled={sending || !reply.trim()} onClick={() => void sendReply()}>
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
