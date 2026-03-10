"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiActivity, FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { toast } from "sonner";
import { login as loginService, getProfile } from "@/lib/services/auth";
import { useAuthStore } from "@/store/authStore";
import { useHydration } from "@/store/useHydration";
import { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Role } from "@/types";

const ROLE_REDIRECTS: Record<Role, string> = {
  admin: "/admin",
  doctor: "/doctor/prescriptions",
  patient: "/patient/prescriptions",
};

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Si ya está autenticado, redirigir al dashboard correspondiente
  useEffect(() => {
    if (hydrated && isAuthenticated() && user) {
      router.replace(ROLE_REDIRECTS[user.role]);
    }
  }, [hydrated, user, router, isAuthenticated]);

  if (hydrated && isAuthenticated() && user) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const tokens = await loginService({ email: email.trim(), password });
      setTokens(tokens.access_token, tokens.refresh_token);

      let profile;
      try {
        profile = await getProfile();
      } catch (err) {
        logout();
        throw err;
      }

      const emailName = profile.email.split("@")[0];
      setUser({
        id: profile.sub,
        email: profile.email,
        name: emailName,
        role: profile.role,
      });

      toast.success("Sesion iniciada correctamente");
      router.replace(ROLE_REDIRECTS[profile.role]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error de conexion. Verifica que el servidor este activo.");
      }
      toast.error("Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FiActivity className="text-primary" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MedPrescribe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesion para continuar
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <FiAlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Contrasena
            </label>
            <div className="relative">
              <FiLock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Iniciar Sesion"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
