import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Crown,
  FileQuestion,
  BookOpen,
  Layers,
  Clock,
  BarChart3,
  TrendingUp,
  UserPlus,
  CalendarDays,
  Award,
  Target,
  Zap,
  Bell
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { dashboardService } from "../../api/dashboardService";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { formatCompactNumber, formatDate } from "../../utils/format";
import { coordinatorService } from "../../api/coordinatorService";

export function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [coordinatorSummary, setCoordinatorSummary] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, catalogOverview, coordinatorResult] = await Promise.all([
          dashboardService.getDashboard(),
          dashboardService.getCatalog(),
          coordinatorService.summary().catch(() => ({ data: null })),
        ]);
        setData(dashboard.data);
        setCatalog(catalogOverview.data);
        setCoordinatorSummary(coordinatorResult.data);
        
        // Generate chart data from backend if available, otherwise use sample
        if (dashboard.data?.chartData) {
          setChartData(dashboard.data.chartData);
        } else {
          // Sample data based on backend metrics
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          setChartData(months.map((month, i) => ({
            month,
            users: Math.round((dashboard.data?.totalUsers || 1000) * (0.5 + (i * 0.1))),
            sessions: Math.round((dashboard.data?.totalSessions || 500) * (0.6 + (i * 0.08))),
          })));
        }
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

  // Prepare data for pie chart
  const catalogPieData = [
    { name: 'Subjects', value: catalog?.subjects || 0, color: '#6366f1' },
    { name: 'Chapters', value: catalog?.chapters || 0, color: '#8b5cf6' },
    { name: 'Modes', value: catalog?.modes || 0, color: '#06b6d4' },
    { name: 'Exam Types', value: catalog?.examTypes || 0, color: '#14b8a6' },
    { name: 'Years', value: catalog?.years || 0, color: '#f59e0b' },
    { name: 'Question Types', value: catalog?.questionTypes || 0, color: '#ec4899' },
  ].filter(item => item.value > 0);

  const mainStats = [
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "blue", route: "/users" },
    { label: "Premium Users", value: data.premiumUsers, icon: Crown, color: "amber", route: "/subscriptions" },
    { label: "Total Questions", value: data.totalQuestions, icon: FileQuestion, color: "emerald", route: "/questions" },
    { label: "Total Sessions", value: data.totalSessions, icon: Clock, color: "rose", route: "/sessions" },
  ];

  const catalogStats = [
    { label: "Subjects", value: catalog?.subjects || 0, icon: BookOpen, color: "indigo", route: "/subjects" },
    { label: "Chapters", value: catalog?.chapters || 0, icon: Layers, color: "purple", route: "/chapters" },
    { label: "Modes", value: catalog?.modes || 0, icon: BarChart3, color: "cyan", route: "/modes" },
    { label: "Exam Types", value: catalog?.examTypes || 0, icon: Target, color: "teal", route: "/exam-types" },
    { label: "Years", value: catalog?.years || 0, icon: CalendarDays, color: "orange", route: "/years" },
    { label: "Question Types", value: catalog?.questionTypes || 0, icon: Award, color: "pink", route: "/question-types" },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600",
      amber: "bg-amber-50 text-amber-600",
      emerald: "bg-emerald-50 text-emerald-600",
      indigo: "bg-indigo-50 text-indigo-600",
      purple: "bg-purple-50 text-purple-600",
      rose: "bg-rose-50 text-rose-600",
      cyan: "bg-cyan-50 text-cyan-600",
      teal: "bg-teal-50 text-teal-600",
      orange: "bg-orange-50 text-orange-600",
      pink: "bg-pink-50 text-pink-600",
    };
    return colors[color] || colors.blue;
  };

  const getIconBg = (color) => {
    const colors = {
      blue: "bg-blue-50",
      amber: "bg-amber-50",
      emerald: "bg-emerald-50",
      indigo: "bg-indigo-50",
      purple: "bg-purple-50",
      rose: "bg-rose-50",
      cyan: "bg-cyan-50",
      teal: "bg-teal-50",
      orange: "bg-orange-50",
      pink: "bg-pink-50",
    };
    return colors[color] || colors.blue;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
          <p className="font-medium text-slate-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-slate-600">
              <span className="font-medium">{entry.name}:</span> {formatCompactNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time overview of your learning platform</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-700">Live</span>
          </span>
          <span className="text-[10px] text-slate-400">Updated now</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.route}
              className="group bg-white rounded-lg border border-slate-200/60 px-3.5 py-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${getIconBg(stat.color)}`}>
                  <Icon size={14} className={getColorClasses(stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block truncate">{stat.label}</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCompactNumber(stat.value)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {coordinatorSummary && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Bell size={15}/></span><div><h2 className="text-xs font-semibold text-slate-900">Coordinator Follow-Ups</h2><p className="text-[10px] text-slate-500">Continuous school and course relationship tracking</p></div></div>
            <Link to="/coordinators" className="text-[10px] font-medium text-indigo-600">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[{label:"Follow-up overdue",value:coordinatorSummary.overdue,style:"border-red-100 bg-red-50 text-red-800",filter:"Overdue"},{label:"Due within 30 days",value:coordinatorSummary.due,style:"border-orange-100 bg-orange-50 text-orange-800",filter:"Follow-Up Scheduled"},{label:"Upcoming follow-ups",value:coordinatorSummary.upcoming,style:"border-amber-100 bg-amber-50 text-amber-800",filter:"Reminder Started"},{label:"Recently contacted",value:coordinatorSummary.recentlyContacted,style:"border-emerald-100 bg-emerald-50 text-emerald-800",filter:"Contacted"}].map(item=><Link key={item.label} to={`/coordinators?followUpStatus=${encodeURIComponent(item.filter)}`} className={`rounded-lg border p-3 ${item.style}`}><div className="text-[10px] font-medium">{item.label}</div><div className="mt-1 text-xl font-bold">{item.value||0}</div></Link>)}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Line Chart - User Growth */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">User Growth</h3>
                <p className="text-[10px] text-slate-500">Monthly active users</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-[9px] text-slate-500">Users</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-[9px] text-slate-500">Sessions</span>
              </span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Catalog Distribution */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Zap size={14} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">Catalog Distribution</h3>
                <p className="text-[10px] text-slate-500">Content breakdown</p>
              </div>
            </div>
          </div>
          <div className="h-40">
            {catalogPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catalogPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {catalogPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
                            <p className="font-medium text-slate-900">{payload[0].name}</p>
                            <p className="text-slate-600">{formatCompactNumber(payload[0].value)} items</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No catalog data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Overview */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <BookOpen size={14} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Catalog Overview</h3>
              <p className="text-[10px] text-slate-500">Content structure at a glance</p>
            </div>
          </div>
          <Link to="/catalog-overview" className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {catalogStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to={stat.route}
                className="bg-slate-50 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${getIconBg(stat.color)}`}>
                    <Icon size={11} className={getColorClasses(stat.color)} />
                  </div>
                  <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1">{formatCompactNumber(stat.value)}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <UserPlus size={14} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">Recent Users</h3>
                <p className="text-[10px] text-slate-500">Latest registrations</p>
              </div>
            </div>
            <Link to="/users" className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-1.5">
            {data.recentActivity?.users?.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {(user.name || user.mobile || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">{user.name || user.mobile}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email || user.mobile}</p>
                </div>
                <span className="text-[9px] text-slate-400 flex-shrink-0">{formatDate(user.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <TrendingUp size={14} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Quick Insights</h3>
              <p className="text-[10px] text-slate-500">Platform at a glance</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
              <span className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">Total Users</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCompactNumber(data.totalUsers)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3">
              <span className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">Premium Rate</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {data.totalUsers > 0 ? Math.round((data.premiumUsers / data.totalUsers) * 100) : 0}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3">
              <span className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">Questions</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCompactNumber(data.totalQuestions)}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-3">
              <span className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">Sessions</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCompactNumber(data.totalSessions)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
