import { useEffect, useMemo, useState } from "react";
import { dailyPlanService } from "../api/dailyPlanService";
import { subjectService } from "../api/subjectService";
import { chapterService } from "../api/chapterService";
import { ConfirmDeleteModal } from "../components/common/ConfirmDeleteModal";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MathText } from "../components/common/MathText";
import { EntityFormWrapper } from "../components/forms/EntityFormWrapper";
import { ToggleSwitch } from "../components/forms/ToggleSwitch";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { EditIcon, PlusIcon, RefreshIcon, TrashIcon } from "../components/common/AdminIcons";
import { cn, ui } from "../ui";

const defaultForm = {
  modeKey: "NEET",
  selectionMode: "random",
  questionCount: 20,
  manualQuestionIds: [],
  autoFillRemaining: true,
  isActive: true,
  title: "",
  description: "",
};

function buildFormFromItem(item) {
  return {
    modeKey: item.modeKey || "NEET",
    selectionMode: item.selectionMode || "random",
    questionCount: Number(item.questionCount || 20),
    manualQuestionIds: Array.isArray(item.manualQuestionIds) ? item.manualQuestionIds : [],
    autoFillRemaining: item.autoFillRemaining !== false,
    isActive: Boolean(item.isActive),
    title: item.title || "",
    description: item.description || "",
  };
}

export function DailyPlansPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionSubjectId, setQuestionSubjectId] = useState("");
  const [questionChapterId, setQuestionChapterId] = useState("");
  const [questionResults, setQuestionResults] = useState([]);
  const [questionMeta, setQuestionMeta] = useState(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [knownSelectedQuestions, setKnownSelectedQuestions] = useState([]);
  const [rowToggleLoading, setRowToggleLoading] = useState({});

  const filteredChapters = useMemo(
    () => chapters.filter((item) => !questionSubjectId || String(item.subjectId?.id || item.subjectId) === String(questionSubjectId)),
    [chapters, questionSubjectId],
  );

  const selectedQuestions = useMemo(() => {
    const questionMap = new Map([
      ...questionResults.map((item) => [item.id, item]),
      ...knownSelectedQuestions.map((item) => [item.id, item]),
    ]);
    return (formState.manualQuestionIds || []).map((id) => questionMap.get(id) || { id, question: "Selected question", subjectName: "-", chapterName: "-", difficulty: "-" });
  }, [formState.manualQuestionIds, knownSelectedQuestions, questionResults]);

  async function loadItems(nextQuery = query) {
    setLoading(true);
    try {
      const response = await dailyPlanService.list({ ...nextQuery, search });
      setItems(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const [subjectsResponse, chaptersResponse] = await Promise.all([
        subjectService.list({ limit: 300 }),
        chapterService.list({ limit: 500 }),
      ]);
      setSubjects(subjectsResponse.data || []);
      setChapters(chaptersResponse.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function loadQuestions(nextPage = questionPage) {
    if (!showForm || formState.selectionMode !== "manual") return;
    setQuestionLoading(true);
    try {
      const response = await dailyPlanService.listQuestions({
        page: nextPage,
        limit: 10,
        search: questionSearch,
        modeKey: formState.modeKey,
        subjectId: questionSubjectId,
        chapterId: questionChapterId,
      });
      setQuestionResults(response.data || []);
      setQuestionMeta(response.meta);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setQuestionLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadItems(query);
  }, [query.page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) => {
        if (current.page !== 1) return { ...current, page: 1 };
        loadItems({ ...current, page: 1 });
        return current;
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!showForm || formState.selectionMode !== "manual") return;
    const timeout = window.setTimeout(() => {
      loadQuestions(questionPage);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [showForm, formState.selectionMode, formState.modeKey, questionSearch, questionSubjectId, questionChapterId, questionPage, formState.manualQuestionIds.join(",")]);

  function openCreate() {
    setEditingItem(null);
    setFormState(defaultForm);
    setKnownSelectedQuestions([]);
    setQuestionSearch("");
    setQuestionSubjectId("");
    setQuestionChapterId("");
    setQuestionPage(1);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormState(buildFormFromItem(item));
    setKnownSelectedQuestions(Array.isArray(item.manualQuestions) ? item.manualQuestions : []);
    setQuestionSearch("");
    setQuestionSubjectId("");
    setQuestionChapterId("");
    setQuestionPage(1);
    setShowForm(true);
  }

  function toggleQuestion(questionId) {
    const selectedRow = questionResults.find((item) => item.id === questionId);
    const isAlreadySelected = formState.manualQuestionIds.includes(questionId);
    if (!isAlreadySelected && selectedRow) {
      setKnownSelectedQuestions((known) => (
        known.some((item) => item.id === selectedRow.id) ? known : [...known, selectedRow]
      ));
    }
    setFormState((current) => {
      const exists = current.manualQuestionIds.includes(questionId);
      return {
        ...current,
        manualQuestionIds: exists ? current.manualQuestionIds.filter((id) => id !== questionId) : [...current.manualQuestionIds, questionId],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...formState,
      questionCount: Number(formState.questionCount),
      manualQuestionIds: formState.selectionMode === "manual" ? formState.manualQuestionIds : [],
    };
    try {
      if (editingItem) {
        await dailyPlanService.update(editingItem.id, payload);
        toast.success("Daily plan updated");
      } else {
        await dailyPlanService.create(payload);
        toast.success("Daily plan created");
      }
      setShowForm(false);
      await loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleDelete() {
    try {
      await dailyPlanService.remove(deleteItem.id);
      toast.success("Daily plan deleted");
      setDeleteItem(null);
      await loadItems({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleInlineToggle(item, field, nextValue) {
    const key = `${item.id}:${field}`;
    const previousValue = Boolean(item[field]);

    setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: nextValue } : row)));
    setRowToggleLoading((current) => ({ ...current, [key]: true }));

    try {
      await dailyPlanService.update(item.id, { [field]: nextValue });
      toast.success(`${field === "isActive" ? "Active status" : "Auto-fill"} updated`);
    } catch (error) {
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, [field]: previousValue } : row)));
      toast.error(error.message);
    } finally {
      setRowToggleLoading((current) => ({ ...current, [key]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.panel}>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className={ui.eyebrow}>Daily Plan Control</div>
            <p className={ui.muted}>Configure NEET/JEE daily question count and choose random or manual question allocation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={ui.badge}>{meta?.total ?? items.length} plans</div>
            <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={openCreate}>
              <PlusIcon size={16} />
              Create Daily Plan
            </button>
          </div>
        </div>
      </div>

      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by mode, title, or description..." />
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => loadItems({ ...query, page: 1 })}>
            <RefreshIcon size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading daily plans..." /> : null}
      {!loading && !items.length ? <EmptyState title="No daily plans found" description="Create NEET and JEE plans to control the app daily-set flow." /> : null}
      {!loading && items.length ? (
        <>
          <div className={ui.tableWrap}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th className={ui.tableHead}>Mode</th>
                    <th className={ui.tableHead}>Type</th>
                    <th className={ui.tableHead}>Count</th>
                    <th className={ui.tableHead}>Manual Set</th>
                    <th className={ui.tableHead}>Status</th>
                    <th className={ui.tableHead}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className={ui.tableCell}>
                        <div className="font-bold text-slate-900">{item.modeKey}</div>
                        <div className="text-xs text-slate-500">{item.title || "Daily plan"}</div>
                      </td>
                      <td className={ui.tableCell}>{item.selectionMode === "manual" ? "Manual" : "Random"}</td>
                      <td className={ui.tableCell}>{item.questionCount}</td>
                      <td className={ui.tableCell}>
                        <div className="text-sm text-slate-700">{item.manualQuestionIds?.length || 0} selected</div>
                        <div className="mt-2">
                          <ToggleSwitch
                            checked={Boolean(item.autoFillRemaining)}
                            disabled={Boolean(rowToggleLoading[`${item.id}:autoFillRemaining`])}
                            onChange={(nextValue) => void handleInlineToggle(item, "autoFillRemaining", nextValue)}
                            label={item.autoFillRemaining ? "Auto-fill enabled" : "Strict manual only"}
                          />
                        </div>
                      </td>
                      <td className={ui.tableCell}>
                        <ToggleSwitch
                          checked={Boolean(item.isActive)}
                          disabled={Boolean(rowToggleLoading[`${item.id}:isActive`])}
                          onChange={(nextValue) => void handleInlineToggle(item, "isActive", nextValue)}
                          label={item.isActive ? "Active" : "Inactive"}
                        />
                      </td>
                      <td className={ui.tableCell}>
                        <div className="flex flex-wrap items-center gap-3">
                          <button className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => openEdit(item)}>
                            <EditIcon size={16} />
                            Edit
                          </button>
                          <button className={cn(ui.buttonBase, ui.buttonDanger)} onClick={() => setDeleteItem(item)}>
                            <TrashIcon size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </>
      ) : null}

      {showForm ? (
        <EntityFormWrapper
          title={editingItem ? "Edit Daily Plan" : "Create Daily Plan"}
          subtitle="Set count and source strategy. In manual mode, pick exact questions from the catalog."
          onCancel={() => setShowForm(false)}
          onSubmit={handleSubmit}
          submitLabel={editingItem ? "Save Daily Plan" : "Create Daily Plan"}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={ui.field}>
              <span>Mode</span>
              <select className={ui.input} value={formState.modeKey} onChange={(event) => setFormState((current) => ({ ...current, modeKey: event.target.value }))}>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="BOTH">BOTH</option>
              </select>
            </label>
            <label className={ui.field}>
              <span>Selection Type</span>
              <select className={ui.input} value={formState.selectionMode} onChange={(event) => setFormState((current) => ({ ...current, selectionMode: event.target.value }))}>
                <option value="random">Random</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className={ui.field}>
              <span>Question Count</span>
              <input className={ui.input} type="number" min="1" max="200" value={formState.questionCount} onChange={(event) => setFormState((current) => ({ ...current, questionCount: event.target.value }))} />
            </label>
            <label className={ui.field}>
              <span>Title</span>
              <input className={ui.input} value={formState.title} onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className={cn(ui.field, ui.fieldFull)}>
              <span>Description</span>
              <textarea className={ui.textarea} value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <div className="pt-8">
              <ToggleSwitch
                checked={formState.autoFillRemaining}
                onChange={(nextValue) => setFormState((current) => ({ ...current, autoFillRemaining: nextValue }))}
                label="Auto-fill remaining with random questions"
              />
            </div>
            <div className="pt-8">
              <ToggleSwitch
                checked={formState.isActive}
                onChange={(nextValue) => setFormState((current) => ({ ...current, isActive: nextValue }))}
                label="Active"
              />
            </div>
          </div>

          {formState.selectionMode === "manual" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
              <div className={ui.compactPanel}>
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-semibold text-slate-700">Find Questions</div>
                    <SearchBar value={questionSearch} onChange={(value) => { setQuestionSearch(value); setQuestionPage(1); }} placeholder="Search question text..." />
                  </div>
                  <select className={cn(ui.input, "lg:max-w-[220px]")} value={questionSubjectId} onChange={(event) => { setQuestionSubjectId(event.target.value); setQuestionChapterId(""); setQuestionPage(1); }}>
                    <option value="">All Subjects</option>
                    {subjects.filter((item) => formState.modeKey === "BOTH" || item.examType === formState.modeKey).map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <select className={cn(ui.input, "lg:max-w-[220px]")} value={questionChapterId} onChange={(event) => { setQuestionChapterId(event.target.value); setQuestionPage(1); }}>
                    <option value="">All Chapters</option>
                    {filteredChapters.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                {questionLoading ? <LoadingSpinner label="Loading questions..." /> : null}
                {!questionLoading ? (
                  <div className="space-y-3">
                    {questionResults.map((item) => {
                      const isSelected = formState.manualQuestionIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(ui.tile, "w-full text-left", isSelected && "border-blue-300 bg-blue-50")}
                          onClick={() => toggleQuestion(item.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <MathText className="line-clamp-2 font-semibold text-slate-900">{item.question}</MathText>
                              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.subjectName} | {item.chapterName} | {item.difficulty}</div>
                            </div>
                            <span className={ui.pill}>{isSelected ? "Selected" : "Add"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <Pagination meta={questionMeta} onChange={(page) => setQuestionPage(page)} />
              </div>

              <div className={ui.compactPanel}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Selected Questions</h3>
                    <p className={ui.muted}>{formState.manualQuestionIds.length} manually selected.</p>
                  </div>
                  <span className={ui.badge}>{formState.manualQuestionIds.length}</span>
                </div>
                <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
                  {selectedQuestions.map((item, index) => (
                    <div key={item.id} className="rounded-sm border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span className={ui.pill}>#{index + 1}</span>
                        <button type="button" className="text-sm font-semibold text-rose-600" onClick={() => toggleQuestion(item.id)}>Remove</button>
                      </div>
                      <MathText className="line-clamp-3 text-sm font-semibold text-slate-900">{item.question}</MathText>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.subjectName} | {item.chapterName} | {item.difficulty}</div>
                    </div>
                  ))}
                  {!selectedQuestions.length ? <EmptyState title="No questions selected" description="Select questions for manual daily plan mode." /> : null}
                </div>
              </div>
            </div>
          ) : null}
        </EntityFormWrapper>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteItem)}
        title="Delete daily plan"
        description="This will remove this mode config and the app will fall back to automatic daily assignment."
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
