import { apiGet } from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import type { AdminMetrics } from "@/types";

export interface MetricsParams {
  from?: string;
  to?: string;
}

export function getMetrics(params: MetricsParams = {}) {
  return apiGet<AdminMetrics>(`/admin/metrics${toQueryString(params)}`);
}
