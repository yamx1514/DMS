import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
  requireDelegatedTeam?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireDelegatedTeam,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requireDelegatedTeam && !user.delegatedTeams.includes(requireDelegatedTeam)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const DocumentsPage = React.lazy(() => import("../pages/DocumentsPage"));
const AdminDashboard = React.lazy(() => import("../pages/AdminDashboard"));
const UnauthorizedPage = React.lazy(() => import("../pages/Unauthorized"));
const LoginPage = React.lazy(() => import("../pages/Login"));

const AppRoutes: React.FC = () => (
  <React.Suspense fallback={<div>Loading…</div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={["admin", "sub_admin", "employee", "finance", "operations"]}>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/regional/north"
        element={
          <ProtectedRoute allowedRoles={["admin", "sub_admin"]} requireDelegatedTeam="north">
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/documents" replace />} />
    </Routes>
  </React.Suspense>
);

export default AppRoutes;
export { ProtectedRoute };
