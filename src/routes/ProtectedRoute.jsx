import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner label="Checking admin session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
