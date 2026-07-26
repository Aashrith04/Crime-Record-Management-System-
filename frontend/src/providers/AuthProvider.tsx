"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types";
import { api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("crms_access_token");
      if (!token) {
        setLoading(false);
        if (!pathname.startsWith("/login")) {
          router.push("/login");
        }
        return;
      }

      try {
        const res = await api.get("/auth/me");
        if (res.data?.success) {
          setUser(res.data.data);
        }
      } catch (err) {
        localStorage.removeItem("crms_access_token");
        localStorage.removeItem("crms_refresh_token");
        setUser(null);
        if (!pathname.startsWith("/login")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem("crms_access_token", accessToken);
    localStorage.setItem("crms_refresh_token", refreshToken);
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("crms_access_token");
    localStorage.removeItem("crms_refresh_token");
    setUser(null);
    router.push("/login");
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user || !user.role || !user.role.permissions) return false;
    return user.role.permissions.some((p) => p.code === permissionCode);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
