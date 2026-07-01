import { apiRequest } from "@/api/client";

interface DispatchResponse<T> {
  correlationId: string;
  status: string;
  result?: T;
}

export async function brainDispatch<T>(
  module: string,
  action: string,
  companyId: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await apiRequest<DispatchResponse<T>>("/brain/dispatch", {
    method: "POST",
    body: { module, action, companyId, payload },
  });
  return response.result as T;
}
