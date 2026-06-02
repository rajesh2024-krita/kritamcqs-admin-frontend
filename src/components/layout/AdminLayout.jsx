import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ToastViewport } from "../common/ToastViewport";
import {
  BookIcon,
  DashboardIcon,
  FileStackIcon,
  HelpIcon,
  LayersIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  OverviewIcon,
  SettingsIcon,
  ShieldIcon,
  SubscriptionIcon,
  TagIcon,
  UsersIcon,
} from "../common/AdminIcons";
import { cn, ui } from "../../ui";
import { canViewModule, isEmployee as isEmployeeAdmin } from "../../config/adminPermissions";

const navItems = [
  { label: "Dashboard", to: "/", section: "Overview", icon: DashboardIcon, mainOnly: true },
  { label: "Catalog Overview", to: "/catalog-overview", section: "Overview", icon: OverviewIcon, moduleKey: "catalog-overview" },
  { label: "Modes", to: "/modes", section: "Catalog", icon: LayersIcon, moduleKey: "modes" },
  { label: "Learning Levels", to: "/learning-levels", section: "Catalog", icon: UsersIcon, moduleKey: "learning-levels" },
  { label: "Difficulties", to: "/difficulties", section: "Catalog", icon: TagIcon, moduleKey: "difficulties" },
  { label: "Exam Types", to: "/exam-types", section: "Catalog", icon: ShieldIcon, moduleKey: "exam-types" },
  { label: "Subjects", to: "/subjects", section: "Catalog", icon: BookIcon, moduleKey: "subjects" },
  { label: "Chapters", to: "/chapters", section: "Catalog", icon: FileStackIcon, moduleKey: "chapters" },
  { label: "Topics", to: "/topics", section: "Catalog", icon: TagIcon, moduleKey: "topics" },
  { label: "Years", to: "/years", section: "Catalog", icon: OverviewIcon, moduleKey: "years" },
  { label: "Question Types", to: "/question-types", section: "Catalog", icon: HelpIcon, moduleKey: "question-types" },
  { label: "AI Academic Audit", to: "/questions/katex-audit", section: "Content", icon: ShieldIcon, moduleKey: "katex-audit" },
  { label: "Questions", to: "/questions", section: "Content", icon: TagIcon, moduleKey: "questions" },
  // { label: "Daily Plans", to: "/daily-plans", section: "Content", icon: FileStackIcon },
  { label: "Mock Tests", to: "/mock-tests", section: "Content", icon: OverviewIcon, moduleKey: "mock-tests" },
  { label: "Free Mock Tests", to: "/free-mock-tests", section: "Content", icon: OverviewIcon, moduleKey: "free-mock-tests" },
  { label: "Free Questions", to: "/free-questions", section: "Content", icon: BookIcon, moduleKey: "free-questions" },
  { label: "Daily Test Management", to: "/daily-test-management", section: "Operations", icon: DashboardIcon, moduleKey: "daily-test-management" },
  { label: "Weak Area Management", to: "/weak-area-management", section: "Operations", icon: OverviewIcon, moduleKey: "weak-area-management" },
  { label: "Mistake Management", to: "/mistake-management", section: "Operations", icon: HelpIcon, moduleKey: "mistake-management" },
  { label: "Revision Management", to: "/revision-management", section: "Operations", icon: DashboardIcon, moduleKey: "revision-management" },
  { label: "Users", to: "/users", section: "Operations", icon: UsersIcon, moduleKey: "users" },
  { label: "Subscriptions", to: "/subscriptions", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscriptions" },
  { label: "Plan Config", to: "/subscription-plans", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscription-plans" },
  { label: "Payment Gateway", to: "/payment-gateway", section: "Operations", icon: ShieldIcon, moduleKey: "payment-gateway" },
  { label: "Invoices", to: "/invoices", section: "Operations", icon: FileStackIcon, moduleKey: "invoices" },
  { label: "Notifications", to: "/notifications", section: "Operations", icon: HelpIcon, moduleKey: "notifications" },
  { label: "Help Desk", to: "/support-tickets", section: "Operations", icon: HelpIcon, moduleKey: "support-tickets" },
  { label: "Coupons", to: "/coupons", section: "Operations", icon: TagIcon, moduleKey: "coupons" },
  { label: "Session", to: "/sessions", section: "Operations", icon: DashboardIcon, moduleKey: "sessions" },
  { label: "Employees", to: "/employees", section: "Security", icon: UsersIcon, mainOnly: true },
  { label: "Audit Logs", to: "/audit-logs", section: "Security", icon: ShieldIcon, mainOnly: true },
  { label: "AI Configuration", to: "/ai-configuration", section: "System", icon: SettingsIcon, mainOnly: true },
  { label: "Settings", to: "/settings", section: "System", icon: SettingsIcon, moduleKey: "settings" },
  { label: "Auth Settings", to: "/auth-settings", section: "System", icon: ShieldIcon, moduleKey: "auth-settings" },
  { label: "Email Templates", to: "/email-templates", section: "System", icon: MailIcon, moduleKey: "email-templates" },
  { label: "Email Template Keys", to: "/email-template-keys", section: "System", icon: MailIcon, moduleKey: "email-template-keys" },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isEmployee = isEmployeeAdmin(admin);
  const visibleNavItems = navItems.filter((item) => {
    if (!isEmployee) return true;
    if (item.mainOnly) return false;
    return item.moduleKey && canViewModule(admin, item.moduleKey);
  });
  const currentNav = visibleNavItems.find(({ to }) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)));
  const pageTitle = currentNav?.label || "Dashboard";
  const sectionedNav = visibleNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className={`fixed inset-0 z-30 bg-slate-950/35 transition lg:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMenuOpen(false)} />
      <div>
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[300px] max-w-[86vw] flex-col overflow-y-auto border-r border-slate-800 bg-slate-950 px-4 py-5 text-slate-100 shadow-2xl transition duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-base font-black text-white shadow-lg shadow-sky-950/30">KA</div>
            <div className="min-w-0">
              <h2 className="m-0 text-xl font-black tracking-tight text-white">Krita Admin</h2>
              <p className="mt-1 text-xs text-slate-400">Control workspace</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 shadow-inner">
            <span className="mb-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">{isEmployee ? "Employee" : "Workspace"}</span>
            <strong className="block text-base font-bold text-white">{admin?.name || "Administrator"}</strong>
            <p className="mt-1 text-sm text-slate-300">{admin?.email || admin?.mobile || "Admin access enabled"}</p>
          </div>

          <nav className="mt-5 flex-1 space-y-5 pr-1">
            {Object.entries(sectionedNav).map(([section, items]) => (
              <div key={section} className="space-y-2">
                <div className="px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{section}</div>
                {items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-200 ${isActive ? "border-sky-400/30 bg-sky-500/15 text-white shadow-lg shadow-sky-950/20" : "border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-white"}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-100"><Icon size={18} /></span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold">{label}</span>
                      <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">{section}</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="mt-6">
            <button className={cn(ui.buttonBase, ui.buttonGhost, "w-full justify-center")} onClick={() => void logout()}>
              <LogoutIcon size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="px-4 py-4 lg:ml-[300px] lg:px-8 lg:py-6">
          <header className="admin-surface sticky top-4 z-20 mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-1 items-center gap-3">
              <button className={cn(ui.buttonBase, ui.buttonGhost, "lg:hidden")} onClick={() => setMenuOpen((current) => !current)}>
                <MenuIcon size={16} />
                Menu
              </button>
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">{currentNav?.section || "Admin Workspace"}</div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex flex-wrap justify-start gap-3 sm:justify-end">
              <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Live Workspace</div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">{(admin?.name || "A").slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{admin?.name || "Administrator"}</div>
                  <div className="text-xs text-slate-500">{admin?.email || admin?.mobile || "Admin access"}</div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-6">
            <Outlet />
          </div>
        </main>
        <ToastViewport />
      </div>
    </div>
  );
}
