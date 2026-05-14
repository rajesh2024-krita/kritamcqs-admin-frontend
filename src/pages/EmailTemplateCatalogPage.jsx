import { useEffect, useMemo, useState } from "react";
import { emailTemplateService } from "../api/emailTemplateService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SearchBar } from "../components/tables/SearchBar";
import { cn, ui } from "../ui";
import { useToast } from "../context/ToastContext";

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

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <div className={ui.eyebrow}>System</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Email Template Keys</h1>
            <p className={ui.muted}>Browse central email template mappings, supported variables, and integration coverage.</p>
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search keys, modules, or triggers..." />
            <select className={ui.input} value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
              <option value="all">All Modules</option>
              {(catalog?.modules || []).map((module) => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
            <select className={ui.input} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              {(catalog?.types || []).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.tableHead}>Module</th>
                  <th className={ui.tableHead}>Template Key</th>
                  <th className={ui.tableHead}>Type</th>
                  <th className={ui.tableHead}>Trigger</th>
                  <th className={ui.tableHead}>Variables</th>
                  <th className={ui.tableHead}>Attachments</th>
                  <th className={ui.tableHead}>Status</th>
                </tr>
              </thead>
              <tbody>
                {templateList.length ? (
                  templateList.map((template) => (
                    <tr key={template.key}>
                      <td className={ui.tableCell}>{template.module}</td>
                      <td className={ui.tableCell}>{template.key}</td>
                      <td className={ui.tableCell}>{template.type}</td>
                      <td className={ui.tableCell}>{template.trigger || "-"}</td>
                      <td className={ui.tableCell}>
                        <div className="max-w-sm truncate text-sm text-slate-500">
                          {(template.placeholders || []).join(", ")}
                        </div>
                      </td>
                      <td className={ui.tableCell}>
                        <span className={cn(ui.pill, template.supportsAttachments ? ui.pillPrimary : ui.pillGray)}>
                          {template.supportsAttachments ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className={ui.tableCell}>
                        <span className={cn(ui.pill, template.status?.exists ? (template.status.isActive ? ui.pillSuccess : ui.pillWarning) : ui.pillGray)}>
                          {template.status?.exists ? (template.status.isActive ? "Active" : "Inactive") : "Not created"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">No email template keys found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
