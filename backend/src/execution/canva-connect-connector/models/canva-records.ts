import { z } from "zod";

export const CANVA_EXPORT_FORMATS = ["png", "jpg", "pdf", "mp4"] as const;
export type CanvaExportFormat = (typeof CANVA_EXPORT_FORMATS)[number];

export const canvaOAuthConnectionSchema = z.object({
  connectionId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  credentialsRef: z.string().min(1),
  scopes: z.array(z.string()),
  mock: z.boolean(),
  revoked: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type CanvaOAuthConnection = z.infer<typeof canvaOAuthConnectionSchema>;

export const canvaOAuthPendingSchema = z.object({
  pendingId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  state: z.string().min(1),
  codeVerifierEncrypted: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
});

export type CanvaOAuthPending = z.infer<typeof canvaOAuthPendingSchema>;

export type CanvaTokenBundle = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresAt: string | null;
  scopes: string[];
};

export type CanvaHealthStatus = {
  providerId: "canva";
  connected: boolean;
  mock: boolean;
  liveConfigured: boolean;
  tokenValid: boolean;
  lastError: string | null;
  checkedAt: string;
};
