export const MODULES = [
  { key: "catalog-overview", label: "Catalog Overview", path: "/catalog-overview" },
  { key: "modes", label: "Modes", path: "/modes" },
  { key: "learning-levels", label: "Learning Levels", path: "/learning-levels" },
  { key: "difficulties", label: "Difficulties", path: "/difficulties" },
  { key: "exam-types", label: "Exam Types", path: "/exam-types" },
  { key: "subjects", label: "Subjects", path: "/subjects" },
  { key: "chapters", label: "Chapters", path: "/chapters" },
  { key: "topics", label: "Topics", path: "/topics" },
  { key: "years", label: "Years", path: "/years" },
  { key: "question-types", label: "Question Types", path: "/question-types" },
  { key: "list-styles", label: "List Styles", path: "/list-styles" },
  { key: "questions", label: "Questions", path: "/questions", extraActions: [{ key: "bulkUpload", label: "Bulk Upload" }] },
  { key: "katex-audit", label: "AI Academic Audit", path: "/questions/katex-audit" },
  { key: "mock-tests", label: "Mock Tests", path: "/mock-tests" },
  { key: "free-mock-tests", label: "Free Mock Tests", path: "/free-mock-tests" },
  { key: "free-questions", label: "Free Questions", path: "/free-questions" },
  { key: "daily-test-management", label: "Daily Test Management", path: "/daily-test-management" },
  { key: "weak-area-management", label: "Weak Area Management", path: "/weak-area-management" },
  { key: "mistake-management", label: "Mistake Management", path: "/mistake-management" },
  { key: "revision-management", label: "Revision Management", path: "/revision-management" },
  { key: "users", label: "Users", path: "/users" },
  { key: "subscriptions", label: "Subscriptions", path: "/subscriptions" },
  { key: "subscription-plans", label: "Plan Config", path: "/subscription-plans" },
  { key: "subscription-free-cards", label: "Free User Cards", path: "/subscription-free-cards" },
  { key: "subscription-stat-cards", label: "Subscription Stats", path: "/subscription-stat-cards" },
  { key: "payment-gateway", label: "Payment Gateway", path: "/payment-gateway" },
  { key: "invoices", label: "Invoices", path: "/invoices" },
  { key: "notifications", label: "Notifications", path: "/notifications" },
  { key: "contact-messages", label: "Contact Messages", path: "/contact-messages" },
  { key: "support-tickets", label: "Help Desk", path: "/support-tickets" },
  { key: "coupons", label: "Coupons", path: "/coupons" },
  { key: "sessions", label: "Session", path: "/sessions" },
  { key: "settings", label: "Settings", path: "/settings" },
  { key: "auth-settings", label: "Auth Settings", path: "/auth-settings" },
  { key: "email-templates", label: "Email Templates", path: "/email-templates" },
  { key: "email-template-keys", label: "Email Template Keys", path: "/email-template-keys" },
];

export function isEmployee(admin) {
  return admin?.adminRole === "employee";
}

export function getModulePermission(admin, moduleKey) {
  if (!isEmployee(admin)) return { view: true, create: true, edit: true, delete: true, bulkUpload: true };
  const permission = admin?.modulePermissions?.[moduleKey] || {};
  if (moduleKey === "questions") {
    const legacy = admin?.employeePermissions || {};
    return {
      view: Boolean(permission.view || legacy.viewQuestions),
      create: Boolean(permission.create || legacy.createQuestions || legacy.createManualQuestions),
      edit: Boolean(permission.edit || legacy.editQuestions),
      delete: Boolean(permission.delete || legacy.deleteQuestions),
      bulkUpload: Boolean(permission.bulkUpload || legacy.bulkUploadQuestions),
    };
  }
  return {
    view: Boolean(permission.view),
    create: Boolean(permission.create),
    edit: Boolean(permission.edit),
    delete: Boolean(permission.delete),
    bulkUpload: Boolean(permission.bulkUpload),
  };
}

export function canViewModule(admin, moduleKey) {
  return getModulePermission(admin, moduleKey).view === true;
}

export function firstAllowedModulePath(admin) {
  if (!isEmployee(admin)) return "/";
  return MODULES.find((module) => canViewModule(admin, module.key))?.path || "";
}
