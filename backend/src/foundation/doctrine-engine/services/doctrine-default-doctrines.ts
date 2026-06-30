import type { Doctrine } from "../models/doctrine.js";
import { CANONICAL_DOCTRINE_IDS } from "../models/doctrine.js";
import { GOVERNANCE_ENV_FLAGS } from "../../empire-governance/config/governance-env-bridge.js";

function doctrine(
  input: Omit<Doctrine, "createdAt" | "updatedAt" | "referenceCount">,
): Doctrine {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    referenceCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default Empire doctrines — executable policies, not hardcoded module logic. */
export function createDefaultDoctrines(workspaceId: string): Doctrine[] {
  return [
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.PROTECT_THE_EMPIRE,
      workspaceId,
      title: "Protect The Empire",
      statement:
        "No destructive live action may execute without explicit founder approval and governance clearance.",
      status: "ACTIVE",
      version: 1,
      executablePolicy: {
        domain: "founder",
        module: "*",
        action: "launch_campaign",
        effect: "REQUIRE_FOUNDER_APPROVAL",
        requiredRole: "founder",
        priority: 950,
      },
      metadata: { tier: "core", immutable: "true" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.NO_LIVE_WITHOUT_GATES,
      workspaceId,
      title: "No Live Without Gates",
      statement:
        "Live payment, deployment, marketing launch, and supplier fulfillment require explicit env gates.",
      status: "ACTIVE",
      version: 1,
      executablePolicy: {
        domain: "marketing",
        module: "meta-ads-connector",
        action: "launch_campaign",
        effect: "REQUIRE_ENV_ENABLED",
        envFlag: GOVERNANCE_ENV_FLAGS.META_ADS_LAUNCH,
        priority: 820,
      },
      metadata: { tier: "core" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.FOUNDER_SOVEREIGNTY,
      workspaceId,
      title: "Founder Sovereignty",
      statement: "Grand King founder retains final authority over live capital and deployment actions.",
      status: "ACTIVE",
      version: 1,
      executablePolicy: {
        domain: "deployment",
        module: "production-deploy",
        action: "execute_vercel",
        effect: "REQUIRE_FOUNDER_APPROVAL",
        requiredRole: "founder",
        priority: 900,
      },
      metadata: { tier: "core" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.SANDBOX_FIRST,
      workspaceId,
      title: "Sandbox First",
      statement: "Revenue validation and new loops must prove sandbox success before production.",
      status: "ACTIVE",
      version: 1,
      executablePolicy: {
        domain: "grandKings",
        module: "first-revenue-validation",
        action: "run",
        effect: "SANDBOX_ONLY",
        priority: 250,
      },
      metadata: { tier: "operational" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.REVENUE_TRUTH,
      workspaceId,
      title: "Revenue Truth",
      statement: "All revenue claims must be ledger-backed — no vanity metrics without financial truth.",
      status: "ACTIVE",
      version: 1,
      metadata: { tier: "operational", enforceVia: "soul-runtime" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.LIVING_SOUL,
      workspaceId,
      title: "Living Soul",
      statement: "The Soul File is living identity and continuity — not a backup or static config.",
      status: "ACTIVE",
      version: 1,
      metadata: { tier: "foundation", enforceVia: "soul-file" },
    }),
    doctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.EA_EXECUTION,
      workspaceId,
      title: "EA Execution Doctrine",
      statement:
        "LIVE-010 onwards: Grand King's Account first; package-based architecture; human approval gates; explainability; traceability; capital protection; no logic duplication; E-commerce OS integration.",
      status: "ACTIVE",
      version: 1,
      executablePolicy: {
        domain: "grandKings",
        module: "*",
        action: "irreversible_execution",
        effect: "REQUIRE_FOUNDER_APPROVAL",
        requiredRole: "founder",
        priority: 980,
      },
      metadata: {
        tier: "core",
        appliesFrom: "LIVE-010",
        principles: "grand_king_first,package_architecture,approval_gates,explainability,traceability,capital_protection,no_duplication,ecommerce_os",
      },
    }),
  ];
}
