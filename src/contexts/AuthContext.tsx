import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient, ApiError } from '@/lib/apiClient';

export type UserRole = 'artist' | 'company' | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  useCase?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRoleLoading: boolean;
  role: UserRole;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  
  const {
    user: auth0User,
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  // Sync access token and fetch user profile from backend
  useEffect(() => {
    const syncTokenAndFetchProfile = async () => {
      if (auth0IsAuthenticated) {
        setIsRoleLoading(true);
        try {
          const token = await getAccessTokenSilently();
          apiClient.setAccessToken(token);
          
        try {
          // Try to fetch role from backend using auth/me endpoint
          const authResult = await apiClient.getAuthMe();
          // If backend returns role in the response, use it
          if (authResult.data?.role) {
            setRoleState(authResult.data.role as UserRole);
          } else {
            // Otherwise use localStorage fallback
            const savedRole = localStorage.getItem('user_role');
            setRoleState(savedRole as UserRole);
          }
        } catch (profileError: unknown) {
          // If 404 or other error, use localStorage fallback
          console.warn('Could not fetch user profile from backend:', profileError);
          const savedRole = localStorage.getItem('user_role');
          setRoleState(savedRole as UserRole);
        }
        } catch (error) {
          console.error('Failed to get access token or fetch profile:', error);
          apiClient.setAccessToken(null);
          // Try localStorage as last resort
          const savedRole = localStorage.getItem('user_role');
          setRoleState(savedRole as UserRole);
        } finally {
          setIsRoleLoading(false);
        }
      } else {
        apiClient.setAccessToken(null);
        setRoleState(null);
      }
    };

    syncTokenAndFetchProfile();
  }, [auth0IsAuthenticated, getAccessTokenSilently]);

  // Map Auth0 user to our User type
  const user: User | null = auth0IsAuthenticated && auth0User
    ? {
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || auth0User.email?.split('@')[0] || '',
        role: role,
      }
    : null;

  const login = async () => {
    await loginWithRedirect({
      appState: { returnTo: '/onboarding' },
    });
  };

  const signup = async () => {
    await loginWithRedirect({
      appState: { returnTo: '/onboarding' },
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  };

  const logout = () => {
    apiClient.setAccessToken(null);
    setRoleState(null);
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const setRole = async (newRole: UserRole) => {
    if (newRole) {
      // Immediately update local state for instant UI feedback
      setRoleState(newRole);
      // Save to localStorage as persistent fallback
      localStorage.setItem('user_role', newRole);
      
      // TODO: When backend adds PUT /api/v1/user/profile, sync here
      // try {
      //   await apiClient.put('/api/v1/user/profile', { role: newRole });
      // } catch (error) {
      //   console.warn('Failed to sync role to backend:', error);
      // }
    } else {
      setRoleState(null);
      localStorage.removeItem('user_role');
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (data.role !== undefined) {
      setRoleState(data.role);
    }
    // Other profile updates could be sent to backend here
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: auth0IsAuthenticated,
        isLoading: auth0IsLoading,
        isRoleLoading,
        role,
        login,
        signup,
        logout,
        setRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
