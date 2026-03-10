"use client";

import { FiLogOut, FiUser, FiMenu } from "react-icons/fi";
import { ThemeToggle } from "./ThemeToggle";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

export function Navbar({ userName, userRole, onToggleSidebar, onLogout }: NavbarProps) {
  const roleBadgeColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    doctor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    patient: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    doctor: "Medico",
    patient: "Paciente",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          title="Toggle sidebar"
        >
          <FiMenu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FiUser size={16} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {userName || "Usuario"}
            </p>
            {userRole && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  roleBadgeColors[userRole] || "bg-gray-100 text-gray-700"
                }`}
              >
                {roleLabels[userRole] || userRole}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Cerrar sesion"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  );
}
