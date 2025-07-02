import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { authUtils } from '../../utils/authUtils';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles: ('mentor' | 'mentee' | 'coordinator')[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = requireAll
    ? allowedRoles.every(role => authUtils.hasRole(user, role))
    : allowedRoles.some(role => authUtils.hasRole(user, role));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Convenience components for specific roles
export const MentorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <RoleBasedComponent allowedRoles={['mentor']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const MenteeOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <RoleBasedComponent allowedRoles={['mentee']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const CoordinatorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <RoleBasedComponent allowedRoles={['coordinator']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const MentorAndCoordinator: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <RoleBasedComponent allowedRoles={['mentor', 'coordinator']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);