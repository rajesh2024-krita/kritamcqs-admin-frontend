import { useEffect, useMemo, useState } from "react";
import { chapterService } from "../../api/chapterService";
import { subjectService } from "../../api/subjectService";
import { uploadService } from "../../api/uploadService";
import { useToast } from "../../context/ToastContext";
import { ToggleSwitch } from "../../components/forms/ToggleSwitch";
import { cn, ui } from "../../ui";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Unlock, 
  RefreshCw,
  BookOpen,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

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

// Advanced Bulk Access Panel with Modern UI
function BulkFreeAccessPanel() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("subject");
  
  const parsedIds = useMemo(() => parseChapterIds(selectedChapterIds.join(",")), [selectedChapterIds]);
  
  const filteredChapters = useMemo(() => {
    let result = chapters.filter((chapter) => 
      !subjectId || String(chapter.subjectId?.id || chapter.subjectId) === String(subjectId)
    );
    if (searchTerm) {
      result = result.filter(chapter => 
        chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [chapters, subjectId, searchTerm]);

  const selectedSubject = useMemo(() => 
    subjects.find(s => String(s.id) === String(subjectId)),
    [subjects, subjectId]
  );

  useEffect(() => {
    let active = true;
    Promise.all([subjectService.list({ limit: 500 }), chapterService.list({ limit: 500 })])
      .then(([subjectResponse, chapterResponse]) => {
        if (!active) return;
        setSubjects(subjectResponse?.data || []);
        setChapters(chapterResponse?.data || []);
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

  const compactSelect = "w-full px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";
  const compactSelectMultiple = "w-full px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px]";

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50/50 transition-all duration-200 group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all">
            <Layers size={12} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Bulk Access Control</h3>
            <p className="text-[9px] text-slate-500">Manage chapter access for free users</p>
          </div>
          {subjectId && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[8px] font-medium text-indigo-700">
              {filteredChapters.length} chapters
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-slate-400">
            {subjectId ? selectedSubject?.name || 'Subject selected' : 'Ready'}
          </span>
          <div className="p-0.5 rounded-lg hover:bg-slate-100 transition-colors">
            {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          </div>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider">Total Chapters</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{chapters.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider">Filtered</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{filteredChapters.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider">Selected</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{parsedIds.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider">Subject</span>
              <p className="text-[9px] font-medium text-slate-700 truncate mt-0.5">
                {selectedSubject?.name || 'Not selected'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("subject")}
              className={cn(
                "flex-1 px-2.5 py-1 text-[9px] font-medium rounded transition-all",
                activeTab === "subject"
                  ? "bg-white shadow-sm text-indigo-700"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              By Subject
            </button>
            <button
              onClick={() => setActiveTab("chapters")}
              className={cn(
                "flex-1 px-2.5 py-1 text-[9px] font-medium rounded transition-all",
                activeTab === "chapters"
                  ? "bg-white shadow-sm text-indigo-700"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Select Chapters
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-3">
            {/* Subject Select */}
            {activeTab === "subject" && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-[9px] font-medium text-slate-600 uppercase tracking-wider mb-1">
                  <BookOpen size={10} className="inline mr-1" />
                  Select Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(event) => {
                    setSubjectId(event.target.value);
                    setSelectedChapterIds([]);
                  }}
                  className={compactSelect}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {formatSubjectLabel(subject)}
                    </option>
                  ))}
                </select>
                {subjectId && (
                  <p className="text-[8px] text-slate-400 mt-0.5">
                    {filteredChapters.length} chapters will be affected
                  </p>
                )}
              </div>
            )}

            {/* Chapters Multi-Select */}
            {activeTab === "chapters" && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">
                    <Layers size={10} className="inline mr-1" />
                    Select Chapters
                  </label>
                  <span className="text-[8px] text-slate-400">
                    {parsedIds.length} selected
                  </span>
                </div>
                
                {/* Search */}
                <div className="relative mb-1.5">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search chapters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <select
                  multiple
                  value={selectedChapterIds}
                  onChange={(event) => setSelectedChapterIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
                  className={compactSelectMultiple}
                  size={5}
                >
                  {filteredChapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
                
                {filteredChapters.length === 0 && (
                  <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mt-0.5">
                    <AlertCircle size={10} />
                    No chapters available
                  </div>
                )}
                {filteredChapters.length > 0 && (
                  <p className="text-[8px] text-slate-400 mt-0.5">
                    {filteredChapters.length} chapters available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => void applyBulkAccess(true)}
              disabled={loading || (!subjectId && parsedIds.length === 0)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-medium rounded-lg transition-all duration-200",
                "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-sm shadow-rose-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-rose-500 disabled:hover:to-rose-600"
              )}
            >
              <Lock size={11} />
              Lock All
            </button>
            <button
              type="button"
              onClick={() => void applyBulkAccess(false)}
              disabled={loading || (!subjectId && parsedIds.length === 0)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-medium rounded-lg transition-all duration-200",
                "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm shadow-emerald-500/25",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-emerald-600"
              )}
            >
              <Unlock size={11} />
              Unlock All
            </button>
            
            {loading && (
              <span className="flex items-center gap-1.5 text-[8px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                <RefreshCw size={10} className="animate-spin" />
                Processing...
              </span>
            )}
            
            <button
              type="button"
              onClick={() => {
                setSubjectId("");
                setSelectedChapterIds([]);
                setSearchTerm("");
              }}
              className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[8px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Advanced Toggle Cell with Status Indicators
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
        size="sm"
      />
      <div className="flex flex-col">
        <span className={cn(
          "text-[9px] font-medium transition-colors",
          checked ? "text-amber-600" : "text-emerald-600"
        )}>
          {saving ? "Updating..." : checked ? "Locked" : "Unlocked"}
        </span>
        <span className="text-[7px] text-slate-400">
          {checked ? "Premium only" : "Free access"}
        </span>
      </div>
    </div>
  );
}

// Advanced Status Badge
function StatusBadge({ isLocked }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-medium border transition-all",
      isLocked 
        ? "bg-amber-50 text-amber-700 border-amber-200" 
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    )}>
      {isLocked ? (
        <Lock size={8} className="text-amber-500" />
      ) : (
        <Unlock size={8} className="text-emerald-500" />
      )}
      {isLocked ? "Premium" : "Free"}
    </span>
  );
}

export function ChaptersPage() {
  return (
    <div className="space-y-3">
      <BulkFreeAccessPanel />
      
      <EntityManagerPage
        title="Chapters"
        description="Manage chapters under each subject."
        service={chapterService}
        lookupLoaders={[
          { key: "subjects", load: () => subjectService.list({ limit: 500 }) },
          { key: "chapters", load: () => chapterService.list({ limit: 500 }) },
        ]}
        filters={[
          {
            name: "subjectId",
            label: "Subject",
            placeholder: "All Subjects",
            options: (lookups) => (lookups.subjects || []).map((subject) => ({ label: formatSubjectLabel(subject), value: subject.id })),
          },
          {
            name: "_id",
            label: "Chapter",
            placeholder: "All Chapters",
            options: (lookups, filters) => (lookups.chapters || [])
              .filter((chapter) => !filters.subjectId || String(chapter.subjectId?.id || chapter.subjectId) === String(filters.subjectId))
              .map((chapter) => ({ label: chapter.name, value: chapter.id })),
          },
        ]}
        fields={[
          { 
            name: "subjectId", 
            label: "Subject", 
            required: true, 
            type: "select", 
            options: (_form, lookups) => (lookups.subjects || []).map((subject) => ({ 
              label: formatSubjectLabel(subject), 
              value: subject.id 
            })) 
          },
          { name: "name", label: "Chapter Name", required: true },
          { 
            name: "iconUrl", 
            label: "Chapter Icon", 
            type: "image-upload", 
            upload: (file) => uploadService.appImage(file, "chapter-icons"), 
            full: true 
          },
          { 
            name: "imageUrl", 
            label: "Chapter Image", 
            type: "image-upload", 
            upload: (file) => uploadService.appImage(file, "chapter-images"), 
            full: true 
          },
          { 
            name: "isLockedForFreeUsers", 
            label: "Lock for Free Users", 
            type: "switch", 
            defaultValue: false 
          },
        ]}
        columns={[
          { 
            key: "name", 
            label: "Chapter Name",
            render: (row) => (
              <div className="flex items-center gap-2">
                <BookOpen size={12} className="text-slate-400" />
                <span className="font-medium text-slate-700">{row.name}</span>
              </div>
            )
          },
          { 
            key: "subjectId", 
            label: "Subject", 
            render: (row) => (
              <span className="text-[10px] text-slate-600">{formatSubjectLabel(row.subjectId)}</span>
            ) 
          },
          { 
            key: "iconUrl", 
            label: "Icon", 
            render: (row) => row.iconUrl ? (
              <CheckCircle size={12} className="text-emerald-500" />
            ) : (
              <XCircle size={12} className="text-slate-300" />
            ) 
          },
          { 
            key: "examType", 
            label: "Exam", 
            render: (row) => (
              <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[8px] font-medium">
                {row.subjectId?.examType || "-"}
              </span>
            )
          },
          {
            key: "isLockedForFreeUsers",
            label: "Free Access",
            render: (row) => <ChapterAccessToggleCell row={row} />,
          },
          {
            key: "accessBadge",
            label: "Status",
            render: (row) => <StatusBadge isLocked={row.isLockedForFreeUsers} />,
          },
        ]}
      />
    </div>
  );
}