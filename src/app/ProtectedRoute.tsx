import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthContext } from './AuthContext';
import { canAccessRoute, getDefaultRoute } from '../lib/routing';

type Props = {
  children: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[];
};

export function ProtectedRoute({ children, requiredPermission, allowedRoles }: Props) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user.roleName && !allowedRoles.includes(user.roleName)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  if (requiredPermission && !canAccessRoute(user, requiredPermission)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <>{children}</>;
}
