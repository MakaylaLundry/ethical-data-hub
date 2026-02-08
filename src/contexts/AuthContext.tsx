import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from '@/services/apiClient';

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
  role: UserRole;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store role in memory (could be persisted to backend later)
let storedRole: UserRole = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user: auth0User,
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  // Sync access token to API client whenever auth state changes
  useEffect(() => {
    const syncToken = async () => {
      if (auth0IsAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          apiClient.setAccessToken(token);
        } catch (error) {
          console.error('Failed to get access token:', error);
          apiClient.setAccessToken(null);
        }
      } else {
        apiClient.setAccessToken(null);
      }
    };

    syncToken();
  }, [auth0IsAuthenticated, getAccessTokenSilently]);

  // Map Auth0 user to our User type
  const user: User | null = auth0IsAuthenticated && auth0User
    ? {
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || auth0User.email?.split('@')[0] || '',
        role: storedRole,
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
    storedRole = null;
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const setRole = (role: UserRole) => {
    storedRole = role;
    // Force re-render by triggering state change
    // The role is stored in module scope and reflected in the user object
  };

  const updateProfile = (data: Partial<User>) => {
    if (data.role !== undefined) {
      storedRole = data.role;
    }
    // Other profile updates could be sent to backend here
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: auth0IsAuthenticated,
        isLoading: auth0IsLoading,
        role: storedRole,
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
