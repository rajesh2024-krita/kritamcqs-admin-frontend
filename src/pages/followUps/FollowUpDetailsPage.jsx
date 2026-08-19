import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { followUpService } from "../../api/followUpService";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Crown,
  Briefcase,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  Send,
  Edit3,
  UserCheck,
  UserX,
  Activity,
  Zap,
  Layers,
  FileText,
  Save,
  X
} from "lucide-react";

const statuses = ["Pending", "Progress", "Completed", "Cancelled"];
const fmt = v => v ? new Date(v).toLocaleString() : "—";

const statusColors = {
  Pending: "bg-amber-50 border-amber-200 text-amber-700",
  Progress: "bg-blue-50 border-blue-200 text-blue-700",
  Completed: "bg-emerald-50 border-emerald-200 text-emerald-700",
  Cancelled: "bg-rose-50 border-rose-200 text-rose-700",
};

const statusIcons = {
  Pending: Clock,
  Progress: Activity,
  Completed: CheckCircle,
  Cancelled: UserX,
};

const conversationTypeIcons = {
  Call: PhoneIcon,
  Chat: MessageCircle,
  Email: MailIcon,
  Other: MoreHorizontal,
};

export function FollowUpDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({
    type: "Call",
    notes: "",
    occurredAt: new Date().toISOString().slice(0, 16),
    nextFollowUpAt: "",
    status: "Progress",
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItem((await followUpService.get(id)).data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const submit = async e => {
    e.preventDefault();
    setUpdating(true);
    try {
      await followUpService.addConversation(id, form);
      toast.success("Conversation added to timeline");
      setForm(f => ({ ...f, notes: "", nextFollowUpAt: "" }));
      await load();
    } catch (x) {
      toast.error(x.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await followUpService.updateStatus(id, newStatus);
      await load();
      toast.success(`Status updated to ${newStatus}`);
    } catch (x) {
      toast.error(x.message);
    }
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-[10px] text-slate-500">Loading follow-up...</span>
        </div>
      </div>
    );
  }

  const u = item.user || {};

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactTextarea = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y min-h-[60px]";

  const getStatusBadge = (status) => {
    const Icon = statusIcons[status] || AlertCircle;
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border",
        statusColors[status] || "bg-slate-50 border-slate-200 text-slate-600"
      )}>
        <Icon size={10} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Back Button */}
      <Link to="/follow-ups" className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
        <ArrowLeft size={12} /> Back to Follow-Ups
      </Link>

      {/* Header Section */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {(u.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{u.name || "Unnamed user"}</h2>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-0.5"><Mail size={10} /> {u.email || "—"}</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-0.5"><Phone size={10} /> {u.mobile || "—"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(item.status)}
            <select
              className={cn(compactSelect, "w-32")}
              value={item.status}
              onChange={async e => await handleStatusChange(e.target.value)}
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* User Details Grid */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Device", u.deviceName],
            ["Exam", u.examMode],
            ["Plan", u.isPremium ? "Premium" : "Free"],
            ["Created", fmt(u.createdAt)],
            ["Last Login", fmt(u.lastLoginAt)],
            ["Employee", item.assignedEmployee?.employeeName],
            ["Assigned", fmt(item.assignedAt)],
            ["Status", item.status],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-lg border border-slate-200/50 p-2">
              <div className="text-[7px] font-medium text-slate-500 uppercase tracking-wider">{k}</div>
              <div className="text-[10px] text-slate-900 mt-0.5 truncate">{v || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        {/* Timeline */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Conversation Timeline</h3>
            <span className="text-[8px] text-slate-400">({item.conversations?.length || 0})</span>
          </div>
          <div className="space-y-0 max-h-[500px] overflow-y-auto pr-1">
            {[...(item.conversations || [])]
              .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
              .map((c, i) => {
                const Icon = conversationTypeIcons[c.type] || MessageSquare;
                return (
                  <div className="relative border-l-2 border-indigo-200 pb-4 pl-5 last:pb-0" key={c.id || i}>
                    <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 bg-indigo-50 rounded">
                        <Icon size={10} className="text-indigo-600" />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-900">{fmt(c.occurredAt)}</span>
                      <span className="text-[8px] text-slate-400">·</span>
                      <span className="text-[8px] font-medium text-indigo-600">{c.type}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-700 whitespace-pre-wrap">{c.notes}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] text-slate-500">
                      <span>{c.handledBy?.employeeName || "—"}</span>
                      <span className="text-slate-300">·</span>
                      <span>{c.status}</span>
                      {c.nextFollowUpAt && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>Next: {fmt(c.nextFollowUpAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            {!item.conversations?.length && (
              <div className="flex flex-col items-center gap-1 py-4">
                <MessageSquare size={20} className="text-slate-300" />
                <p className="text-[10px] text-slate-500">No conversations yet.</p>
                <p className="text-[8px] text-slate-400">Add the first one to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-3">
            <Edit3 size={14} className="text-indigo-600" />
            <h3 className="text-xs font-semibold text-slate-900">Continue Follow-Up</h3>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Type</label>
              <select className={compactSelect} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {["Call", "Chat", "Email", "Other"].map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Occurred At</label>
              <input type="datetime-local" className={compactInput} value={form.occurredAt} onChange={e => setForm(f => ({ ...f, occurredAt: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Notes</label>
              <textarea className={compactTextarea} rows="3" required placeholder="Conversation notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Next Follow-Up</label>
              <input type="datetime-local" className={compactInput} value={form.nextFollowUpAt} onChange={e => setForm(f => ({ ...f, nextFollowUpAt: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
              <select className={compactSelect} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button
              className={cn(
                "w-full inline-flex items-center justify-center gap-1.5 px-3 py-1 text-[10px] font-medium text-white rounded-lg transition-all",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm shadow-indigo-500/25",
                updating && "opacity-50 cursor-not-allowed"
              )}
              type="submit"
              disabled={updating}
            >
              <Send size={12} />
              {updating ? "Adding..." : "Add Conversation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}