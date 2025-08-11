import { tokenManager } from '../infrastructure/api/custom-instance';
import type { IUserAuth } from '../interfaces/user.interface';

export const authUtils = {
  // Check if user has specific role
  hasRole: (user: IUserAuth | null, role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role || user.firebaseClaims?.role);
    }
    
    return user.role === role || user.firebaseClaims?.role === role;
  },

  // Check if user is mentor
  isMentor: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, 'mentor');
  },

  // Check if user is mentee
  isMentee: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, 'mentee');
  },

  // Check if user is coordinator
  isCoordinator: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, 'coordinator');
  },

  // Check if user can access admin features
  canAccessAdmin: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, 'coordinator');
  },

  // Check if user can upload resources
  canUploadResources: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, ['mentor', 'coordinator']);
  },

  // Check if user can manage sessions
  canManageSessions: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, ['mentor', 'coordinator']);
  },

  // Check if user can view analytics
  canViewAnalytics: (user: IUserAuth | null): boolean => {
    return authUtils.hasRole(user, ['mentor', 'coordinator']);
  },

  // Get user display name
  getDisplayName: (user: IUserAuth | null): string => {
    if (!user) return 'Usuário';
    return user.firebaseClaims?.name || user.email || 'Usuário';
  },

  // Get role display name in Portuguese
  getRoleDisplayName: (role: string): string => {
    const roleNames = {
      mentor: 'Mentor',
      mentee: 'Mentorado',
      coordinator: 'Coordenador',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  },

  // Get role color for UI
  getRoleColor: (role: string): string => {
    const roleColors = {
      mentor: '#4CAF50',     // Green
      mentee: '#2196F3',     // Blue
      coordinator: '#FF9800', // Orange
    };
    return roleColors[role as keyof typeof roleColors] || '#757575';
  },

  // Validate token expiration (if you implement JWT parsing)
  isTokenExpired: async (): Promise<boolean> => {
    try {
      const token = await tokenManager.getToken();
      if (!token) return true;

      // If you want to implement JWT parsing:
      // const payload = JSON.parse(atob(token.split('.')[1]));
      // return payload.exp * 1000 < Date.now();
      
      // For now, assume token is valid if it exists
      return false;
    } catch (error) {
      return true;
    }
  },

  // Format user info for display
  formatUserInfo: (user: IUserAuth | null): string => {
    if (!user) return '';
    
    const role = authUtils.getRoleDisplayName(user.role || user.firebaseClaims?.role || '');
    return `${user.firebaseClaims?.name} (${role})`;
  },

  // Check if user should see admin dashboard
  shouldShowAdminDashboard: (user: IUserAuth | null): boolean => {
    return authUtils.isCoordinator(user);
  },

  // Get appropriate home route based on role
  getHomeRoute: (user: IUserAuth | null): string => {
    if (!user) return '/auth/LoginScreen';
    
    const userRole = user.role || user.firebaseClaims?.role;
    switch (userRole) {
      case 'coordinator':
        return '/(tabs)'; // Will show admin dashboard
      case 'mentor':
      case 'mentee':
      default:
        return '/(tabs)'; // Will show regular user tabs
    }
  },
};