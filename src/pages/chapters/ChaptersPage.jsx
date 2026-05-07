import { useEffect, useMemo, useState } from "react";
import { chapterService } from "../../api/chapterService";
import { subjectService } from "../../api/subjectService";
import { useToast } from "../../context/ToastContext";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { cn, ui } from "../../ui";
import { EntityManagerPage } from "../common/EntityManagerPage";

function formatSubjectLabel(subject) {
  if (!subject) return "-";
  if (typeof subject === "string") return subject;
  return `${subject.name} (${subject.examType})`;
}

function parseChapterIds(value) {
  return [...new Set(
    String(value || "")
      .split(/[\n,\s]+/g)
      .map((item) => item.trim())
      .filter(Boolean),
  )];
}

function BulkFreeAccessPanel() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [chapterIdsRaw, setChapterIdsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const parsedIds = useMemo(() => parseChapterIds(chapterIdsRaw), [chapterIdsRaw]);

  useEffect(() => {
    let active = true;
    subjectService
      .list({ limit: 500 })
      .then((response) => {
        if (!active) return;
        setSubjects(response?.data || []);
      })
      .catch((error) => toast.error(error.message));
    return () => {
      active = false;
    };
  }, [toast]);

  async function applyBulkAccess(isLockedForFreeUsers) {
    if (!subjectId && parsedIds.length === 0) {
      toast.error("Select a subject or provide chapter IDs for bulk action");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        isLockedForFreeUsers,
        ...(parsedIds.length > 0 ? { chapterIds: parsedIds } : { subjectId }),
      };
      const response = await chapterService.bulkFreeAccessUpdate(payload);
      const modifiedCount = Number(response?.data?.modifiedCount || 0);
      toast.success(
        isLockedForFreeUsers
          ? `Locked ${modifiedCount} chapter(s) for free users`
          : `Unlocked ${modifiedCount} chapter(s) for free users`,
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Bulk Access Control</div>
      <h2 className="text-xl font-black tracking-tight text-slate-900">Chapter Lock/Unlock for Free Users</h2>
      <p className="mt-1 text-sm text-slate-500">
        Select a subject to apply on all its chapters, or paste multiple chapter IDs (comma/new-line separated).
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Subject</label>
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className={ui.input}
            disabled={parsedIds.length > 0}
          >
            <option value="">Choose subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {formatSubjectLabel(subject)}
              </option>
            ))}
          </select>
          {parsedIds.length > 0 ? (
            <p className="mt-1 text-xs text-slate-500">Subject selection is ignored when chapter IDs are provided.</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Chapter IDs (Optional)</label>
          <textarea
            value={chapterIdsRaw}
            onChange={(event) => setChapterIdsRaw(event.target.value)}
            rows={4}
            placeholder="Paste chapter IDs separated by comma/new line"
            className={ui.textarea}
          />
          <p className="mt-1 text-xs text-slate-500">{parsedIds.length} chapter id(s) parsed</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void applyBulkAccess(true)}
          disabled={loading}
          className={cn(ui.buttonBase, ui.buttonDanger)}
        >
          {loading ? "Applying..." : "Lock for Free Users"}
        </button>
        <button
          type="button"
          onClick={() => void applyBulkAccess(false)}
          disabled={loading}
          className={cn(ui.buttonBase, ui.buttonPrimary)}
        >
          {loading ? "Applying..." : "Unlock for Free Users"}
        </button>
      </div>
    </div>
  );
}

function ChapterAccessToggleCell({ row }) {
  const toast = useToast();
  const [checked, setChecked] = useState(Boolean(row.isLockedForFreeUsers));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChecked(Boolean(row.isLockedForFreeUsers));
  }, [row.isLockedForFreeUsers]);

  async function handleToggle(nextValue) {
    const previousValue = checked;
    setChecked(nextValue);
    setSaving(true);
    try {
      await chapterService.update(row.id, { isLockedForFreeUsers: nextValue });
      toast.success(nextValue ? "Chapter locked for free users" : "Chapter unlocked for free users");
    } catch (error) {
      setChecked(previousValue);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ToggleSwitch
        checked={checked}
        disabled={saving}
        onChange={(nextValue) => void handleToggle(nextValue)}
      />
      <span className={`text-xs font-bold ${checked ? "text-amber-700" : "text-emerald-700"}`}>
        {checked ? "Locked" : "Unlocked"}
      </span>
    </div>
  );
}

export function ChaptersPage() {
  return (
    <div className="flex flex-col gap-6">
      <BulkFreeAccessPanel />
      <EntityManagerPage
        title="Chapters"
        description="Manage chapters under each subject."
        service={chapterService}
        lookupLoaders={[{ key: "subjects", load: () => subjectService.list({ limit: 500 }) }]}
        fields={[
          { name: "subjectId", label: "Subject", required: true, type: "select", options: (_form, lookups) => (lookups.subjects || []).map((subject) => ({ label: formatSubjectLabel(subject), value: subject.id })) },
          { name: "name", label: "Chapter Name", required: true },
          { name: "isLockedForFreeUsers", label: "Lock for Free Users", type: "switch", defaultValue: false },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "subjectId", label: "Subject", render: (row) => formatSubjectLabel(row.subjectId) },
          { key: "examType", label: "Exam Type", render: (row) => row.subjectId?.examType || "-" },
          {
            key: "isLockedForFreeUsers",
            label: "Free User Lock",
            render: (row) => <ChapterAccessToggleCell row={row} />,
          },
          {
            key: "accessBadge",
            label: "Badge",
            render: (row) => (
              <span className={row.isLockedForFreeUsers ? "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800" : "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700"}>
                {row.isLockedForFreeUsers ? "Premium" : "Free"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
