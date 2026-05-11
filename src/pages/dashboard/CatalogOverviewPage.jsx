import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { dashboardService } from "../../api/dashboardService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { ui } from "../../ui";
import { formatCompactNumber } from "../../utils/format";

const modules = [
  { key: "modes", label: "Modes", route: "/modes", description: "Manage NEET, JEE, and BOTH mode setup." },
  { key: "examTypes", label: "Exam Types", route: "/exam-types", description: "Manage the NEET and JEE exam type master." },
  { key: "subjects", label: "Subjects", route: "/subjects", description: "Control subject hierarchy per exam type." },
  { key: "chapters", label: "Chapters", route: "/chapters", description: "Maintain chapter-level learning buckets." },
  { key: "years", label: "Years", route: "/years", description: "Manage year-based question filtering." },
  { key: "questionTypes", label: "Question Types", route: "/question-types", description: "Define supported response/question types." },
];

export function CatalogOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await dashboardService.getCatalog();
        setData(response.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading catalog overview..." />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Catalog Command Center</div>
            <p className="text-slate-500">
              The complete admin entry point for syllabus structure, question bank configuration, and academic flow setup.
            </p>
          </div>
          <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700" title={String(data.questions ?? 0)}>Questions: {formatCompactNumber(data.questions)}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.key} to={module.route} className="rounded-sm border border-slate-200/80 bg-white/85 p-5 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
            <div className={ui.metricTop}>
              <span className={ui.metricLabel}>{module.label}</span>
              <span className={ui.metricDot} />
            </div>
            <h2 className={ui.metricValue} title={String(data[module.key] ?? 0)}>{formatCompactNumber(data[module.key])}</h2>
            <p className="mt-3 text-slate-500">{module.description}</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Module</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
