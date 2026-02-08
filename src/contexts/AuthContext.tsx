import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  role: UserRole;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Mock login - simulates Auth0 redirection
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      role: null,
    });
  };

  const signup = async (email: string, _password: string, name: string) => {
    // Mock signup
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: null,
    });
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
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
