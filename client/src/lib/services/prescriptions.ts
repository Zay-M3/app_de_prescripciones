import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiFetchBlob,
} from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import type { Prescription, PaginatedResponse } from "@/types";

export interface PrescriptionListParams {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  order?: string;
  mine?: boolean;
}

export interface AdminPrescriptionListParams {
  status?: string;
  doctorId?: string;
  patientId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PatientPrescriptionListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  notes?: string;
  items: {
    name: string;
    dosage?: string;
    quantity?: number;
    instructions?: string;
  }[];
}

export function getDoctorPrescriptions(params: PrescriptionListParams = {}) {
  return apiGet<PaginatedResponse<Prescription>>(
    `/prescriptions${toQueryString(params)}`
  );
}

export function getPatientPrescriptions(
  params: PatientPrescriptionListParams = {}
) {
  return apiGet<PaginatedResponse<Prescription>>(
    `/prescriptions/me${toQueryString(params)}`
  );
}

export function getAdminPrescriptions(
  params: AdminPrescriptionListParams = {}
) {
  return apiGet<PaginatedResponse<Prescription>>(
    `/admin/prescriptions${toQueryString(params)}`
  );
}

export function getPrescriptionById(id: string) {
  return apiGet<Prescription>(`/prescriptions/${id}`);
}

export function createPrescription(payload: CreatePrescriptionPayload) {
  return apiPost<Prescription>("/prescriptions", payload);
}

export function consumePrescription(id: string) {
  return apiPatch<Prescription>(`/prescriptions/${id}/consume`);
}

export function deletePrescription(id: string) {
  return apiDelete<void>(`/prescriptions/${id}`);
}

export function downloadPrescriptionPdf(id: string) {
  return apiFetchBlob(`/prescriptions/${id}/pdf`, { method: "GET" });
}
