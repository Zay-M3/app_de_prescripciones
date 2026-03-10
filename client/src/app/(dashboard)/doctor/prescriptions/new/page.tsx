"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiPlusCircle,
  FiTrash2,
  FiLoader,
  FiSearch,
} from "react-icons/fi";
import { toast } from "sonner";
import { getUsers } from "@/lib/services/users";
import { createPrescription } from "@/lib/services/prescriptions";
import { ApiError } from "@/lib/api";
import type { User } from "@/types";

interface ItemForm {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

const emptyItem = (): ItemForm => ({
  name: "",
  dosage: "",
  quantity: "",
  instructions: "",
});

export default function NewPrescriptionPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<User[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setPatientsLoading(true);
    getUsers({ role: "patient" })
      .then((users) => setPatients(users))
      .catch(() => toast.error("Error al cargar pacientes"))
      .finally(() => setPatientsLoading(false));
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  });

  const selectPatient = useCallback((patient: User) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name + " (" + patient.email + ")");
    setShowDropdown(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.patient;
      return next;
    });
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatient(null);
    setSearchQuery("");
  }, []);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedPatient) {
      errs.patient = "Debes seleccionar un paciente";
    }

    const validItems = items.filter((it) => it.name.trim() !== "");
    if (validItems.length === 0) {
      errs.items = "Debes agregar al menos un medicamento";
    }

    items.forEach((it, i) => {
      if (it.name.trim() === "" && (it.dosage || it.quantity || it.instructions)) {
        errs[`item-${i}-name`] = "El nombre del medicamento es obligatorio";
      }
      if (it.quantity && (isNaN(Number(it.quantity)) || Number(it.quantity) < 1)) {
        errs[`item-${i}-quantity`] = "La cantidad debe ser un numero positivo";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (!selectedPatient?.patient) {
        toast.error("Paciente seleccionado no es válido");
        setSubmitting(false);
        return;
      }

      const patientId = selectedPatient.patient.id;

      const validItems = items
        .filter((it) => it.name.trim() !== "")
        .map((it) => ({
          name: it.name.trim(),
          ...(it.dosage ? { dosage: it.dosage.trim() } : {}),
          ...(it.quantity ? { quantity: Number(it.quantity) } : {}),
          ...(it.instructions ? { instructions: it.instructions.trim() } : {}),
        }));

      await createPrescription({
        patientId,
        notes: notes.trim() || undefined,
        items: validItems,
      });

      toast.success("Prescripcion creada exitosamente");
      router.push("/doctor/prescriptions");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Error al crear la prescripcion";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/doctor/prescriptions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <FiArrowLeft size={16} />
        Volver al listado
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Nueva Prescripcion
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea una prescripcion para un paciente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Paciente <span className="text-destructive">*</span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedPatient.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPatient}
                  className="text-sm text-destructive hover:text-destructive/80"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar paciente por nombre o email..."
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {patientsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <FiLoader className="animate-spin text-primary" size={18} />
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        No se encontraron pacientes
                      </p>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p)}
                          className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.email}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
            {errors.patient && (
              <p className="mt-1 text-xs text-destructive">{errors.patient}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones generales (opcional)..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Medicamentos <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <FiPlusCircle size={14} />
                Agregar item
              </button>
            </div>

            {errors.items && (
              <p className="mb-2 text-xs text-destructive">{errors.items}</p>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-dashed border-border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(index, "name", e.target.value)
                        }
                        placeholder="Nombre del medicamento *"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {errors[`item-${index}-name`] && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors[`item-${index}-name`]}
                        </p>
                      )}
                    </div>
                    <input
                      value={item.dosage}
                      onChange={(e) =>
                        updateItem(index, "dosage", e.target.value)
                      }
                      placeholder="Dosis (ej: 1 c/8h)"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div>
                      <input
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        placeholder="Cantidad"
                        type="number"
                        min="1"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {errors[`item-${index}-quantity`] && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors[`item-${index}-quantity`]}
                        </p>
                      )}
                    </div>
                    <input
                      value={item.instructions}
                      onChange={(e) =>
                        updateItem(index, "instructions", e.target.value)
                      }
                      placeholder="Instrucciones"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/doctor/prescriptions"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <FiLoader className="animate-spin" size={16} />}
            Crear Prescripcion
          </button>
        </div>
      </form>
    </div>
  );
}
