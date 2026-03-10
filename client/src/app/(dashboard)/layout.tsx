"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/store/authStore";
import { useHydration } from "@/store/useHydration";
import type { Role } from "@/types";

const ROLE_ROUTES: Record<Role, string[]> = {
  admin: ["/admin"],
  doctor: ["/doctor"],
  patient: ["/patient"],
};

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  doctor: "/doctor/prescriptions",
  patient: "/patient/prescriptions",
};

function isRouteAllowed(pathname: string, role: Role): boolean {
  const allowed = ROLE_ROUTES[role];
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydration();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    if (user && !isRouteAllowed(pathname, user.role)) {
      router.replace(ROLE_HOME[user.role]);
      return;
    }

    setAuthorized(true);
  }, [hydrated, isAuthenticated, user, pathname, router]);

  if (!hydrated || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userRole={user?.role} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          userName={user?.name}
          userRole={user?.role}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
