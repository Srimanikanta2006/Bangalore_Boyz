import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { homeForRole, type Role } from './types';

interface RequireAuthProps {
  children: React.ReactNode;
  /** If provided, only these roles may view the route; others go to their own home. */
  roles?: Role[];
}

/**
 * Route guard: redirects unauthenticated users to /login (preserving the
 * attempted location) and role-mismatched users to their own landing page.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface-variant">
        <span className="font-body-md text-body-md">Restoring session…</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <>{children}</>;
};
