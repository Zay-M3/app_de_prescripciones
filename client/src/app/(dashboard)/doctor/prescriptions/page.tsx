"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiFileText, FiFilter, FiLoader, FiAlertCircle } from "react-icons/fi";
import { getDoctorPrescriptions } from "@/lib/services/prescriptions";
import { Pagination } from "@/components/Pagination";
import { formatDate, statusBadgeClass, statusLabel } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { Prescription, PaginatedResponse } from "@/types";

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Prescription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const updateQuery = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(params)) {
        if (val) sp.set(key, val);
        else sp.delete(key);
      }
      if (!params.page) sp.delete("page");
      router.push(`?${sp.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getDoctorPrescriptions({ mine: true, status, from, to, page, limit: 10, order: "desc" })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar prescripciones");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, status, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Prescripciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las prescripciones que has creado
          </p>
        </div>
        <Link
          href="/doctor/prescriptions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nueva Prescripcion
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <FiFilter className="mb-2 text-muted-foreground" size={16} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
          <select
            value={status}
            onChange={(e) => updateQuery({ status: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="consumed">Consumida</option>
          </select>
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-primary" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FiAlertCircle className="mb-2 text-destructive" size={32} />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FiFileText className="mb-3 text-muted-foreground" size={40} />
          <p className="text-sm text-muted-foreground">No se encontraron prescripciones</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Codigo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((rx) => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{rx.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{rx.patient?.user.name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{rx.patient?.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rx.items.length} item(s)</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(rx.status)}`}>
                        {statusLabel(rx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(rx.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/doctor/prescriptions/${rx.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(p) => updateQuery({ page: String(p) })}
          />
        </>
      )}
    </div>
  );
}
