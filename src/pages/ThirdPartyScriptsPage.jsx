import { useEffect, useState } from "react";
import { Copy, Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { scriptService } from "../api/scriptService";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Pagination } from "../components/tables/Pagination";
import { SearchBar } from "../components/tables/SearchBar";
import { useToast } from "../context/ToastContext";
import { cn, ui } from "../ui";

const emptyForm = {
  scriptName: "",
  description: "",
  scriptType: "Custom",
  scriptCode: "",
  platform: "All",
  loadPosition: "Body End",
  priority: 100,
  status: "disabled",
};

const scriptTypes = ["Microsoft Clarity", "Google Analytics", "Google Tag Manager", "Facebook Pixel", "Meta Pixel", "LinkedIn Insight", "Custom"];
const platforms = ["All", "Android", "iOS", "Web"];
const loadPositions = ["Head", "Body Start", "Body End"];

export function ThirdPartyScriptsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [query, setQuery] = useState({ page: 1, status: "all", platform: "all", sortBy: "updatedAt", sortOrder: "desc" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function load(next = query) {
    setLoading(true);
    try {
      const response = await scriptService.list({ ...next, search });
      setItems(response.data || []);
      setMeta(response.meta || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(query);
  }, [query.page, query.status, query.platform, query.sortBy, query.sortOrder]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = { ...query, page: 1 };
      setQuery(next);
      void load(next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [search]);

  function beginEdit(item = null) {
    setEditing(item || {});
    setViewing(null);
    setForm(item ? { ...emptyForm, ...item } : emptyForm);
  }

  async function save(event) {
    event.preventDefault();
    if (!form.scriptName.trim() || !form.scriptCode.trim()) {
      toast.error("Script Name and Script Code are required");
      return;
    }
    try {
      if (editing?.id) await scriptService.update(editing.id, form);
      else await scriptService.create(form);
      toast.success(editing?.id ? "Script updated" : "Script created");
      setEditing(null);
      setForm(emptyForm);
      await load({ ...query, page: 1 });
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function action(fn, success) {
    try {
      await fn();
      toast.success(success);
      await load(query);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const activeFormTitle = editing?.id ? "Edit Script" : "Create Script";

  return (
    <div className="flex flex-col gap-6">
      <div className={ui.compactPanel}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={ui.eyebrow}>Settings</div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Third Party Scripts</h2>
            <p className={ui.muted}>Enabled snippets are delivered to matching app platforms at startup.</p>
          </div>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={() => beginEdit()}>
            <Plus size={16} /> Create Script
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search scripts..." />
          <select className={ui.input} value={query.status} onChange={(event) => setQuery((current) => ({ ...current, page: 1, status: event.target.value }))}>
            <option value="all">All status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <select className={ui.input} value={query.platform} onChange={(event) => setQuery((current) => ({ ...current, page: 1, platform: event.target.value }))}>
            <option value="all">All platforms</option>
            {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className={ui.input} value={query.sortBy} onChange={(event) => setQuery((current) => ({ ...current, page: 1, sortBy: event.target.value }))}>
            <option value="updatedAt">Updated Date</option>
            <option value="scriptName">Name</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {editing ? (
        <form className={ui.compactPanel} onSubmit={save}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{activeFormTitle}</h3>
            <button type="button" className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setEditing(null)}>Close</button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <label className={ui.field}><span>Script Name</span><input className={ui.input} value={form.scriptName} onChange={(e) => setForm({ ...form, scriptName: e.target.value })} /></label>
            <label className={ui.field}><span>Script Type</span><select className={ui.input} value={form.scriptType} onChange={(e) => setForm({ ...form, scriptType: e.target.value })}>{scriptTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={ui.field}><span>Platform</span><select className={ui.input} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>{platforms.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={ui.field}><span>Load Position</span><select className={ui.input} value={form.loadPosition} onChange={(e) => setForm({ ...form, loadPosition: e.target.value })}>{loadPositions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={ui.field}><span>Priority</span><input className={ui.input} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></label>
            <label className={ui.field}><span>Status</span><select className={ui.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Description</span><input className={ui.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className={cn(ui.field, "lg:col-span-3")}><span>Script Code</span><textarea className={cn(ui.input, "min-h-64 font-mono text-xs")} value={form.scriptCode} onChange={(e) => setForm({ ...form, scriptCode: e.target.value })} /></label>
          </div>
          <div className="mt-4 flex justify-end"><button className={cn(ui.buttonBase, ui.buttonPrimary)}>Save Script</button></div>
        </form>
      ) : null}

      {viewing ? (
        <div className={ui.compactPanel}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">{viewing.scriptName}</h3>
            <button className={cn(ui.buttonBase, ui.buttonGhost)} onClick={() => setViewing(null)}>Close</button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-sm border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">{viewing.scriptCode}</pre>
        </div>
      ) : null}

      {loading ? <LoadingSpinner label="Loading scripts..." /> : null}
      {!loading && !items.length ? <EmptyState title="No scripts found" description="Create a script to start dynamic loading." /> : null}
      {!loading && items.length ? (
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead><tr><th className={ui.tableHead}>Name</th><th className={ui.tableHead}>Platform</th><th className={ui.tableHead}>Type</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Updated Date</th><th className={ui.tableHead}>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={ui.tableCell}><div className="font-bold text-slate-900">{item.scriptName}</div><div className="max-w-xs truncate text-xs text-slate-500">{item.description}</div></td>
                    <td className={ui.tableCell}>{item.platform}</td>
                    <td className={ui.tableCell}>{item.scriptType}</td>
                    <td className={ui.tableCell}><span className={item.status === "enabled" ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600"}>{item.status}</span></td>
                    <td className={ui.tableCell}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}</td>
                    <td className={ui.tableCell}>
                      <div className="flex flex-wrap gap-2">
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title="View" onClick={() => setViewing(item)}><Eye size={15} /></button>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title="Edit" onClick={() => beginEdit(item)}><Pencil size={15} /></button>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title={item.status === "enabled" ? "Disable" : "Enable"} onClick={() => action(() => scriptService.setStatus(item.id, item.status === "enabled" ? "disabled" : "enabled"), "Status updated")}><Power size={15} /></button>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title="Duplicate" onClick={() => action(() => scriptService.duplicate(item.id), "Script duplicated")}><Copy size={15} /></button>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50" title="Delete" onClick={() => window.confirm("Delete this script?") && action(() => scriptService.remove(item.id), "Script deleted")}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onChange={(page) => setQuery((current) => ({ ...current, page }))} />
        </div>
      ) : null}
    </div>
  );
}
