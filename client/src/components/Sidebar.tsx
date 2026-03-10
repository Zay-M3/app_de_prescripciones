"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiFileText,
  FiPlusCircle,
  FiActivity,
  FiHome,
} from "react-icons/fi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <FiHome size={20} />,
    roles: ["admin"],
  },
  {
    label: "Mis Prescripciones",
    href: "/doctor/prescriptions",
    icon: <FiFileText size={20} />,
    roles: ["doctor"],
  },
  {
    label: "Nueva Prescripcion",
    href: "/doctor/prescriptions/new",
    icon: <FiPlusCircle size={20} />,
    roles: ["doctor"],
  },
  {
    label: "Mis Prescripciones",
    href: "/patient/prescriptions",
    icon: <FiFileText size={20} />,
    roles: ["patient"],
  },
  {
    label: "Metricas",
    href: "/admin",
    icon: <FiActivity size={20} />,
    roles: ["admin"],
  },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = userRole
    ? navItems.filter((item) => item.roles.includes(userRole))
    : navItems;

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    doctor: "Medico",
    patient: "Paciente",
  };

  const groupedByRole = !userRole
    ? Object.entries(
        filteredItems.reduce<Record<string, NavItem[]>>((acc, item) => {
          const role = item.roles[0];
          if (!acc[role]) acc[role] = [];
          acc[role].push(item);
          return acc;
        }, {})
      )
    : null;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar-bg">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <FiActivity className="text-primary" size={24} />
        <span className="text-lg font-bold text-foreground">MedPrescribe</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groupedByRole ? (
          groupedByRole.map(([role, items]) => (
            <div key={role} className="mb-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {roleLabels[role] || role}
              </p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <SidebarLink
                    key={item.href + item.label}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="space-y-1">
            {filteredItems.map((item) => (
              <SidebarLink
                key={item.href + item.label}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </ul>
        )}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <p className="px-3 text-xs text-muted-foreground">
          v1.0.0
        </p>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    </li>
  );
}
