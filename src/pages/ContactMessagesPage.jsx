import { useEffect, useState } from "react";
import { contactService } from "../api/contactService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import {
  Mail,
  Inbox,
  Reply,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  MessageSquare,
  ArrowLeft,
  X,
  ChevronRight,
  Users,
  Calendar,
  AlertCircle,
  Check,
  FileText
} from "lucide-react";

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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[80px]";

  const unreadCount = items.filter(item => item.status === "unread").length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Mail size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Contact Messages</h1>
              <p className="text-xs text-slate-500">Website inquiries and email replies</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[8px] font-medium text-rose-700">
                {unreadCount} unread
              </span>
            )}
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || items.length} messages
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search messages..." />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Filter size={9} className="text-slate-400" />
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
              <select className={cn(compactInput, "w-28")} value={query.status} onChange={(event) => setQuery({ page: 1, status: event.target.value })}>
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => loadItems(query)}>
              <RefreshCw size={9} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading && <LoadingSpinner />}
      {!loading && !items.length && <EmptyState title="No contact messages" description="Website inquiries will appear here." />}

      {/* Messages Table */}
      {!loading && items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Sender", "Interest", "Message", "Status", "Received", "Actions"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      item.status === "unread" ? "bg-indigo-50/30" : ""
                    )}
                  >
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[7px] text-slate-400">{item.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">
                        {item.interest || "General"}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="text-[9px] text-slate-700 truncate max-w-[200px]">{item.message}</div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
                        item.status === "unread" 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      )}>
                        {item.status === "unread" ? (
                          <AlertCircle size={8} />
                        ) : (
                          <CheckCircle size={8} />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="text-[7px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[6px] text-slate-300">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <button className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={() => void openMessage(item)}>
                          <Reply size={11} />
                        </button>
                        <button className="p-0.5 text-slate-500 hover:bg-slate-50 rounded transition-colors" onClick={() => void toggleStatus(item)}>
                          {item.status === "unread" ? <Eye size={11} /> : <EyeOff size={11} />}
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
      )}

      {/* Message Detail Modal */}
      {selected && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-2xl shadow-slate-950/30 w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-200/60 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {selected.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{selected.name}</h3>
                  <p className="text-[10px] text-slate-500">{selected.email}</p>
                  <span className={cn(
                    "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium mt-0.5",
                    selected.status === "unread" 
                      ? "bg-rose-50 text-rose-700 border border-rose-200" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-180px)] space-y-3">
              {/* Original Message */}
              <div className="bg-slate-50 rounded-lg border border-slate-200/50 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">
                    {selected.interest || "General Inquiry"}
                  </span>
                  <span className="text-[6px] text-slate-400">
                    {new Date(selected.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-700 whitespace-pre-wrap">{selected.message}</p>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((item, index) => (
                <div key={`${item.createdAt}-${index}`} className="ml-6 bg-indigo-600 rounded-lg p-3 text-white">
                  <p className="text-[10px] whitespace-pre-wrap">{item.message}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[7px] text-indigo-200">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span className="text-indigo-300">·</span>
                    <span>Email {item.emailStatus}</span>
                    {item.emailError && (
                      <span className="text-rose-300">· {item.emailError}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="px-4 py-3 border-t border-slate-200/60">
              <textarea 
                className={compactTextarea} 
                rows={3} 
                value={reply} 
                onChange={(event) => setReply(event.target.value)} 
                placeholder="Type email reply..." 
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button 
                  className={cn(
                    "inline-flex items-center gap-0.5 px-3 py-0.5 text-[8px] font-medium rounded-lg transition-all",
                    "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/25",
                    (sending || !reply.trim()) && "opacity-50 cursor-not-allowed"
                  )} 
                  disabled={sending || !reply.trim()} 
                  onClick={() => void sendReply()}
                >
                  <Send size={9} /> {sending ? "Sending..." : "Send Reply"}
                </button>
                <button 
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded-lg transition-colors" 
                  onClick={() => void toggleStatus(selected)}
                >
                  {selected.status === "unread" ? <Eye size={9} /> : <EyeOff size={9} />}
                  Mark {selected.status === "unread" ? "Read" : "Unread"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}