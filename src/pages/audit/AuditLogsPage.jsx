import { useEffect, useState } from "react";
import { auditService } from "../../api/auditService";
import { SearchBar } from "../../components/tables/SearchBar";
import { cn, ui } from "../../ui";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function JsonCell({ value }) {
  if (!value) return <span className="text-slate-400">-</span>;
  return <pre className="max-h-32 max-w-md overflow-auto rounded-sm bg-slate-50 p-2 text-[11px] text-slate-700">{JSON.stringify(value, null, 2)}</pre>;
}

export function AuditLogsPage() {
  const [tab, setTab] = useState("activity");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function load() {
    const params = { limit: 100, search, dateFrom, dateTo };
    const response = tab === "activity"
      ? await auditService.questionActivity({ ...params, action })
      : await auditService.loginHistory({ ...params, loginStatus: status });
    setRows(response.data || []);
  }

  useEffect(() => {
    void load();
  }, [tab]);

  return (
    <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Security & Audit</div>
          <p className={ui.muted}>Review question activity and admin login history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, tab === "activity" ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => setTab("activity")}>Question Activity</button>
          <button className={cn(ui.buttonBase, tab === "logins" ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => setTab("logins")}>Login History</button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search employee or IP..." />
        {tab === "activity" ? (
          <select className={ui.input} value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">All actions</option><option value="create">Create</option><option value="edit">Edit</option><option value="delete">Delete</option>
          </select>
        ) : (
          <select className={ui.input} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option><option value="success">Success</option><option value="failed">Failed</option>
          </select>
        )}
        <input className={ui.input} type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <input className={ui.input} type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={load}>Apply Filters</button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-slate-200 bg-white">
        {tab === "activity" ? (
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Question ID</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Previous</th><th className="px-4 py-3">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => <tr key={row.id}><td className="px-4 py-3">{row.employeeName}<div className="text-xs text-slate-500">{row.employeeEmail}</div></td><td className="px-4 py-3">{row.action}</td><td className="px-4 py-3">{row.questionId || "-"}</td><td className="px-4 py-3">{formatDate(row.createdAt)}</td><td className="px-4 py-3"><JsonCell value={row.previousValue} /></td><td className="px-4 py-3"><JsonCell value={row.updatedValue} /></td></tr>)}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Logout</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => <tr key={row.id}><td className="px-4 py-3">{row.employeeName || "-"}<div className="text-xs text-slate-500">{row.employeeEmail}</div></td><td className="px-4 py-3">{row.role}</td><td className="px-4 py-3">{formatDate(row.loginTime)}</td><td className="px-4 py-3">{formatDate(row.logoutTime)}</td><td className="px-4 py-3">{row.ipAddress || "-"}</td><td className="px-4 py-3">{row.loginStatus}{row.failureReason ? `: ${row.failureReason}` : ""}</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
