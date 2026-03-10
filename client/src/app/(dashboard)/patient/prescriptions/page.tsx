"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiFileText,
  FiFilter,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  getPatientPrescriptions,
  consumePrescription,
  downloadPrescriptionPdf,
} from "@/lib/services/prescriptions";
import { Pagination } from "@/components/Pagination";
import { formatDate, statusBadgeClass, statusLabel, downloadBlob } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { Prescription, PaginatedResponse } from "@/types";

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Prescription> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";

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

  const fetchData = useCallback(() => {
    setLoading(true);
    setError("");

    getPatientPrescriptions({ status: status || undefined, page, limit: 10 })
      .then((res) => setData(res))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Error al cargar prescripciones"
        )
      )
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    let cacelled = false;

    setLoading(true);
    setError("");

    getPatientPrescriptions({ status: status || undefined, page, limit: 10 })
      .then((res) => {
        if (!cacelled) setData(res);
      })
      .catch((err) => {
        if (!cacelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Error al cargar prescripciones"
          );
      })
      .finally(() => {
        if (!cacelled) setLoading(false);
      });

    return () => {
      cacelled = true;
    };
  }, [page, status]);


  const handleConsume = async (id: string) => {
    setConsumingId(id);
    try {
      await consumePrescription(id);
      toast.success("Prescripcion marcada como consumida");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Error al marcar como consumida"
      );
    } finally {
      setConsumingId(null);
    }
  };

  const handleDownloadPdf = async (id: string, code: string) => {
    setDownloadingId(id);
    try {
      const blob = await downloadPrescriptionPdf(id);
      downloadBlob(blob, `prescripcion-${code}.pdf`);
      toast.success("PDF descargado");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Error al descargar PDF"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Mis Prescripciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualiza, consume y descarga tus prescripciones medicas
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <FiFilter className="mb-2 text-muted-foreground" size={16} />
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Estado
          </label>
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
          <p className="text-sm text-muted-foreground">
            No se encontraron prescripciones
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.data.map((rx) => (
              <div
                key={rx.id}
                className={`rounded-lg border border-border bg-card p-5 transition-colors ${
                  rx.status === "consumed" ? "opacity-75" : ""
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/patient/prescriptions/${rx.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {rx.code}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rx.author?.user.name || "Doctor"} -{" "}
                      {formatDate(rx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(rx.status)}`}
                  >
                    {statusLabel(rx.status)}
                  </span>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                  {rx.items.length} medicamento{rx.items.length !== 1 ? "s" : ""}
                </p>

                {rx.notes && (
                  <p className="mb-4 text-xs text-muted-foreground line-clamp-2 italic">
                    {rx.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {rx.status === "pending" && (
                    <button
                      onClick={() => handleConsume(rx.id)}
                      disabled={consumingId === rx.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {consumingId === rx.id ? (
                        <FiLoader className="animate-spin" size={14} />
                      ) : (
                        <FiCheckCircle size={14} />
                      )}
                      Marcar Consumida
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadPdf(rx.id, rx.code)}
                    disabled={downloadingId === rx.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {downloadingId === rx.id ? (
                      <FiLoader className="animate-spin" size={14} />
                    ) : (
                      <FiDownload size={14} />
                    )}
                    PDF
                  </button>
                  <Link
                    href={`/patient/prescriptions/${rx.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            ))}
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
