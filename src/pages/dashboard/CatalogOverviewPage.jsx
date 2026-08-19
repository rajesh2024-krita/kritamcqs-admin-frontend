import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Layers, 
  FileText, 
  BookOpen, 
  Library, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Zap,
  Grid,
  List
} from "lucide-react";
import { dashboardService } from "../../api/dashboardService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { formatCompactNumber } from "../../utils/format";

const modules = [
  { 
    key: "modes", 
    label: "Modes", 
    route: "/modes", 
    description: "Manage NEET, JEE, and BOTH mode setup.",
    icon: Layers,
    color: "blue"
  },
  { 
    key: "examTypes", 
    label: "Exam Types", 
    route: "/exam-types", 
    description: "Manage the NEET and JEE exam type master.",
    icon: FileText,
    color: "purple"
  },
  { 
    key: "subjects", 
    label: "Subjects", 
    route: "/subjects", 
    description: "Control subject hierarchy per exam type.",
    icon: BookOpen,
    color: "emerald"
  },
  { 
    key: "chapters", 
    label: "Chapters", 
    route: "/chapters", 
    description: "Maintain chapter-level learning buckets.",
    icon: Library,
    color: "amber"
  },
  { 
    key: "years", 
    label: "Years", 
    route: "/years", 
    description: "Manage year-based question filtering.",
    icon: Calendar,
    color: "rose"
  },
  { 
    key: "questionTypes", 
    label: "Question Types", 
    route: "/question-types", 
    description: "Define supported response/question types.",
    icon: HelpCircle,
    color: "indigo"
  },
];

export function CatalogOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

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

  const totalItems = modules.reduce((acc, module) => acc + (data[module.key] || 0), 0);

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      purple: "bg-purple-50 text-purple-600 border-purple-100",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      rose: "bg-rose-50 text-rose-600 border-rose-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
    return colors[color] || colors.blue;
  };

  const getIconBg = (color) => {
    const colors = {
      blue: "bg-blue-100",
      purple: "bg-purple-100",
      emerald: "bg-emerald-100",
      amber: "bg-amber-100",
      rose: "bg-rose-100",
      indigo: "bg-indigo-100",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <Grid size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Catalog Overview</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Complete admin entry point for syllabus structure and question bank configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
              <Zap size={14} className="text-indigo-600" />
              <span className="text-xs font-medium text-indigo-700">
                Total: {formatCompactNumber(totalItems)}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-slate-700' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-slate-700' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {modules.map((module) => (
          <div key={module.key} className="bg-white rounded-lg border border-slate-200/60 px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${getIconBg(module.color)}`}>
                <module.icon size={12} className={getColorClasses(module.color).split(' ')[1]} />
              </div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
                {module.label}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCompactNumber(data[module.key] || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const value = data[module.key] || 0;
            return (
              <Link
                key={module.key}
                to={module.route}
                className="group bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIconBg(module.color)}`}>
                      <Icon size={16} className={getColorClasses(module.color).split(' ')[1]} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{module.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{formatCompactNumber(value)}</span>
                    <ArrowRight 
                      size={14} 
                      className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" 
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        value > 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-200'
                      }`}
                      style={{ 
                        width: totalItems > 0 ? `${(value / totalItems) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    {totalItems > 0 ? Math.round((value / totalItems) * 100) : 0}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const value = data[module.key] || 0;
            return (
              <Link
                key={module.key}
                to={module.route}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group ${
                  index !== modules.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${getIconBg(module.color)}`}>
                    <Icon size={16} className={getColorClasses(module.color).split(' ')[1]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{module.label}</h3>
                    <p className="text-xs text-slate-500 truncate">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCompactNumber(value)}</p>
                    <span className="text-[10px] text-slate-400">
                      {totalItems > 0 ? Math.round((value / totalItems) * 100) : 0}%
                    </span>
                  </div>
                  <ArrowRight 
                    size={16} 
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" 
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-indigo-600" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Need to add more content?</h4>
              <p className="text-xs text-slate-600">Manage your catalog structure from any module above</p>
            </div>
          </div>
          <Link 
            to="/questions" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-500/25"
          >
            Go to Questions
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}