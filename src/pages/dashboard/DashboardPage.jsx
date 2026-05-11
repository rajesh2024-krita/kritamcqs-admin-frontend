import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../api/dashboardService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { ui } from "../../ui";
import { formatCompactNumber, formatDate } from "../../utils/format";

export function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, catalogOverview] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getCatalog(),
        ]);
        setData(dashboard.data);
        setCatalog(catalogOverview.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (!data) return null;

  const stats = [
    ["Total Users", data.totalUsers, "Learner accounts across the platform", "/users"],
    ["Premium Users", data.premiumUsers, "Active paid learners", "/users"],
    ["Total Questions", data.totalQuestions, "Question bank coverage", "/questions"],
    ["Total Subjects", data.totalSubjects, "Catalog subjects configured", "/subjects"],
    ["Total Chapters", data.totalChapters, "Chapters available for practice", "/chapters"],
    ["Total Sessions", data.totalSessions, "Tracked learning sessions", "/sessions"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 rounded-sm border border-white/60 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <div className={ui.eyebrow}>Executive Console</div>
          <h2 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">Operations overview for the Krita learning platform</h2>
          <p className="max-w-xl text-base text-slate-600">Monitor learner growth, catalog readiness, and academic operations from a more professional control room layout.</p>
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-sm bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
          <div className="inline-flex items-center rounded-sm bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Live Admin Workspace</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm bg-white/10 p-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">Questions</span>
              <strong className="mt-2 block text-3xl font-bold">{formatCompactNumber(data.totalQuestions)}</strong>
            </div>
            <div className="rounded-sm bg-white/10 p-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">Premium</span>
              <strong className="mt-2 block text-3xl font-bold">{formatCompactNumber(data.premiumUsers)}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map(([label, value, hint, route]) => (
          <Link key={label} to={route} className={ui.metricCard} title={String(value ?? 0)}>
            <div className={ui.metricTop}>
              <span className={ui.metricLabel}>{label}</span>
              <span className={ui.metricDot} />
            </div>
            <h2 className={ui.metricValue}>{formatCompactNumber(value)}</h2>
            <div className={ui.muted}>{hint}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Catalog Overview</h3>
              <p className={ui.muted}>Quick visibility into the academic content structure.</p>
            </div>
            <div className={ui.badge}>Structure</div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link to="/modes" className={ui.tile} title={String(catalog?.modes ?? 0)}><span className={ui.metricLabel}>Modes</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{formatCompactNumber(catalog?.modes)}</strong><small className="mt-2 block text-sm text-slate-500">Preparation paths</small></Link>
            <Link to="/exam-types" className={ui.tile} title={String(catalog?.examTypes ?? 0)}><span className={ui.metricLabel}>Exam Types</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{formatCompactNumber(catalog?.examTypes)}</strong><small className="mt-2 block text-sm text-slate-500">Core exam taxonomy</small></Link>
            <Link to="/years" className={ui.tile} title={String(catalog?.years ?? 0)}><span className={ui.metricLabel}>Years</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{formatCompactNumber(catalog?.years)}</strong><small className="mt-2 block text-sm text-slate-500">Past paper archive</small></Link>
            <Link to="/question-types" className={ui.tile} title={String(catalog?.questionTypes ?? 0)}><span className={ui.metricLabel}>Question Types</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{formatCompactNumber(catalog?.questionTypes)}</strong><small className="mt-2 block text-sm text-slate-500">Assessment patterns</small></Link>
          </div>
        </div>

        <div className={ui.panel}>
          <div className={ui.sectionHead}>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Recent Users</h3>
              <p className={ui.muted}>Latest registrations and admin-visible user activity.</p>
            </div>
            <div className={ui.badge}>People</div>
          </div>
          <div className={ui.activityList}>
            {data.recentActivity.users.map((user) => (
              <div key={user.id} className={ui.activityItem}>
                <div className={ui.activityAvatar}>{(user.name || user.mobile || "U").slice(0, 1).toUpperCase()}</div>
                <div className={ui.activityBody}>
                  <strong className="block truncate text-sm font-bold text-slate-900">{user.name || user.mobile}</strong>
                  <div className={ui.muted}>{user.email || user.mobile}</div>
                </div>
                <div className={ui.activityTime}>{formatDate(user.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Quick Admin Flow</h3>
            <p className={ui.muted}>Use the app-plan flow as a simple admin operating path.</p>
          </div>
          <div className={ui.badge}>Actions</div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link to="/catalog-overview" className={ui.moduleCard}>
            <div className={ui.metricTop}><span className={ui.metricLabel}>Catalog Setup</span><span className={ui.metricDot} /></div>
            <h2 className={ui.metricValue}>{formatCompactNumber(catalog?.subjects)}</h2>
            <p className={ui.muted}>Start with modes, subjects, chapters, years, and question types.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Catalog</span>
          </Link>
          <Link to="/questions" className={ui.moduleCard}>
            <div className={ui.metricTop}><span className={ui.metricLabel}>Question Bank</span><span className={ui.metricDot} /></div>
            <h2 className={ui.metricValue}>{formatCompactNumber(data.totalQuestions)}</h2>
            <p className={ui.muted}>Manage questions, difficulty, response type, and concept tags.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Questions</span>
          </Link>
          <Link to="/users" className={ui.moduleCard}>
            <div className={ui.metricTop}><span className={ui.metricLabel}>User Intelligence</span><span className={ui.metricDot} /></div>
            <h2 className={ui.metricValue}>{formatCompactNumber(data.totalUsers)}</h2>
            <p className={ui.muted}>Review reports, attendance, subscriptions, mistakes, and weak areas.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
