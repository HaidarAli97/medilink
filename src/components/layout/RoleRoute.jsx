import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { homePathForRole } from "../../config/roles";

/**
 * Blocks a user from manually opening a dashboard that belongs to another
 * role. If the signed-in role doesn't match `role`, they are bounced to their
 * own role's landing page.
 */
export function RoleRoute({ role, children }) {
  const { user } = useAuth();

  // Shouldn't happen (ProtectedRoute already gates auth), but be safe.
  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
