import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../api/dashboardService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";
import { RefreshIcon } from "../components/common/AdminIcons";
import { formatDate } from "../utils/format";

const periodOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const modeOptions = [
  { value: "ALL", label: "All" },
  { value: "NEET", label: "NEET" },
  { value: "JEE", label: "JEE" },
  { value: "BOTH", label: "BOTH" },
];

function toPeriodMeta(period) {
  if (period === "day") return { title: "Today", subtitle: "Single day live view" };
  if (period === "week") return { title: "Last 7 Days", subtitle: "Weekly attendance pulse" };
  if (period === "month") return { title: "Last 30 Days", subtitle: "Monthly completion trend" };
  return { title: "Last 365 Days", subtitle: "Yearly engagement window" };
}

export function DailyTestAnalyticsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("week");
  const [modeKey, setModeKey] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true);
    try {
      const response = await dashboardService.getDailyTestAnalytics({
        period,
        modeKey,
        page: nextPage,
        limit: 10,
        search: nextSearch,
      });
      setData(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    setPage(1);
    setSearch("");
    setSearchInput("");
  }, [period, modeKey]);

  useEffect(() => {
    load(page, search);
  }, [page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
      load(1, searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const summary = data?.summaryByPeriod || {};
  const activeSummary = summary?.[period] || null;
  const periodMeta = toPeriodMeta(period);
  const historyMeta = data?.userHistory?.meta;
  const historyRows = data?.userHistory?.data || [];
  const trendRows = data?.trend || [];
  const predictionRanges = data?.predictionRanges || [];

  const summaryCards = useMemo(
    () => [
      { label: "Assigned Users", value: activeSummary?.assignedUsers ?? 0, hint: "Users assigned daily plan" },
      { label: "Attended Users", value: activeSummary?.attendedUsers ?? 0, hint: "Users who attempted daily test" },
      { label: "Assigned Qs", value: activeSummary?.assignedQuestions ?? 0, hint: "Total planned questions" },
      { label: "Completed Qs", value: activeSummary?.completedQuestions ?? 0, hint: "Total completed questions" },
      { label: "Attendance %", value: `${Number(activeSummary?.attendanceRate ?? 0).toFixed(2)}%`, hint: "Attended users / assigned users" },
      { label: "Completion %", value: `${Number(activeSummary?.completionRate ?? 0).toFixed(2)}%`, hint: "Completed / assigned questions" },
    ],
    [activeSummary],
  );

  if (loading && !data) return <LoadingSpinner label="Loading daily test analytics..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className=" flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Daily Test Intelligence</div>
            <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Daily Test Analytics</h1>
            <p className={ui.muted}>Track attendance by day/week/month/year and monitor user prediction ranges from daily test attempts.</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-full">
              <select className={ui.input} value={modeKey} onChange={(event) => setModeKey(event.target.value)}>
                {modeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <select className={ui.input} value={period} onChange={(event) => setPeriod(event.target.value)}>
                {periodOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => load(page, search)}>
                <RefreshIcon size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={ui.compactPanel}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{periodMeta.title}</h2>
            <p className={ui.muted}>{periodMeta.subtitle}</p>
          </div>
          <div className={ui.badge}>{modeKey} mode</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => (
            <div key={item.label} className={ui.tile}>
              <div className={ui.metricTop}>
                <span className={ui.metricLabel}>{item.label}</span>
                <span className={ui.metricDot} />
              </div>
              <div className="mt-2 text-3xl font-black text-slate-900">{item.value}</div>
              <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Prediction Ranges</h3>
              <p className={ui.muted}>User distribution inferred from average daily-test accuracy.</p>
            </div>
            <div className={ui.badge}>Ranges</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {predictionRanges.map((item) => (
              <div key={item.key} className={ui.tile}>
                <span className={ui.metricLabel}>{item.key}</span>
                <div className="mt-2 text-3xl font-black text-slate-900">{item.count}</div>
                <p className="mt-2 text-sm text-slate-500">users</p>
              </div>
            ))}
          </div>
        </div>

        <div className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Daily Trend</h3>
              <p className={ui.muted}>Assigned vs attended users and question completion per date.</p>
            </div>
            <div className={ui.badge}>{trendRows.length} days</div>
          </div>
          {!trendRows.length ? (
            <EmptyState title="No trend data" description="No daily assignments found for selected filters." />
          ) : (
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {trendRows.map((row) => (
                <div key={row.dateKey} className="rounded-sm border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <strong className="text-slate-900">{row.dateKey}</strong>
                    <span className="text-slate-500">{row.attendedUsers}/{row.assignedUsers} attended</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-slate-100">
                    <div className="h-full rounded-sm bg-blue-500" style={{ width: `${row.assignedUsers > 0 ? Math.min(100, (row.attendedUsers / row.assignedUsers) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Questions: {row.completedQuestions}/{row.assignedQuestions}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">User Daily Test History</h3>
            <p className={ui.muted}>How many times users attended daily tests and their predicted range from performance.</p>
          </div>
          <div className={ui.badge}>{historyMeta?.total ?? 0} users</div>
        </div>
        <div className="mb-4">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Search by user name, email, or mobile..." />
        </div>

        {!historyRows.length ? (
          <EmptyState title="No user history" description="No daily test attempts found for this filter window." />
        ) : (
          <>
            <div className={ui.tableWrap}>
              <div className={ui.tableScroll}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th className={ui.tableHead}>User</th>
                      <th className={ui.tableHead}>Attempts</th>
                      <th className={ui.tableHead}>Avg Accuracy</th>
                      <th className={ui.tableHead}>Avg Score</th>
                      <th className={ui.tableHead}>Best Score</th>
                      <th className={ui.tableHead}>Prediction</th>
                      <th className={ui.tableHead}>Latest Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((item) => (
                      <tr key={item.userId}>
                        <td className={ui.tableCell}>
                          <div className="font-semibold text-slate-900">{item.name || item.mobile || item.email || "-"}</div>
                          <div className="text-xs text-slate-500">{item.email || item.mobile || "-"}</div>
                        </td>
                        <td className={ui.tableCell}>{item.totalAttempts}</td>
                        <td className={ui.tableCell}>{Number(item.avgAccuracy || 0).toFixed(2)}%</td>
                        <td className={ui.tableCell}>{Number(item.avgScore || 0).toFixed(2)}</td>
                        <td className={ui.tableCell}>{Number(item.bestScore || 0).toFixed(2)}</td>
                        <td className={ui.tableCell}>
                          <span className={ui.pill}>{item.predictionRange}</span>
                        </td>
                        <td className={ui.tableCell}>{item.latestCompletedAt ? formatDate(item.latestCompletedAt) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination meta={historyMeta} onChange={(nextPage) => setPage(nextPage)} />
          </>
        )}
      </section>
    </div>
  );
}
