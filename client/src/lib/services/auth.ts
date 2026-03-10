import { apiPost, apiGet } from "@/lib/api";
import type { AuthTokens, JwtPayload } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export function login(payload: LoginPayload) {
  return apiPost<AuthTokens>("/auth/login", payload, { skipAuth: true });
}

export function refreshTokens() {
  return apiPost<AuthTokens>("/auth/refresh");
}

export function getProfile() {
  return apiGet<JwtPayload>("/auth/profile");
}

export function logoutFromServer() {
  return apiPost<void>("/auth/logout");
}
