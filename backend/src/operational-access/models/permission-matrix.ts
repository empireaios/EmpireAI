import { z } from "zod";

/** OAR-003 — Standard permission types for every platform. */
export const PERMISSION_TYPES = [
  "read",
  "write",
  "publish",
  "delete",
  "order",
  "refund",
  "fulfill",
  "advertise",
  "webhook",
  "analytics",
  "payout",
] as const;

export type PermissionType = (typeof PERMISSION_TYPES)[number];

export const platformPermissionSchema = z.object({
  permission: z.enum(PERMISSION_TYPES),
  supported: z.boolean(),
  granted: z.boolean(),
  missingReason: z.string().optional(),
});

export const platformPermissionMatrixSchema = z.object({
  platformId: z.string().min(1),
  displayName: z.string().min(1),
  permissions: z.array(platformPermissionSchema),
  grantedCount: z.number().int(),
  missingCount: z.number().int(),
  health: z.enum(["HEALTHY", "WARNING", "FAILED", "DISABLED"]),
});

export type PlatformPermissionMatrix = z.infer<typeof platformPermissionMatrixSchema>;

/** Default permission support by platform category / id. */
const PLATFORM_PERMISSION_MAP: Record<string, PermissionType[]> = {
  github: ["read", "write"],
  cursor: ["read"],
  vercel: ["read", "write", "webhook"],
  "amazon-seller": ["read", "write", "publish", "order", "refund", "fulfill", "webhook", "analytics", "payout"],
  "cj-dropshipping": ["read", "order", "fulfill", "webhook"],
  stripe: ["read", "write", "refund", "payout", "webhook"],
  "meta-ads": ["read", "write", "advertise", "analytics", "webhook"],
  ga4: ["read", "analytics", "webhook"],
  "tiktok-shop": ["read", "write", "publish", "order", "fulfill", "webhook", "analytics"],
  ebay: ["read", "write", "publish", "order", "refund", "webhook"],
  shopee: ["read", "write", "publish", "order", "fulfill", "webhook"],
  lazada: ["read", "write", "publish", "order", "fulfill", "webhook"],
  walmart: ["read", "write", "publish", "order", "fulfill", "webhook"],
  etsy: ["read", "write", "publish", "order", "refund", "webhook"],
  paypal: ["read", "write", "refund", "payout", "webhook"],
  dhl: ["read", "order", "fulfill", "webhook"],
  fedex: ["read", "order", "fulfill", "webhook"],
  openai: ["read", "write"],
  anthropic: ["read", "write"],
  "google-ai": ["read", "write"],
};

export function getSupportedPermissions(platformId: string): PermissionType[] {
  return PLATFORM_PERMISSION_MAP[platformId] ?? ["read"];
}

export function buildPermissionMatrix(input: {
  platformId: string;
  displayName: string;
  accessState: string;
  grantedScopes: string[];
  architectureOnly: boolean;
}): PlatformPermissionMatrix {
  const supported = getSupportedPermissions(input.platformId);
  const connected = ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(input.accessState);
  const verified = ["VERIFIED", "READY", "ACTIVE"].includes(input.accessState);

  const permissions = PERMISSION_TYPES.map((permission) => {
    const isSupported = supported.includes(permission);
    let granted = false;
    let missingReason: string | undefined;

    if (!isSupported) {
      missingReason = "Not supported by platform";
    } else if (input.architectureOnly && ["publish", "order", "refund", "fulfill", "payout", "advertise"].includes(permission)) {
      missingReason = "Architecture-only: live credentials required";
    } else if (!connected) {
      missingReason = "Platform not connected";
    } else if (!verified && ["publish", "order", "refund", "fulfill", "payout", "advertise", "delete"].includes(permission)) {
      missingReason = "Requires VERIFIED access state";
    } else if (connected && verified && !input.architectureOnly) {
      granted = input.grantedScopes.length > 0 || permission === "read";
    } else if (connected && permission === "read") {
      granted = true;
    } else {
      missingReason = "Awaiting live API authorization";
    }

    return { permission, supported: isSupported, granted, missingReason };
  });

  const grantedCount = permissions.filter((p) => p.granted).length;
  const missingCount = permissions.filter((p) => p.supported && !p.granted).length;
  const health =
    grantedCount === 0 ? "DISABLED"
      : missingCount === 0 ? "HEALTHY"
        : grantedCount > missingCount ? "WARNING"
          : "FAILED";

  return {
    platformId: input.platformId,
    displayName: input.displayName,
    permissions,
    grantedCount,
    missingCount,
    health,
  };
}
