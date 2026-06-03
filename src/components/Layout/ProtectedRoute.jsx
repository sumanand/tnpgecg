import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { hasRoutePermission, getDefaultRedirect } from '../../utils/routePermissions';

const ProtectedRoute = ({ children, role, allowedRoles = [], requireAuth = true }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" color="blue" text="Verifying access..." />
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !currentUser) {
    // Redirect to login page but save the location they tried to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is authenticated but no role found, redirect to appropriate default
  if (currentUser && !userRole) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (currentUser && userRole) {
    // Check if route has specific role requirement
    const hasPermission = hasRoutePermission(location.pathname, userRole);
    
    if (!hasPermission) {
      // Redirect to user's default dashboard
      const defaultRedirect = getDefaultRedirect(userRole);
      return <Navigate to={defaultRedirect} replace />;
    }

    // Check specific role if provided
    if (role && userRole !== role) {
      const defaultRedirect = getDefaultRedirect(userRole);
      return <Navigate to={defaultRedirect} replace />;
    }

    // Check allowed roles if provided
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      const defaultRedirect = getDefaultRedirect(userRole);
      return <Navigate to={defaultRedirect} replace />;
    }
  }

  // If all checks pass, render the protected component
  return children;
};

// Higher-order component to protect routes with role-based access
export const withProtectedRoute = (Component, role, allowedRoles = []) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute role={role} allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Role-based route guard for specific actions
export const useRoleGuard = () => {
  const { userRole, currentUser, userData } = useAuth();

  const hasRole = (requiredRole) => {
    if (!currentUser) return false;
    if (requiredRole === 'admin') return userRole === 'admin';
    if (requiredRole === 'student') return userRole === 'student';
    if (requiredRole === 'company') return userRole === 'company';
    return false;
  };

  const hasAnyRole = (roles) => {
    if (!currentUser) return false;
    return roles.includes(userRole);
  };

  const isAdmin = () => userRole === 'admin';
  const isStudent = () => userRole === 'student';
  const isCompany = () => userRole === 'company';
  const isAuthenticated = () => !!currentUser;

  // Permission helpers for specific actions
  const canManageStudents = () => isAdmin();
  const canPostJobs = () => isAdmin() || isCompany();
  const canApplyForJobs = () => isStudent();
  const canViewAnalytics = () => isAdmin();
  const canManageApplications = () => isAdmin() || isCompany();

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isStudent,
    isCompany,
    isAuthenticated,
    canManageStudents,
    canPostJobs,
    canApplyForJobs,
    canViewAnalytics,
    canManageApplications,
    userRole,
    userData
  };
};

export default ProtectedRoute;