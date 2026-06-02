import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { CatalogOverviewPage } from "../pages/dashboard/CatalogOverviewPage";
import { ExamTypesPage } from "../pages/examTypes/ExamTypesPage";
import { ModesPage } from "../pages/modes/ModesPage";
import { LearningLevelsPage } from "../pages/learningLevels/LearningLevelsPage";
import { SubjectsPage } from "../pages/subjects/SubjectsPage";
import { ChaptersPage } from "../pages/chapters/ChaptersPage";
import { TopicsPage } from "../pages/TopicsPage";
import { YearsPage } from "../pages/years/YearsPage";
import { QuestionTypesPage } from "../pages/questionTypes/QuestionTypesPage";
import { QuestionsPage } from "../pages/questions/QuestionsPage";
import { KatexAuditPage } from "../pages/questions/KatexAuditPage";
import { UsersPage } from "../pages/users/UsersPage";
import { SubscriptionsPage } from "../pages/SubscriptionsPage";
import { SubscriptionPlansPage } from "../pages/SubscriptionPlansPage";
import { PaymentGatewaySettingsPage } from "../pages/PaymentGatewaySettingsPage";
import { InvoiceSystemPage } from "../pages/InvoiceSystemPage";
import { DifficultiesPage } from "../pages/DifficultiesPage";
import { CouponsPage } from "../pages/CouponsPage";
import { DailyPlansPage } from "../pages/DailyPlansPage";
import { SessionsPage } from "../pages/SessionsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { AuthSettingsPage } from "../pages/settings/AuthSettingsPage";
import { MockTestsPage } from "../pages/mockTests/MockTestsPage";
import { RevisionManagementPage } from "../pages/settings/RevisionManagementPage";
import { DailyTestManagementPage } from "../pages/settings/DailyTestManagementPage";
import { SupportTicketsPage } from "../pages/SupportTicketsPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { EmailTemplatesPage } from "../pages/EmailTemplatesPage";
import { EmailTemplateCatalogPage } from "../pages/EmailTemplateCatalogPage";
import { WeakAreaManagementPage } from "../pages/WeakAreaManagementPage";
import { MistakeManagementPage } from "../pages/MistakeManagementPage";
import { FreeQuestionsPage } from "../pages/FreeQuestionsPage";
import { EmployeesPage } from "../pages/employees/EmployeesPage";
import { AuditLogsPage } from "../pages/audit/AuditLogsPage";
import { useAuth } from "../context/AuthContext";
import { canViewModule, firstAllowedModulePath, isEmployee } from "../config/adminPermissions";

function MainAdminOnly({ children }) {
  const { admin } = useAuth();
  if (isEmployee(admin)) return <Navigate to={firstAllowedModulePath(admin) || "/no-access"} replace />;
  return children;
}

function EmployeeLanding() {
  const { admin } = useAuth();
  if (!isEmployee(admin)) return <DashboardPage />;
  const firstPath = firstAllowedModulePath(admin);
  return firstPath ? <Navigate to={firstPath} replace /> : <NoAccessPage />;
}

function ModuleAccess({ moduleKey, children }) {
  const { admin } = useAuth();
  if (!isEmployee(admin)) return children;
  if (canViewModule(admin, moduleKey)) return children;
  const firstPath = firstAllowedModulePath(admin);
  return firstPath ? <Navigate to={firstPath} replace /> : <NoAccessPage />;
}

function NoAccessPage() {
  return (
    <div className="rounded-sm border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <h2 className="text-lg font-black">No modules assigned</h2>
      <p className="mt-2 text-sm">Your employee account currently has no enabled module permissions. Please contact the main admin.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeLanding />} />
        <Route path="no-access" element={<NoAccessPage />} />
        <Route path="catalog-overview" element={<ModuleAccess moduleKey="catalog-overview"><CatalogOverviewPage /></ModuleAccess>} />
        <Route path="modes" element={<ModuleAccess moduleKey="modes"><ModesPage /></ModuleAccess>} />
        <Route path="learning-levels" element={<ModuleAccess moduleKey="learning-levels"><LearningLevelsPage /></ModuleAccess>} />
        <Route path="difficulties" element={<ModuleAccess moduleKey="difficulties"><DifficultiesPage /></ModuleAccess>} />
        <Route path="exam-types" element={<ModuleAccess moduleKey="exam-types"><ExamTypesPage /></ModuleAccess>} />
        <Route path="subjects" element={<ModuleAccess moduleKey="subjects"><SubjectsPage /></ModuleAccess>} />
        <Route path="chapters" element={<ModuleAccess moduleKey="chapters"><ChaptersPage /></ModuleAccess>} />
        <Route path="topics" element={<ModuleAccess moduleKey="topics"><TopicsPage /></ModuleAccess>} />
        <Route path="years" element={<ModuleAccess moduleKey="years"><YearsPage /></ModuleAccess>} />
        <Route path="question-types" element={<ModuleAccess moduleKey="question-types"><QuestionTypesPage /></ModuleAccess>} />
        <Route path="questions" element={<ModuleAccess moduleKey="questions"><QuestionsPage /></ModuleAccess>} />
        <Route path="questions/katex-audit" element={<ModuleAccess moduleKey="katex-audit"><KatexAuditPage /></ModuleAccess>} />
        <Route path="employees" element={<MainAdminOnly><EmployeesPage /></MainAdminOnly>} />
        <Route path="audit-logs" element={<MainAdminOnly><AuditLogsPage /></MainAdminOnly>} />
        <Route path="mock-tests" element={<ModuleAccess moduleKey="mock-tests"><MockTestsPage /></ModuleAccess>} />
        <Route path="free-mock-tests" element={<ModuleAccess moduleKey="free-mock-tests"><MockTestsPage freeOnly /></ModuleAccess>} />
        <Route path="free-questions" element={<ModuleAccess moduleKey="free-questions"><FreeQuestionsPage /></ModuleAccess>} />
        <Route path="users" element={<ModuleAccess moduleKey="users"><UsersPage /></ModuleAccess>} />
        <Route path="subscriptions" element={<ModuleAccess moduleKey="subscriptions"><SubscriptionsPage /></ModuleAccess>} />
        <Route path="subscription-plans" element={<ModuleAccess moduleKey="subscription-plans"><SubscriptionPlansPage /></ModuleAccess>} />
        <Route path="payment-gateway" element={<ModuleAccess moduleKey="payment-gateway"><PaymentGatewaySettingsPage /></ModuleAccess>} />
        <Route path="invoices" element={<ModuleAccess moduleKey="invoices"><InvoiceSystemPage /></ModuleAccess>} />
        <Route path="invoice-system" element={<Navigate to="/invoices" replace />} />
        <Route path="smtp-settings" element={<Navigate to="/auth-settings" replace />} />
        <Route path="coupons" element={<ModuleAccess moduleKey="coupons"><CouponsPage /></ModuleAccess>} />
        <Route path="sessions" element={<ModuleAccess moduleKey="sessions"><SessionsPage /></ModuleAccess>} />
        <Route path="daily-plans" element={<ModuleAccess moduleKey="daily-plans"><DailyPlansPage /></ModuleAccess>} />
        <Route path="daily-test-management" element={<ModuleAccess moduleKey="daily-test-management"><DailyTestManagementPage /></ModuleAccess>} />
        <Route path="weak-area-management" element={<ModuleAccess moduleKey="weak-area-management"><WeakAreaManagementPage /></ModuleAccess>} />
        <Route path="mistake-management" element={<ModuleAccess moduleKey="mistake-management"><MistakeManagementPage /></ModuleAccess>} />
        <Route path="revision-management" element={<ModuleAccess moduleKey="revision-management"><RevisionManagementPage /></ModuleAccess>} />
        <Route path="notifications" element={<ModuleAccess moduleKey="notifications"><NotificationsPage /></ModuleAccess>} />
        <Route path="support-tickets" element={<ModuleAccess moduleKey="support-tickets"><SupportTicketsPage /></ModuleAccess>} />
        <Route path="settings" element={<ModuleAccess moduleKey="settings"><SettingsPage /></ModuleAccess>} />
        <Route path="auth-settings" element={<ModuleAccess moduleKey="auth-settings"><AuthSettingsPage /></ModuleAccess>} />
        <Route path="email-templates" element={<ModuleAccess moduleKey="email-templates"><EmailTemplatesPage /></ModuleAccess>} />
        <Route path="email-template-keys" element={<ModuleAccess moduleKey="email-template-keys"><EmailTemplateCatalogPage /></ModuleAccess>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
