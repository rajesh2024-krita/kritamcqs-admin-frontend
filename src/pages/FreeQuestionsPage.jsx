import { useEffect, useState } from "react";
import { http } from "../api/http";
import { freeQuestionService } from "../api/freeQuestionService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

export function FreeQuestionsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ subjectId: "", selectionMode: "automatic", questionCount: 20, manualQuestionIds: "", isActive: true });

  async function load() {
    setLoading(true);
    try {
      const [configResponse, subjectResponse] = await Promise.all([
        freeQuestionService.list(),
        http.get("/admin/subjects?limit=500"),
      ]);
      setItems(configResponse.data || []);
      setSubjects(subjectResponse.data?.data || subjectResponse.data || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form.subjectId || form.selectionMode !== "manual") {
      setQuestions([]);
      return;
    }
    http.get(`/admin/questions?subjectId=${encodeURIComponent(form.subjectId)}&limit=500`)
      .then((response) => setQuestions(response.data?.data || response.data || []))
      .catch(() => setQuestions([]));
  }, [form.subjectId, form.selectionMode]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await freeQuestionService.save({
        subjectId: form.subjectId,
        selectionMode: form.selectionMode,
        questionCount: Number(form.questionCount || 20),
        manualQuestionIds: form.manualQuestionIds.split(",").map((value) => value.trim()).filter(Boolean),
        isActive: Boolean(form.isActive),
      });
      toast.success("Free questions saved");
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading free questions..." />;

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <h2 className="text-xl font-black text-slate-900">Free Questions Configuration</h2>
        <p className={ui.muted}>Choose manual questions or let the system auto-pick a free practice set by subject.</p>
      </section>

      <form className={ui.panel} onSubmit={save}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Subject</span>
            <select className={ui.input} value={form.subjectId} onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))}>
              <option value="">Select subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.examType || subject.examMode || "-"})</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>Selection Mode</span>
            <select className={ui.input} value={form.selectionMode} onChange={(event) => setForm((current) => ({ ...current, selectionMode: event.target.value }))}>
              <option value="automatic">Automatic Selection</option>
              <option value="manual">Manual Selection</option>
            </select>
          </label>
          <label className={ui.field}>
            <span>Question Count</span>
            <input className={ui.input} type="number" min="1" max="200" value={form.questionCount} onChange={(event) => setForm((current) => ({ ...current, questionCount: event.target.value }))} />
          </label>
          <label className={ui.field}>
            <span>Status</span>
            <select className={ui.input} value={form.isActive ? "true" : "false"} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>

        {form.selectionMode === "manual" ? (
          <label className={`${ui.field} mt-4`}>
            <span>Manual Questions</span>
            <select multiple className={`${ui.input} min-h-44`} value={form.manualQuestionIds.split(",").filter(Boolean)} onChange={(event) => setForm((current) => ({ ...current, manualQuestionIds: Array.from(event.target.selectedOptions).map((option) => option.value).join(",") }))}>
              {questions.map((question) => <option key={question.id} value={question.id}>{question.question || question.id}</option>)}
            </select>
          </label>
        ) : null}

        <button className={cn(ui.buttonBase, ui.buttonPrimary, "mt-4")} disabled={saving || !form.subjectId}>{saving ? "Saving..." : "Save Free Questions"}</button>
      </form>

      <section className={ui.panel}>
        <div className="overflow-x-auto">
          <table className={ui.table}>
            <thead><tr><th className={ui.tableHead}>Subject</th><th className={ui.tableHead}>Mode</th><th className={ui.tableHead}>Count</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Action</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={ui.tableCell}>{item.subjectName}</td>
                  <td className={ui.tableCell}>{item.selectionMode}</td>
                  <td className={ui.tableCell}>{item.selectionMode === "manual" ? item.manualQuestionIds?.length || 0 : item.questionCount}</td>
                  <td className={ui.tableCell}>{item.isActive ? "Active" : "Inactive"}</td>
                  <td className={ui.tableCell}><button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={async () => { await freeQuestionService.remove(item.id); await load(); }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
