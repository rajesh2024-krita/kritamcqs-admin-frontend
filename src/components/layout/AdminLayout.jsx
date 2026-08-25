import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Search, ChevronDown, Sparkles, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { contactService } from "../../api/contactService";
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
  { label: "List Styles", to: "/list-styles", section: "Catalog", icon: FileStackIcon, moduleKey: "list-styles" },
  { label: "Questions", to: "/questions", section: "Content", icon: TagIcon, moduleKey: "questions" },
  { label: "Mock Tests", to: "/mock-tests", section: "Content", icon: OverviewIcon, moduleKey: "mock-tests" },
  { label: "Subject Mock Tests", to: "/subject-mock-tests", section: "Content", icon: OverviewIcon, moduleKey: "subject-mock-tests" },
  { label: "National Competitions", to: "/national-competitions", section: "Content", icon: ShieldIcon, moduleKey: "national-competitions" },
  { label: "Free Mock Tests", to: "/free-mock-tests", section: "Content", icon: OverviewIcon, moduleKey: "free-mock-tests" },
  { label: "Free Questions", to: "/free-questions", section: "Content", icon: BookIcon, moduleKey: "free-questions" },
  { label: "Daily Test Management", to: "/daily-test-management", section: "Operations", icon: DashboardIcon, moduleKey: "daily-test-management" },
  { label: "Weak Area Management", to: "/weak-area-management", section: "Operations", icon: OverviewIcon, moduleKey: "weak-area-management" },
  { label: "Mistake Management", to: "/mistake-management", section: "Operations", icon: HelpIcon, moduleKey: "mistake-management" },
  { label: "Revision Management", to: "/revision-management", section: "Operations", icon: DashboardIcon, moduleKey: "revision-management" },
  { label: "Users", to: "/users", section: "Operations", icon: UsersIcon, moduleKey: "users" },
  { label: "User Management", to: "/user-management", section: "Operations", icon: UsersIcon, moduleKey: "user-management" },
  { label: "Follow-Ups", to: "/follow-ups", section: "Operations", icon: Bell, moduleKey: "follow-ups" },
  { label: "Subscriptions", to: "/subscriptions", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscriptions" },
  { label: "Plan Config", to: "/subscription-plans", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscription-plans" },
  { label: "Free User Cards", to: "/subscription-free-cards", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscription-free-cards" },
  { label: "Subscription Stats", to: "/subscription-stat-cards", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscription-stat-cards" },
  { label: "Page Builder", to: "/subscription-page-builder", section: "Operations", icon: SubscriptionIcon, moduleKey: "subscription-page-builder" },
  { label: "Dashboard Carousel", to: "/dashboard-carousel", section: "Operations", icon: OverviewIcon, moduleKey: "dashboard-carousel" },
  { label: "App CTA Cards", to: "/app-cta-cards", section: "Operations", icon: TagIcon, mainOnly: true },
  { label: "Analytics", to: "/app-usage", section: "Operations", icon: DashboardIcon, moduleKey: "app-usage" },
  { label: "Offer Timer Management", to: "/offer-timer-management", section: "Operations", icon: TagIcon, mainOnly: true },
  { label: "Website Content", to: "/website-content", section: "Operations", icon: SettingsIcon, mainOnly: true },
  { label: "Policy Management", to: "/policy-pages", section: "Website CMS", icon: FileStackIcon, moduleKey: "policy-pages" },
  { label: "CMS Pages", to: "/cms-pages", section: "Website CMS", icon: FileStackIcon, moduleKey: "cms-pages" },
  { label: "CMS Menus", to: "/cms-menus", section: "Website CMS", icon: MenuIcon, moduleKey: "cms-menu-items" },
  { label: "Website Settings", to: "/website-settings-builder", section: "Website CMS", icon: SettingsIcon, moduleKey: "website-settings" },
  { label: "Payment Gateway", to: "/payment-gateway", section: "Operations", icon: ShieldIcon, moduleKey: "payment-gateway" },
  { label: "Invoices", to: "/invoices", section: "Operations", icon: FileStackIcon, moduleKey: "invoices" },
  { label: "Notifications", to: "/notifications", section: "Operations", icon: HelpIcon, moduleKey: "notifications" },
  { label: "Notification Center", to: "/notification-center", section: "Operations", icon: Bell, moduleKey: "notification-center" },
  { label: "Notification Management", to: "/notification-management", section: "Operations", icon: Bell, mainOnly: true },
  { label: "CTA Management", to: "/cta-management", section: "Operations", icon: TagIcon, mainOnly: true },
  { label: "Contact Messages", to: "/contact-messages", section: "Operations", icon: MailIcon, moduleKey: "contact-messages" },
  { label: "Help Desk", to: "/support-tickets", section: "Operations", icon: HelpIcon, moduleKey: "support-tickets" },
  { label: "Coupons", to: "/coupons", section: "Operations", icon: TagIcon, moduleKey: "coupons" },
  { label: "Session", to: "/sessions", section: "Operations", icon: DashboardIcon, moduleKey: "sessions" },
  { label: "Employees", to: "/employees", section: "Security", icon: UsersIcon, mainOnly: true },
  { label: "Audit Logs", to: "/audit-logs", section: "Security", icon: ShieldIcon, mainOnly: true },
  { label: "AI Configuration", to: "/ai-configuration", section: "System", icon: SettingsIcon, mainOnly: true },
  { label: "Settings", to: "/settings", section: "System", icon: SettingsIcon, moduleKey: "settings" },
  { label: "Microsoft Clarity", to: "/microsoft-clarity", section: "System", icon: SettingsIcon, mainOnly: true },
  { label: "Third Party Scripts", to: "/third-party-scripts", section: "System", icon: SettingsIcon, mainOnly: true },
  { label: "Auth Settings", to: "/auth-settings", section: "System", icon: ShieldIcon, moduleKey: "auth-settings" },
  { label: "Email Templates", to: "/email-templates", section: "System", icon: MailIcon, moduleKey: "email-templates" },
  { label: "Email Template Keys", to: "/email-template-keys", section: "System", icon: MailIcon, moduleKey: "email-template-keys" },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadContacts, setUnreadContacts] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const previousUnreadRef = useRef(null);
  const location = useLocation();
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const isEmployee = isEmployeeAdmin(admin);
  const visibleNavItems = navItems.filter((item) => {
    if (!isEmployee) return true;
    if (item.mainOnly) return false;
    return item.moduleKey && canViewModule(admin, item.moduleKey);
  });

  // Filter nav items based on search
  const filteredNavItems = searchQuery
    ? visibleNavItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleNavItems;

  const currentNav = visibleNavItems.find(({ to }) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)));
  const pageTitle = currentNav?.label || "Dashboard";
  
  const sectionedNav = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function playNotificationSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
    window.setTimeout(() => void audioContext.close().catch(() => undefined), 400);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const response = await contactService.unreadCount();
        const nextCount = Number(response.data?.count || 0);
        if (cancelled) return;
        const previous = previousUnreadRef.current;
        setUnreadContacts(nextCount);
        if (previous !== null && nextCount > previous) {
          try {
            playNotificationSound();
          } catch {
            // Some browsers require a user gesture before audio can play.
          }
        }
        previousUnreadRef.current = nextCount;
      } catch {
        // Keep the header quiet if the inbox count cannot be fetched.
      }
    }

    void loadUnreadCount();
    const id = window.setInterval(loadUnreadCount, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-200/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`} 
        onClick={() => setMenuOpen(false)} 
      />

      <div className="relative z-10">
        {/* Sidebar - Modern Glass Design */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl shadow-slate-200/50 transition-all duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl px-5 py-4 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl border-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <img 
                      src="https://kritatechnosolutions.com/crm/uploads/company/favicon.png" 
                      alt="logo" 
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Krita Admin</h1>
                  <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Control Center</p>
                </div>
              </div>
              <button 
                onClick={() => setMenuOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Search in Sidebar */}
          <div className="px-4 py-3 border-b border-slate-200/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {Object.entries(sectionedNav).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No results found
              </div>
            ) : (
              Object.entries(sectionedNav).map(([section, items]) => (
                <div key={section} className="space-y-2">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                    <span>{section}</span>
                    <span className="flex-1 h-px bg-slate-200/50" />
                    <span className="text-[9px] font-medium text-slate-300">{items.length}</span>
                  </div>
                  {items.map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                          isActive 
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm shadow-indigo-500/10" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                          )}
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                            isActive 
                              ? "bg-indigo-100 text-indigo-600 shadow-sm shadow-indigo-200" 
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                          )}>
                            <Icon size={15} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={cn(
                              "text-sm font-medium transition-colors",
                              isActive ? "text-indigo-700" : "text-slate-700 group-hover:text-slate-900"
                            )}>
                              {label}
                            </span>
                          </span>
                          {isActive && (
                            <Sparkles size={12} className="text-indigo-400" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/50 px-4 py-3">
            <button 
              className={cn(
                ui.buttonBase, 
                "w-full justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 transition-all duration-300"
              )} 
              onClick={() => void logout()}
            >
              <LogoutIcon size={16} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-[280px] min-h-screen">
          {/* Header - Modern Glass */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <button 
                  className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  onClick={() => setMenuOpen(true)}
                >
                  <MenuIcon size={20} className="text-slate-700" />
                </button>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100/50">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">
                        {currentNav?.section || "Overview"}
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Search Button - Desktop */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <Search size={16} className="text-slate-400 group-hover:text-slate-600" />
                  <span className="text-sm text-slate-400">Search...</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded text-slate-400">
                    ⌘K
                  </kbd>
                </button>

                {/* Notification Bell */}
                <NavLink
                  to="/contact-messages"
                  className={({ isActive }) =>
                    `relative p-2.5 rounded-xl border transition-all duration-200 ${
                      isActive 
                        ? "border-indigo-200 bg-indigo-50 text-indigo-600" 
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    }`
                  }
                  aria-label="Contact message notifications"
                  title="Contact message notifications"
                >
                  <Bell size={18} />
                  {unreadContacts > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-1.5 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-rose-500/25 animate-bounce">
                      {unreadContacts > 99 ? "99+" : unreadContacts}
                    </span>
                  )}
                </NavLink>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/25">
                      {(admin?.name || "A").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-slate-900">{admin?.name || "Administrator"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        {admin?.email || admin?.mobile || "Admin access"}
                      </div>
                    </div>
                    <ChevronDown size={14} className={cn(
                      "text-slate-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-sm font-medium text-slate-900">{admin?.name || "Administrator"}</div>
                        <div className="text-xs text-slate-400 truncate">{admin?.email || admin?.mobile}</div>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          void logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogoutIcon size={16} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Search Modal */}
        {searchOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200"
            onClick={() => setSearchOpen(false)}
          >
            <div 
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-top-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for anything..."
                  className="w-full pl-14 pr-12 py-4 text-lg bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              {searchQuery && (
                <div className="border-t border-slate-100 max-h-[400px] overflow-y-auto p-2">
                  {visibleNavItems
                    .filter(item => 
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.section.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 8)
                    .map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                          <item.icon size={16} />
                        </span>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{item.label}</div>
                          <div className="text-xs text-slate-400">{item.section}</div>
                        </div>
                      </NavLink>
                    ))}
                  {visibleNavItems.filter(item => 
                    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.section.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <ToastViewport />
      </div>
    </div>
  );
}
