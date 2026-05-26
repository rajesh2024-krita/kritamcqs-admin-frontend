import { useEffect, useState } from "react";
import { insightsService } from "../api/insightsService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const blankCategory = { name: "", description: "", isActive: true };

export function WeakAreaManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [category, setCategory] = useState(blankCategory);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setData(await insightsService.getWeakAreas());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCategory(event) {
    event.preventDefault();
    try {
      if (editingId) await insightsService.updateWeakAreaCategory(editingId, category);
      else await insightsService.createWeakAreaCategory(category);
      setCategory(blankCategory);
      setEditingId(null);
      toast.success("Weak area category saved");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteCategory(id) {
    try {
      await insightsService.deleteWeakAreaCategory(id);
      toast.success("Weak area category removed");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading && !data) return <LoadingSpinner label="Loading weak area management..." />;

  const summary = data?.summary || {};
  const categories = data?.categories || [];

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.eyebrow}>Weak Area Intelligence</div>
        <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Weak Area Management</h1>
        <p className={ui.muted}>Monitor generated weak areas, topic trends, user analytics, and improvement movement.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Tracked Areas", summary.trackedAreas || 0],
          ["Active Weak Areas", summary.totalWeakAreas || 0],
          ["Users Affected", summary.usersAffected || 0],
          ["Mastered Areas", summary.masteredAreas || 0],
        ].map(([label, value]) => (
          <div key={label} className={ui.metricCard}>
            <div className={ui.metricLabel}>{label}</div>
            <div className={ui.metricValue}>{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className={ui.panel}>
          <h2 className="mb-4 text-xl font-black text-slate-900">Most Common Weak Topics</h2>
          <div className={ui.tableWrap}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    {["Topic", "Subject", "Users", "Wrong", "Avg Accuracy"].map((head) => <th key={head} className={ui.tableHead}>{head}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data?.commonWeakTopics || []).map((row) => (
                    <tr key={row.chapterId}>
                      <td className={ui.tableCell}>{row.chapterName}</td>
                      <td className={ui.tableCell}>{row.subjectName}</td>
                      <td className={ui.tableCell}>{row.affectedUsers}</td>
                      <td className={ui.tableCell}>{row.wrongCount}</td>
                      <td className={ui.tableCell}>{row.averageAccuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <form className={ui.panel} onSubmit={saveCategory}>
          <h2 className="mb-4 text-xl font-black text-slate-900">Weak Area Categories</h2>
          <label className={ui.field}>
            Category name
            <input className={ui.input} value={category.name} onChange={(event) => setCategory((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea className={ui.textarea} value={category.description} onChange={(event) => setCategory((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" className={ui.checkbox} checked={category.isActive} onChange={(event) => setCategory((current) => ({ ...current, isActive: event.target.checked }))} />
            Active
          </label>
          <div className="mt-4 flex gap-2">
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} type="submit">{editingId ? "Update" : "Add"} Category</button>
            {editingId ? <button className={cn(ui.buttonBase, ui.buttonGhost)} type="button" onClick={() => { setEditingId(null); setCategory(blankCategory); }}>Cancel</button> : null}
          </div>

          <div className="mt-5 space-y-2">
            {categories.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="font-bold text-slate-900">{item.name}</div>
                <div className="text-sm text-slate-500">{item.description || "No description"}</div>
                <div className="mt-3 flex gap-2">
                  <button className={cn(ui.buttonBase, ui.buttonSecondary, "min-h-8 px-3 py-1.5")} type="button" onClick={() => { setEditingId(item.id); setCategory({ name: item.name, description: item.description || "", isActive: item.isActive !== false }); }}>Edit</button>
                  <button className={cn(ui.buttonBase, ui.buttonDanger, "min-h-8 px-3 py-1.5")} type="button" onClick={() => deleteCategory(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </form>
      </section>

      <section className={ui.panel}>
        <h2 className="mb-4 text-xl font-black text-slate-900">User-wise Weak Area Analytics</h2>
        {data?.userAnalytics?.length ? (
          <div className={ui.tableWrap}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>{["User", "Plan", "Subject", "Chapter", "Attempts", "Wrong", "Accuracy", "Incorrect IDs"].map((head) => <th key={head} className={ui.tableHead}>{head}</th>)}</tr>
                </thead>
                <tbody>
                  {data.userAnalytics.map((row) => (
                    <tr key={row.id}>
                      <td className={ui.tableCell}>{row.userName}</td>
                      <td className={ui.tableCell}>{row.isPremium ? "Premium" : "Free"}</td>
                      <td className={ui.tableCell}>{row.subjectName}</td>
                      <td className={ui.tableCell}>{row.chapterName}</td>
                      <td className={ui.tableCell}>{row.attempts}</td>
                      <td className={ui.tableCell}>{row.wrongCount}</td>
                      <td className={ui.tableCell}>{row.accuracy}%</td>
                      <td className={ui.tableCell}>{(row.incorrectQuestionIds || []).slice(0, 3).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <EmptyState title="No weak areas" description="Weak areas will appear after users answer questions incorrectly." />}
      </section>

      <section className={ui.panel}>
        <h2 className="mb-4 text-xl font-black text-slate-900">Improvement Trends</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.improvementTrends || []).map((item) => (
            <div key={item.id} className={ui.tile}>
              <div className="text-sm font-bold text-slate-900">{item.userName}</div>
              <div className="mt-1 text-sm text-slate-500">{item.subjectName} / {item.chapterName}</div>
              <div className="mt-3 text-2xl font-black text-slate-950">+{item.improvementPercentage}%</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.accuracy}% accuracy</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
