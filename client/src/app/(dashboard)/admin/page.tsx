"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiActivity,
  FiLoader,
  FiAlertCircle,
  FiFilter,
} from "react-icons/fi";
import { getMetrics } from "@/lib/services/admin";
import { ApiError } from "@/lib/api";
import type { AdminMetrics } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const PIE_COLORS = ["#eab308", "#22c55e"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const updateQuery = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(params)) {
        if (val) sp.set(key, val);
        else sp.delete(key);
      }
      router.push(`?${sp.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getMetrics({ from: from || undefined, to: to || undefined })
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Error al cargar metricas"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiAlertCircle className="mb-2 text-destructive" size={32} />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  const consumptionRate =
    metrics.totals.prescriptions > 0
      ? Math.round(
          (metrics.byStatus.consumed / metrics.totals.prescriptions) * 100
        )
      : 0;

  const stats = [
    {
      label: "Doctores",
      value: metrics.totals.doctors,
      icon: <FiUserCheck size={24} />,
      color:
        "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
    },
    {
      label: "Pacientes",
      value: metrics.totals.patients,
      icon: <FiUsers size={24} />,
      color:
        "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    },
    {
      label: "Prescripciones",
      value: metrics.totals.prescriptions,
      icon: <FiFileText size={24} />,
      color:
        "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
    },
    {
      label: "Tasa Consumo",
      value: `${consumptionRate}%`,
      icon: <FiActivity size={24} />,
      color:
        "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
    },
  ];

  const pieData = [
    { name: "Pendientes", value: metrics.byStatus.pending },
    { name: "Consumidas", value: metrics.byStatus.consumed },
  ];

  const barData = metrics.byDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    }),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Metricas y resumen del sistema
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <FiFilter className="mb-2 text-muted-foreground" size={16} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => updateQuery({ from: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => updateQuery({ to: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Prescripciones por Estado
          </h2>
          {metrics.byStatus.pending === 0 && metrics.byStatus.consumed === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No hay prescripciones aun
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Prescripciones por Dia
          </h2>
          {barData.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No hay datos para mostrar
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Prescripciones"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Top Medicos por Volumen
        </h2>
        {metrics.topDoctors.length === 0 ? (
          <div className="flex h-20 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No hay datos de medicos aun
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Medico
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Prescripciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.topDoctors.map((doc, index) => (
                  <tr
                    key={doc.doctorId}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : index === 1
                              ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              : index === 2
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {doc.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
