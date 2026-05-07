import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../api/dashboardService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { ui } from "../../ui";
import { formatDate } from "../../utils/format";

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
    ["Total Users", data.totalUsers, "Learner accounts across the platform"],
    ["Premium Users", data.premiumUsers, "Active paid learners"],
    ["Total Questions", data.totalQuestions, "Question bank coverage"],
    ["Total Subjects", data.totalSubjects, "Catalog subjects configured"],
    ["Total Chapters", data.totalChapters, "Chapters available for practice"],
    ["Total Sessions", data.totalSessions, "Tracked learning sessions"],
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
              <strong className="mt-2 block text-3xl font-bold">{data.totalQuestions ?? 0}</strong>
            </div>
            <div className="rounded-sm bg-white/10 p-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">Premium</span>
              <strong className="mt-2 block text-3xl font-bold">{data.premiumUsers ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map(([label, value, hint]) => (
          <div key={label} className={ui.metricCard}>
            <div className={ui.metricTop}>
              <span className={ui.metricLabel}>{label}</span>
              <span className={ui.metricDot} />
            </div>
            <h2 className={ui.metricValue}>{value}</h2>
            <div className={ui.muted}>{hint}</div>
          </div>
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
            <div className={ui.tile}><span className={ui.metricLabel}>Modes</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.modes ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Preparation paths</small></div>
            <div className={ui.tile}><span className={ui.metricLabel}>Exam Types</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.examTypes ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Core exam taxonomy</small></div>
            <div className={ui.tile}><span className={ui.metricLabel}>Subjects</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.subjects ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Mapped by exam type</small></div>
            <div className={ui.tile}><span className={ui.metricLabel}>Chapters</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.chapters ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Learning buckets</small></div>
            <div className={ui.tile}><span className={ui.metricLabel}>Years</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.years ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Past paper archive</small></div>
            <div className={ui.tile}><span className={ui.metricLabel}>Question Types</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{catalog?.questionTypes ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Assessment patterns</small></div>
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
            <h3 className="text-xl font-bold text-slate-900">User Data Command View</h3>
            <p className={ui.muted}>Global totals across reports, submissions, subscriptions, mistakes, and weak areas.</p>
          </div>
          <div className={ui.badge}>Signals</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className={ui.tile}><span className={ui.metricLabel}>Reports</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{data.userDataSummary?.totalReports ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Completed result sheets</small></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Submissions</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{data.userDataSummary?.totalSubmissions ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Question attempts captured</small></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Subscriptions</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{data.userDataSummary?.totalSubscriptions ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Revenue-linked records</small></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Mistakes</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{data.userDataSummary?.totalMistakes ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Tracked recovery pool</small></div>
          <div className={ui.tile}><span className={ui.metricLabel}>Weak Areas</span><strong className="mt-3 block text-3xl font-bold text-slate-900">{data.userDataSummary?.totalWeakAreas ?? 0}</strong><small className="mt-2 block text-sm text-slate-500">Low-confidence chapters</small></div>
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
            <h2 className={ui.metricValue}>{catalog?.subjects ?? 0}</h2>
            <p className={ui.muted}>Start with modes, subjects, chapters, years, and question types.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Catalog</span>
          </Link>
          <Link to="/questions" className={ui.moduleCard}>
            <div className={ui.metricTop}><span className={ui.metricLabel}>Question Bank</span><span className={ui.metricDot} /></div>
            <h2 className={ui.metricValue}>{data.totalQuestions ?? 0}</h2>
            <p className={ui.muted}>Manage questions, difficulty, response type, and concept tags.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Questions</span>
          </Link>
          <Link to="/users" className={ui.moduleCard}>
            <div className={ui.metricTop}><span className={ui.metricLabel}>User Intelligence</span><span className={ui.metricDot} /></div>
            <h2 className={ui.metricValue}>{data.totalUsers ?? 0}</h2>
            <p className={ui.muted}>Review reports, attendance, subscriptions, mistakes, and weak areas.</p>
            <span className="mt-4 inline-flex text-sm font-bold text-blue-700">Open Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
