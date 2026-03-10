export type Role = "admin" | "doctor" | "patient";

export type PrescriptionStatus = "pending" | "consumed";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  doctor?: { id: string; specialty: string | null; userId: string } | null;
  patient?: { id: string; birthDate: string | null; userId: string } | null;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage?: string | null;
  quantity?: number | null;
  instructions?: string | null;
  prescriptionId: string;
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes?: string | null;
  createdAt: string;
  consumedAt?: string | null;
  patientId: string;
  authorId: string;
  items: PrescriptionItem[];
  patient?: {
    id: string;
    birthDate?: string | null;
    userId: string;
    user: { name: string; email: string };
  };
  author?: {
    id: string;
    specialty?: string | null;
    userId: string;
    user: { name: string; email: string };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminMetrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: Array<{ date: string; count: number }>;
  topDoctors: Array<{ doctorId: string; name: string; count: number }>;
}
