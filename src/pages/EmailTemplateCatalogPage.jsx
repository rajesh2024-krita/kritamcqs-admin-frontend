import { useEffect, useMemo, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SearchBar } from "../components/tables/SearchBar";
import { cn, ui } from "../ui";
import { useToast } from "../context/ToastContext";
import {
  Mail,
  FileText,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Tag,
  Layers,
  Zap,
  Shield,
  Database,
  Server,
  Globe,
  Link,
  Type,
  BookOpen,
  Code,
  List,
  Grid,
  Layout,
  Columns,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  Plus,
  Save,
  X
} from "lucide-react";

export function EmailTemplateCatalogPage() {
  const toast = useToast();
  const [catalog, setCatalog] = useState(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    emailTemplateService.catalog()
      .then((response) => {
        const payload = response?.data ?? response;
        setCatalog(payload?.data ?? (payload || null));
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const templateList = useMemo(() => {
    if (!catalog?.templates) return [];
    return catalog.templates.filter((item) => {
      if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      const normalized = `${item.key} ${item.module} ${item.type} ${item.trigger}`.toLowerCase();
      return normalized.includes(search.toLowerCase());
    });
  }, [catalog, search, moduleFilter, typeFilter]);

  // Compact input classes
  const compactInput = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
  const compactSelect = "w-full px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none";

  const getStatusBadge = (template) => {
    if (!template.status?.exists) {
      return { label: "Not Created", color: "bg-slate-100 text-slate-600 border border-slate-200", icon: XCircle };
    }
    if (template.status.isActive) {
      return { label: "Active", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle };
    }
    return { label: "Inactive", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: AlertCircle };
  };

  const totalTemplates = catalog?.templates?.length || 0;
  const activeCount = catalog?.templates?.filter(t => t.status?.exists && t.status.isActive).length || 0;
  const missingCount = catalog?.templates?.filter(t => !t.status?.exists).length || 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <BookOpen size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Email Template Keys</h1>
              <p className="text-xs text-slate-500">Browse central email template mappings and variables</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[8px] font-medium text-emerald-700">
              {activeCount} active
            </span>
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 rounded text-[8px] font-medium text-amber-700">
              {missingCount} missing
            </span>
            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-medium text-indigo-700">
              {totalTemplates} keys
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total Templates", value: totalTemplates, icon: FileText, color: "blue" },
          { label: "Active", value: activeCount, icon: CheckCircle, color: "emerald" },
          { label: "Inactive", value: catalog?.templates?.filter(t => t.status?.exists && !t.status.isActive).length || 0, icon: AlertCircle, color: "amber" },
          { label: "Not Created", value: missingCount, icon: XCircle, color: "rose" },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            amber: "bg-amber-50 text-amber-600",
            rose: "bg-rose-50 text-rose-600",
          };
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1 rounded ${colorClasses[stat.color]}`}>
                  <Icon size={12} className={colorClasses[stat.color]} />
                </div>
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={setSearch} placeholder="Search keys, modules, or triggers..." />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Module:</span>
              <select className={cn(compactSelect, "w-28")} value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
                <option value="all">All Modules</option>
                {(catalog?.modules || []).map((module) => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-medium text-slate-400 uppercase tracking-wider">Type:</span>
              <select className={cn(compactSelect, "w-24")} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">All Types</option>
                {(catalog?.types || []).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <button className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[8px] font-medium text-slate-700 rounded transition-colors" onClick={() => { setSearch(""); setModuleFilter("all"); setTypeFilter("all"); }}>
              <RefreshCw size={9} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["Module", "Template Key", "Type", "Trigger", "Variables", "Attachments", "Status"].map((x) => (
                    <th key={x} className="px-2.5 py-1.5 text-left">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">{x}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templateList.length ? (
                  templateList.map((template) => {
                    const status = getStatusBadge(template);
                    const Icon = status.icon;
                    return (
                      <tr key={template.key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2.5 py-1.5">
                          <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[7px] font-medium text-indigo-700">
                            {template.module}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <div className="text-[10px] font-semibold text-slate-900">{template.key}</div>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <span className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-medium text-slate-600">
                            {template.type}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <span className="text-[8px] text-slate-600">{template.trigger || "-"}</span>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                            {(template.placeholders || []).map((variable) => (
                              <span key={variable} className="inline-flex px-1.5 py-0.5 bg-slate-100 rounded text-[6px] font-medium text-slate-600">
                                {`{{${variable}}}`}
                              </span>
                            ))}
                            {!template.placeholders?.length && (
                              <span className="text-[7px] text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <span className={cn(
                            "inline-flex px-1.5 py-0.5 rounded text-[7px] font-medium",
                            template.supportsAttachments 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}>
                            {template.supportsAttachments ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <span className={cn(
                            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium",
                            status.color
                          )}>
                            <Icon size={8} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <BookOpen size={20} className="text-slate-300" />
                        <span className="text-[10px] text-slate-500">No email template keys found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      {templateList.length > 0 && (
        <div className="flex items-center justify-between py-1">
          <span className="text-[8px] text-slate-400">
            Showing {templateList.length} of {totalTemplates} template keys
          </span>
          <div className="flex items-center gap-2 text-[8px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {activeCount} active
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {catalog?.templates?.filter(t => t.status?.exists && !t.status.isActive).length || 0} inactive
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {missingCount} missing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}