import { apiGet } from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import type { User, PaginatedResponse } from "@/types";

export interface UserListParams {
  role?: string;
  page?: number;
  limit?: number;
  query?: string;
}

export function getUsers(params: UserListParams = {}) {
  return apiGet<PaginatedResponse<User>>(`/users${toQueryString(params)}`);
}

export function getUserById(id: string) {
  return apiGet<User>(`/users/${id}`);
}
