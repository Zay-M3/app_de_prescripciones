"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  getPrescriptionById,
  consumePrescription,
  downloadPrescriptionPdf,
} from "@/lib/services/prescriptions";
import {
  formatDate,
  formatDateTime,
  statusBadgeClass,
  statusLabel,
  downloadBlob,
} from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { Prescription } from "@/types";

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consuming, setConsuming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPrescription = useCallback(() => {
    setLoading(true);
    setError("");
    getPrescriptionById(id)
      .then((rx) => setPrescription(rx))
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Error al cargar la prescripcion"
        )
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);

  const handleConsume = async () => {
    setConsuming(true);
    try {
      const updated = await consumePrescription(id);
      setPrescription(updated);
      toast.success("Prescripcion marcada como consumida");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Error al marcar como consumida"
      );
    } finally {
      setConsuming(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await downloadPrescriptionPdf(id);
      downloadBlob(blob, `prescripcion-${prescription?.code || id}.pdf`);
      toast.success("PDF descargado");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Error al descargar PDF"
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/patient/prescriptions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FiArrowLeft size={16} />
          Volver al listado
        </Link>
        <div className="flex flex-col items-center justify-center py-20">
          <FiAlertCircle className="mb-2 text-destructive" size={32} />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/patient/prescriptions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <FiArrowLeft size={16} />
        Volver al listado
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Detalle de Prescripcion
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            Codigo: {prescription.code}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(prescription.status)}`}
        >
          {statusLabel(prescription.status)}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {prescription.status === "pending" && (
          <button
            onClick={handleConsume}
            disabled={consuming}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {consuming ? (
              <FiLoader className="animate-spin" size={16} />
            ) : (
              <FiCheckCircle size={16} />
            )}
            Marcar como Consumida
          </button>
        )}
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {downloading ? (
            <FiLoader className="animate-spin" size={16} />
          ) : (
            <FiDownload size={16} />
          )}
          Descargar PDF
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Doctor
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {prescription.author?.user.name || "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {prescription.author?.user.email}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Especialidad
            </p>
            <p className="mt-1 text-sm text-foreground">
              {prescription.author?.specialty || "General"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fecha de creacion
            </p>
            <p className="mt-1 text-sm text-foreground">
              {formatDateTime(prescription.createdAt)}
            </p>
          </div>
          {prescription.consumedAt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Fecha de consumo
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatDateTime(prescription.consumedAt)}
              </p>
            </div>
          )}
        </div>

        {prescription.notes && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notas del doctor
            </p>
            <p className="mt-1 text-sm text-foreground">{prescription.notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Medicamentos ({prescription.items.length})
          </p>
          <div className="space-y-2">
            {prescription.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex items-start gap-3">
                  <FiFileText
                    className="mt-0.5 text-primary shrink-0"
                    size={16}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {item.dosage && <span>Dosis: {item.dosage}</span>}
                      {item.quantity != null && (
                        <span>Cantidad: {item.quantity}</span>
                      )}
                      {item.instructions && (
                        <span>Instrucciones: {item.instructions}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
