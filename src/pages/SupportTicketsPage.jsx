import { useEffect, useState } from "react";
import { supportService } from "../api/supportService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import {
  HelpCircle,
  Ticket,
  MessageSquare,
  Reply,
  Send,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  X,
  ChevronRight,
  Users,
  Calendar,
  FileText,
  Tag,
  Briefcase,
  Mail,
  Phone,
  Star,
  Zap
} from "lucide-react";

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

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[80px]";

  const statusColors = {
    open: "bg-amber-50 text-amber-700 border border-amber-200",
    pending: "bg-blue-50 text-blue-700 border border-blue-200",
    closed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  const statusIcons = {
    open: Clock,
    pending: RefreshCw,
    closed: CheckCircle,
  };

  const getStatusBadge = (status) => {
    const Icon = statusIcons[status] || Clock;
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
        statusColors[status] || "bg-slate-100 text-slate-600 border border-slate-200"
      )}>
        <Icon size={8} />
        {status}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "payment": Briefcase,
      "technical": Zap,
      "general": HelpCircle,
      "subscription": Star,
      "mock_test": FileText,
    };
    const Icon = icons[category] || HelpCircle;
    return <Icon size={10} className="text-slate-400" />;
  };

  const unreadCount = items.filter(item => !item.isReadByAdmin).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Ticket size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Support Tickets</h1>
              <p className="text-xs text-slate-500">Learner help desk and support messages</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[8px] font-medium text-rose-700">
                {unreadCount} unread
              </span>
            )}
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {meta?.total || items.length} tickets
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search tickets..." />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Filter size={9} className="text-slate-400" />
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Status:</span>
              <select className={cn(compactSelect, "w-28")} value={query.status} onChange={(event) => setQuery({ page: 1, status: event.target.value })}>
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
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
      {!loading && !items.length && <EmptyState title="No support tickets" description="Learner support messages will appear here." />}

      {/* Tickets Table */}
      {!loading && items.length && (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Ticket", "Learner", "Category", "Last Message", "Status", "Actions"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const last = item.messages?.[item.messages.length - 1];
                  return (
                    <tr 
                      key={item.id} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors",
                        !item.isReadByAdmin ? "bg-indigo-50/30" : ""
                      )}
                    >
                      <td className="px-2.5 py-1.5">
                        <div className="text-[10px] font-semibold text-slate-900">{item.ticketId}</div>
                        <div className="text-[7px] text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {(item.userName || "L").slice(0, 1).toUpperCase()
                            }
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-slate-900">{item.userName || "Learner"}</div>
                            <div className="text-[7px] text-slate-400 truncate max-w-[100px]">
                              {item.userEmail || item.userMobile || item.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </span>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="text-[9px] text-slate-700 truncate max-w-[150px]">{last?.message || "-"}</div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-medium rounded-lg transition-colors shadow-sm shadow-indigo-500/25" onClick={() => void openTicket(item)}>
                          <Reply size={9} /> Reply
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
      )}

      {/* Ticket Detail Modal */}
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
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-indigo-600">{selected.ticketId}</span>
                  {getStatusBadge(selected.status)}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{selected.category}</h3>
                <p className="text-[10px] text-slate-500">
                  {selected.userName || "Learner"} · {selected.userEmail || selected.userMobile || selected.userId}
                </p>
              </div>
              <button className="p-1 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-200px)] space-y-2">
              {(selected.messages || []).map((message, index) => {
                const isAdmin = message.sender === "admin";
                return (
                  <div 
                    key={`${message.createdAt}-${index}`} 
                    className={cn(
                      "rounded-lg p-3 max-w-[85%]",
                      isAdmin 
                        ? "ml-auto bg-indigo-600 text-white" 
                        : "mr-auto bg-slate-100 text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[7px] font-medium uppercase tracking-wider">
                        {isAdmin ? "Admin" : selected.userName || "Learner"}
                      </span>
                      <span className="text-[6px] opacity-60">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] whitespace-pre-wrap">{message.message}</p>
                    {message.attachmentUrl && (
                      <a 
                        className="inline-flex items-center gap-0.5 mt-1.5 text-[8px] font-medium underline opacity-80 hover:opacity-100" 
                        href={message.attachmentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        <FileText size={9} /> View attachment
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply Form */}
            <div className="px-4 py-3 border-t border-slate-200/60">
              <textarea 
                className={compactTextarea} 
                rows={3} 
                value={reply} 
                onChange={(event) => setReply(event.target.value)} 
                placeholder="Type admin reply..." 
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
                <span className="text-[7px] text-slate-400 ml-1">Learner will be notified via email and in-app</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}