import {
  REALITY_PROVIDER_CATALOG,
  buildConnectorHealthCenter,
  getConnectorRuntimeState,
  getCredentialVaultRepository,
} from "../../reality-integration/index.js";
import type { EsisConnectorReport } from "../models/esis-inspection.js";
import { sortAlpha } from "./repo-scanner.js";

const DEFAULT_WORKSPACE = "ws_empire_1";

const EXECUTION_MODULES: Record<string, { publish: boolean; webhook: boolean }> = {
  stripe: { publish: false, webhook: true },
  "cj-dropshipping": { publish: false, webhook: false },
  shopify: { publish: false, webhook: false },
  "meta-ads": { publish: false, webhook: false },
  "facebook-shop": { publish: false, webhook: false },
  paypal: { publish: false, webhook: false },
};

export function inspectConnectors(workspaceId = DEFAULT_WORKSPACE): {
  summary: string;
  entries: EsisConnectorReport[];
} {
  const healthCenter = buildConnectorHealthCenter(workspaceId);

  const entries: EsisConnectorReport[] = sortAlpha(
    REALITY_PROVIDER_CATALOG.map((provider) => {
      const healthEntry = healthCenter.entries.find((e) => e.providerId === provider.providerId);
      const runtime = getConnectorRuntimeState(workspaceId, provider.providerId);
      const execCaps = EXECUTION_MODULES[provider.providerId] ?? { publish: false, webhook: false };
      const vaultRecord = runtime?.credentialsRef
        ? getCredentialVaultRepository().getRecord(runtime.credentialsRef)
        : null;

      const lifecycle = healthEntry?.lifecycle ?? "DISCONNECTED";
      const blocked = lifecycle !== "CONNECTED" || runtime?.executionBlocked === true;
      const blockedReasons: string[] = [];
      if (runtime?.executionBlocked) blockedReasons.push("executionBlocked: true");
      if (provider.connectionOnly) blockedReasons.push("connectionOnly: true");
      if (provider.irreversibleActionsBlocked) blockedReasons.push("irreversibleActionsBlocked: true");
      if (lifecycle !== "CONNECTED") blockedReasons.push(`lifecycle: ${lifecycle}`);

      const hasPublishCap = provider.capabilities.some((c) =>
        ["catalog_sync", "checkout", "listing_readiness"].includes(c),
      );

      return {
        providerId: provider.providerId,
        displayName: provider.displayName,
        connection: lifecycle,
        health: healthEntry?.health ?? "DISABLED",
        oauth: provider.authentication === "oauth2" || provider.authentication === "oauth2_refresh" ? "oauth2" : provider.authentication,
        scopes: vaultRecord?.scopes ?? [],
        token: runtime?.credentialsRef
          ? healthEntry?.warnings.includes("Credentials expired")
            ? "expired"
            : "stored"
          : "none",
        permissions: provider.requiredHumanActions,
        publishCapability: hasPublishCap && execCaps.publish,
        webhookCapability: execCaps.webhook || provider.capabilities.includes("webhook_registration"),
        retryCapability: true,
        executionStatus: runtime?.executionBlocked ? "BLOCKED" : lifecycle === "CONNECTED" ? "CONNECTION_ONLY" : "DISCONNECTED",
        blocked,
        blockedReason: blockedReasons.join("; ") || undefined,
      };
    }),
    (e) => e.providerId,
  );

  const connected = entries.filter((e) => e.connection === "CONNECTED").length;
  const blocked = entries.filter((e) => e.blocked).length;

  return {
    summary: `${entries.length} connectors in catalog; ${connected} connected; ${blocked} blocked from execution`,
    entries,
  };
}
