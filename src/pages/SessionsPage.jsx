import { useEffect, useState } from "react";
import { subscriptionService } from "../api/subscriptionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { ui } from "../ui";
import { formatDate } from "../utils/format";

export function SessionsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  async function load(nextQuery = query) {
    setLoading(true);
    try {
      const response = await subscriptionService.listSessions({ ...nextQuery, search });
      setItems(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(query);
  }, [query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => load({ ...query, page: 1 }), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.eyebrow}>Learning Activity</div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Sessions</h2>
        <p className={ui.muted}>Review practice, revision, smart test, daily set, and mock test sessions.</p>
      </section>
      <section className={ui.panel}><SearchBar value={search} onChange={setSearch} placeholder="Search sessions by title..." /></section>
      {loading ? <LoadingSpinner label="Loading sessions..." /> : null}
      {!loading ? (
        <section className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}>Title</th><th className={ui.tableHead}>User</th><th className={ui.tableHead}>Type</th><th className={ui.tableHead}>Origin</th><th className={ui.tableHead}>Questions</th><th className={ui.tableHead}>Created</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={ui.tableCell}><strong>{item.title}</strong></td>
                    <td className={ui.tableCell}>{item.user?.name || item.user?.mobile || item.userId}<div className="text-xs text-slate-500">{item.user?.email || ""}</div></td>
                    <td className={ui.tableCell}><span className={ui.pill}>{item.type}</span></td>
                    <td className={ui.tableCell}>{item.origin}</td>
                    <td className={ui.tableCell}>{item.questionIds?.length || 0}</td>
                    <td className={ui.tableCell}>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
    </div>
  );
}
