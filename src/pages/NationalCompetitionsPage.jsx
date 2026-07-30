import { useEffect, useMemo, useState } from "react";
import { Award, Bell, CalendarDays, Download, FileText, RefreshCw, Search, Settings, ShieldCheck, Trophy, Users } from "lucide-react";
import { nationalCompetitionService } from "../api/nationalCompetitionService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const tabs = [
  { key: "overview", label: "Dashboard", icon: Trophy },
  { key: "setup", label: "Competition", icon: Settings },
  { key: "participants", label: "Participants", icon: Users },
  { key: "leaderboard", label: "Leaderboard", icon: ShieldCheck },
  { key: "rewards", label: "Rewards", icon: Award },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "audit", label: "Audit", icon: CalendarDays },
];

const defaultForm = {
  title: "",
  description: "",
  examType: "BOTH",
  status: "draft",
  registrationOpensAt: "",
  registrationClosesAt: "",
  startsAt: "",
  endsAt: "",
  durationMinutes: 180,
  totalQuestions: 180,
  marksPerQuestion: 4,
  negativeMarks: 1,
  questionIds: "",
  rules: "Use one device only\nDo not leave the test screen\nFinal ranking follows configured tie-break rules",
  rewardsSummary: "",
  terms: "",
  eligibility: { premiumRequired: false, approvalRequired: false, participantLimit: 0, allowedStates: "", allowedDistricts: "" },
  leaderboard: {
    enabled: true,
    refreshSeconds: 30,
    rankingPriority: "marks,negativeMarks,totalTime,averageTimePerQuestion,accuracy,submissionTime,attendance",
    publishWeekly: true,
    publishMonthly: true,
  },
  security: { oneAttemptOnly: true, deviceValidation: true, duplicateLoginDetection: true, autosaveIntervalSeconds: 20 },
};

function toLocalInput(date) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromForm(form) {
  return {
    ...form,
    questionIds: String(form.questionIds || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
    rules: String(form.rules || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    eligibility: {
      ...form.eligibility,
      participantLimit: Number(form.eligibility.participantLimit || 0),
      allowedStates: String(form.eligibility.allowedStates || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      allowedDistricts: String(form.eligibility.allowedDistricts || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
    },
    leaderboard: {
      ...form.leaderboard,
      rankingPriority: String(form.leaderboard.rankingPriority || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      refreshSeconds: Number(form.leaderboard.refreshSeconds || 30),
    },
    security: { ...form.security, autosaveIntervalSeconds: Number(form.security.autosaveIntervalSeconds || 20) },
  };
}

function toForm(item) {
  if (!item) return defaultForm;
  return {
    ...defaultForm,
    ...item,
    registrationOpensAt: toLocalInput(item.registrationOpensAt),
    registrationClosesAt: toLocalInput(item.registrationClosesAt),
    startsAt: toLocalInput(item.startsAt),
    endsAt: toLocalInput(item.endsAt),
    questionIds: (item.questionIds || []).join("\n"),
    rules: (item.rules || []).join("\n"),
    eligibility: {
      ...defaultForm.eligibility,
      ...(item.eligibility || {}),
      allowedStates: (item.eligibility?.allowedStates || []).join(", "),
      allowedDistricts: (item.eligibility?.allowedDistricts || []).join(", "),
    },
    leaderboard: {
      ...defaultForm.leaderboard,
      ...(item.leaderboard || {}),
      rankingPriority: (item.leaderboard?.rankingPriority || []).join(", "),
    },
    security: { ...defaultForm.security, ...(item.security || {}) },
  };
}

function Field({ label, children, wide }) {
  return <label className={cn(ui.field, wide && "md:col-span-2")}>{label}{children}</label>;
}

function Metric({ label, value }) {
  return (
    <div className={ui.metricCard}>
      <div className={ui.metricLabel}>{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function DataTable({ rows, columns }) {
  if (!rows?.length) return <EmptyState title="No data" description="Records will appear here as the competition runs." />;
  return (
    <div className={ui.tableWrap}>
      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead><tr>{columns.map((column) => <th key={column} className={ui.tableHead}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column} className={ui.tableCell}>{String(row[column] ?? "")}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function PanelList({ action, onAction, rows, columns }) {
  return <div className="space-y-4"><button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={onAction}>{action}</button><DataTable rows={rows} columns={columns} /></div>;
}

function Reports({ reports }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Registrations" value={reports?.participation?.registrations || 0} />
        <Metric label="Submitted" value={reports?.participation?.submitted || 0} />
        <Metric label="Average Marks" value={reports?.averageMarks || 0} />
      </div>
      <DataTable rows={reports?.statePerformance || []} columns={["_id", "averageMarks", "participants"]} />
      <DataTable rows={reports?.topPerformers || []} columns={["rank", "userName", "score", "state", "district"]} />
    </div>
  );
}

export function NationalCompetitionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reports, setReports] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState("");
  const selected = useMemo(() => detail?.competition || items.find((item) => item.id === selectedId), [detail, items, selectedId]);

  async function loadBase() {
    setLoading(true);
    try {
      const [dashboardResponse, listResponse] = await Promise.all([
        nationalCompetitionService.dashboard(),
        nationalCompetitionService.list({ search }),
      ]);
      const nextItems = listResponse.data || [];
      setDashboard(dashboardResponse.data);
      setItems(nextItems);
      if (!selectedId && nextItems[0]) setSelectedId(nextItems[0].id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id = selectedId) {
    if (!id) return;
    try {
      const [detailResponse, participantsResponse, leaderboardResponse, reportsResponse, rewardsResponse, notificationsResponse, auditResponse] = await Promise.all([
        nationalCompetitionService.get(id),
        nationalCompetitionService.participants(id),
        nationalCompetitionService.leaderboard(id),
        nationalCompetitionService.reports(id),
        nationalCompetitionService.rewards(id),
        nationalCompetitionService.notifications(id),
        nationalCompetitionService.auditLogs({ competitionId: id }),
      ]);
      setDetail(detailResponse.data);
      setForm(toForm(detailResponse.data.competition));
      setParticipants(participantsResponse.data || []);
      setLeaderboard(leaderboardResponse.data || []);
      setReports(reportsResponse.data || null);
      setRewards(rewardsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setAuditLogs(auditResponse.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    void loadDetail(selectedId);
  }, [selectedId]);

  async function saveCompetition(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = fromForm(form);
      const response = selected?.id ? await nationalCompetitionService.update(selected.id, payload) : await nationalCompetitionService.create(payload);
      toast.success("Competition saved");
      setSelectedId(response.data.id);
      await loadBase();
      await loadDetail(response.data.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshLeaderboard() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.refreshLeaderboard(selectedId);
      toast.success("Leaderboard refreshed");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createReward() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.createReward(selectedId, { title: "Top Rank Voucher", rewardType: "voucher", rankFrom: rewards.length + 1, rankTo: rewards.length + 1, value: 0, approvalStatus: "draft" });
      toast.success("Reward added");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createNotification() {
    if (!selectedId) return;
    try {
      await nationalCompetitionService.createNotification(selectedId, { title: "Competition Update", message: "A national competition update is available.", eventKey: "manual_update", channel: "in_app", audience: "registered", status: "draft" });
      toast.success("Notification draft added");
      await loadDetail(selectedId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <LoadingSpinner label="Loading national competition workspace..." />;

  return (
    <div className="space-y-6">
      <section className={ui.panel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className={ui.eyebrow}>National Leaderboard Mock Tests</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Competition control center</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={cn(ui.input, "pl-9")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitions" />
            </div>
            <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadBase}><RefreshCw size={16} />Refresh</button>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => { setSelectedId(""); setDetail(null); setForm(defaultForm); setTab("setup"); }}>New competition</button>
          </div>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} className={cn(ui.buttonBase, tab === key ? ui.buttonPrimary : ui.buttonGhost, "shrink-0")} onClick={() => setTab(key)}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className={ui.panel}>
          <div className="mb-3 text-sm font-black text-slate-950">Competitions</div>
          <div className="space-y-2">
            {items.length ? items.map((item) => (
              <button key={item.id} className={cn("w-full rounded-lg border p-3 text-left transition", selectedId === item.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-200")} onClick={() => setSelectedId(item.id)}>
                <div className="font-bold text-slate-950">{item.title}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500"><span>{item.status}</span><span>{item.examType}</span></div>
              </button>
            )) : <EmptyState title="No competitions" description="Create the first national leaderboard competition." />}
          </div>
        </aside>

        <main className="min-w-0">
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Metric label="Total" value={dashboard?.summary?.total || 0} />
                <Metric label="Live" value={dashboard?.summary?.live || 0} />
                <Metric label="Upcoming" value={dashboard?.summary?.upcoming || 0} />
                <Metric label="Registrations" value={dashboard?.summary?.registrations || 0} />
                <Metric label="Submissions" value={dashboard?.summary?.submissions || 0} />
                <Metric label="Top Entries" value={dashboard?.summary?.topRankedEntries || 0} />
              </div>
              <DataTable rows={dashboard?.recentLeaderboard || []} columns={["rank", "userName", "score", "state", "district"]} />
            </div>
          )}

          {tab === "setup" && (
            <form className={cn(ui.panel, "space-y-5")} onSubmit={saveCompetition}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title"><input className={ui.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Exam type"><select className={ui.input} value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}><option>BOTH</option><option>NEET</option><option>JEE</option></select></Field>
                <Field label="Registration opens"><input type="datetime-local" className={ui.input} value={form.registrationOpensAt} onChange={(e) => setForm({ ...form, registrationOpensAt: e.target.value })} /></Field>
                <Field label="Registration closes"><input type="datetime-local" className={ui.input} value={form.registrationClosesAt} onChange={(e) => setForm({ ...form, registrationClosesAt: e.target.value })} /></Field>
                <Field label="Starts"><input type="datetime-local" className={ui.input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
                <Field label="Ends"><input type="datetime-local" className={ui.input} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
                <Field label="Duration minutes"><input type="number" className={ui.input} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></Field>
                <Field label="Total questions"><input type="number" className={ui.input} value={form.totalQuestions} onChange={(e) => setForm({ ...form, totalQuestions: e.target.value })} /></Field>
                <Field label="Description" wide><textarea className={ui.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <Field label="Question IDs" wide><textarea className={ui.textarea} value={form.questionIds} onChange={(e) => setForm({ ...form, questionIds: e.target.value })} /></Field>
                <Field label="Rules" wide><textarea className={ui.textarea} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></Field>
                <Field label="Terms" wide><textarea className={ui.textarea} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {["premiumRequired", "approvalRequired"].map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-bold"><input type="checkbox" className={ui.checkbox} checked={Boolean(form.eligibility[key])} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, [key]: e.target.checked } })} />{key}</label>
                ))}
                <Field label="Participant limit"><input type="number" className={ui.input} value={form.eligibility.participantLimit} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, participantLimit: e.target.value } })} /></Field>
                <Field label="Allowed states"><input className={ui.input} value={form.eligibility.allowedStates} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedStates: e.target.value } })} /></Field>
                <Field label="Allowed districts"><input className={ui.input} value={form.eligibility.allowedDistricts} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, allowedDistricts: e.target.value } })} /></Field>
                <Field label="Ranking priority"><input className={ui.input} value={form.leaderboard.rankingPriority} onChange={(e) => setForm({ ...form, leaderboard: { ...form.leaderboard, rankingPriority: e.target.value } })} /></Field>
              </div>
              <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={saving}>{saving ? "Saving..." : "Save competition"}</button>
            </form>
          )}

          {tab === "participants" && <DataTable rows={participants.map((item) => ({ id: item.registration.id, name: item.user?.name || item.user?.email || "Learner", status: item.registration.status, state: item.registration.state, district: item.registration.district }))} columns={["name", "status", "state", "district"]} />}
          {tab === "leaderboard" && <div className="space-y-4"><div className="flex flex-wrap gap-2"><button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={refreshLeaderboard}><RefreshCw size={16} />Refresh ranking</button>{selectedId ? <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={nationalCompetitionService.exportUrl(selectedId, "excel")}><Download size={16} />Excel</a> : null}{selectedId ? <a className={cn(ui.buttonBase, ui.buttonSecondary)} href={nationalCompetitionService.exportUrl(selectedId, "pdf")}><Download size={16} />PDF</a> : null}</div><DataTable rows={leaderboard} columns={["rank", "userName", "score", "accuracy", "state", "district"]} /></div>}
          {tab === "rewards" && <PanelList action="Add reward" onAction={createReward} rows={rewards} columns={["title", "rewardType", "rankFrom", "rankTo", "approvalStatus"]} />}
          {tab === "reports" && <Reports reports={reports} />}
          {tab === "notifications" && <PanelList action="Add notification" onAction={createNotification} rows={notifications} columns={["title", "channel", "audience", "eventKey", "status"]} />}
          {tab === "audit" && <DataTable rows={auditLogs} columns={["action", "actorRole", "actorId", "createdAt"]} />}
        </main>
      </div>
    </div>
  );
}
