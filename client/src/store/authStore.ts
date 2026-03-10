import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";
import { logoutFromServer } from "@/lib/services/auth";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  serverLogout: () => Promise<void>;
  isAuthenticated: () => boolean;
  getRole: () => Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        }),

      serverLogout: async () => {
        try {
          await logoutFromServer();
        } catch {
          // Si falla la llamada al servidor, igual limpiamos el estado local
        }
        get().logout();
      },

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return !!accessToken && !!user;
      },

      getRole: () => {
        const { user } = get();
        return user?.role ?? null;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
