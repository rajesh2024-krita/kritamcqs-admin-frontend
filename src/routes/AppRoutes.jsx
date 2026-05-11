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
import { UsersPage } from "../pages/users/UsersPage";
import { SubscriptionsPage } from "../pages/SubscriptionsPage";
import { SubscriptionPlansPage } from "../pages/SubscriptionPlansPage";
import { PaymentGatewaySettingsPage } from "../pages/PaymentGatewaySettingsPage";
import { InvoiceSystemPage } from "../pages/InvoiceSystemPage";
import { SMTPSettingsPage } from "../pages/SMTPSettingsPage";
import { DifficultiesPage } from "../pages/DifficultiesPage";
import { CouponsPage } from "../pages/CouponsPage";
import { DailyPlansPage } from "../pages/DailyPlansPage";
import { SessionsPage } from "../pages/SessionsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { MockTestsPage } from "../pages/mockTests/MockTestsPage";
import { RevisionManagementPage } from "../pages/settings/RevisionManagementPage";
import { DailyTestManagementPage } from "../pages/settings/DailyTestManagementPage";

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
        <Route index element={<DashboardPage />} />
        <Route path="catalog-overview" element={<CatalogOverviewPage />} />
        <Route path="modes" element={<ModesPage />} />
        <Route path="learning-levels" element={<LearningLevelsPage />} />
        <Route path="difficulties" element={<DifficultiesPage />} />
        <Route path="exam-types" element={<ExamTypesPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="chapters" element={<ChaptersPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="years" element={<YearsPage />} />
        <Route path="question-types" element={<QuestionTypesPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="mock-tests" element={<MockTestsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscription-plans" element={<SubscriptionPlansPage />} />
        <Route path="payment-gateway" element={<PaymentGatewaySettingsPage />} />
        <Route path="invoice-system" element={<InvoiceSystemPage />} />
        <Route path="smtp-settings" element={<SMTPSettingsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="daily-plans" element={<DailyPlansPage />} />
        <Route path="daily-test-management" element={<DailyTestManagementPage />} />
        <Route path="revision-management" element={<RevisionManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
