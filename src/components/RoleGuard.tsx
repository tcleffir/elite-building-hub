import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { canAccess } from "@/lib/role-config";

interface RoleGuardProps {
  children: ReactNode;
}

const RoleGuard = ({ children }: RoleGuardProps) => {
  const { user } = useApp();
  const location = useLocation();

  if (!canAccess(user.role, location.pathname)) {
    const fallbackPath = user.role === 'gestor_fundo' ? '/proprietario/portfolio' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
