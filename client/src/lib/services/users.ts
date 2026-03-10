import { apiGet } from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import type { User } from "@/types";

export interface UserListParams {
  role?: string;
}

export function getUsers(params: UserListParams = {}) {
  return apiGet<User[]>(`/users${toQueryString(params)}`);
}

export function getUserById(id: string) {
  return apiGet<User>(`/users/${id}`);
}
