import React, { createContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" | "network_error" };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simple validation for demo purposes
      if (email === "admin@example.com" && password === "password") {
        setUser({ id: "1", name: "Admin User", email });
        return { ok: true };
      }
      return { ok: false, reason: "invalid_credentials" };
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, reason: "network_error" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
