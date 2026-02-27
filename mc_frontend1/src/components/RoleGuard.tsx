import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminAccessModal } from "@/components/AdminAccessModal";

export function RoleGuard() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    // Don't check during loading
    if (loading) {
      setShowAdminModal(false);
      return;
    }

    // Only check /admin route
    if (location.pathname === "/admin") {
      // Show modal ONLY if authenticated but NOT the approved admin account
      const isAllowedAdmin =
        isAuthenticated &&
        user?.role === "admin" &&
        user?.email?.toLowerCase() === "admin@mobilecare.com";

      if (isAuthenticated && !isAllowedAdmin) {
        setShowAdminModal(true);
      } else {
        setShowAdminModal(false);
      }
    } else {
      setShowAdminModal(false);
    }
  }, [isAuthenticated, user, loading, location.pathname]);

  return (
    <AdminAccessModal
      isOpen={showAdminModal}
      onClose={() => setShowAdminModal(false)}
      userRole={user?.role}
    />
  );
}
