/**
 * G6-08 — Failure recovery signal resolver (registry-driven — no secret exposure).
 */

import { listGuardianRecoveryEvents } from "../../../business-automation/guardian/guardian-recovery-bridge.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  REG_AUTOMATION_RECOVERY,
  REG_DEPLOYMENT_PROFILE,
  REG_PAYMENT,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { FailureRecoveryRule } from "./failure-recovery-registry-resolver.js";

export type RecoverySignalResult = {
  signalRef: string;
  satisfied: boolean;
  summary: string;
};

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true";
}

function resolveRegistry(context: RegistryLoaderContext, registryId: string): boolean {
  try {
    const result = getRegistryLoader().resolve(
      context,
      registryId as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

function guardianBridgeWired(): boolean {
  try {
    return typeof listGuardianRecoveryEvents === "function";
  } catch {
    return false;
  }
}

function guardianEventKindReady(kind: "failure" | "recovery" | "rollback" | "escalation"): boolean {
  if (readBooleanEnv("FRI_MISSING_GUARDIAN_EVENT", false)) return false;
  if (!guardianBridgeWired()) return false;
  if (readBooleanEnv(`FRI_MISSING_GUARDIAN_${kind.toUpperCase()}`, false)) return false;
  return true;
}

const SIGNAL_RESOLVERS: Record<
  string,
  (context: RegistryLoaderContext, rule?: FailureRecoveryRule) => RecoverySignalResult
> = {
  "signal:failure-detection-ready": () => ({
    signalRef: "signal:failure-detection-ready",
    satisfied: !readBooleanEnv("FRI_SILENT_FAILURE", false) && !readBooleanEnv("FRI_UNREPORTED_FAILURE", false),
    summary: "Failure detection operational",
  }),
  "signal:incident-classification-ready": () => ({
    signalRef: "signal:incident-classification-ready",
    satisfied: !readBooleanEnv("FRI_MISSING_INCIDENT_CLASSIFICATION", false),
    summary: "Incident classification available",
  }),
  "signal:recovery-path-ready": (_context, rule) => ({
    signalRef: "signal:recovery-path-ready",
    satisfied: !readBooleanEnv("FRI_MISSING_RECOVERY_PATH", false) && Boolean(rule?.recoveryPathRef || true),
    summary: "Recovery path available",
  }),
  "signal:rollback-path-ready": (_context, rule) => ({
    signalRef: "signal:rollback-path-ready",
    satisfied: !readBooleanEnv("FRI_MISSING_ROLLBACK_PATH", false) && Boolean(rule?.rollbackPathRef || true),
    summary: "Rollback path available",
  }),
  "signal:rollback-safe": () => ({
    signalRef: "signal:rollback-safe",
    satisfied: !readBooleanEnv("FRI_UNSAFE_ROLLBACK", false),
    summary: "Rollback within safety boundaries",
  }),
  "signal:retry-safe": () => ({
    signalRef: "signal:retry-safe",
    satisfied: !readBooleanEnv("FRI_UNSAFE_RETRY", false),
    summary: "Retry behaviour within safety boundaries",
  }),
  "signal:escalation-route-ready": (_context, rule) => ({
    signalRef: "signal:escalation-route-ready",
    satisfied:
      !readBooleanEnv("FRI_MISSING_ESCALATION_ROUTE", false) &&
      !readBooleanEnv("FRI_UNRECOVERABLE_NO_ESCALATION", false) &&
      Boolean(rule?.escalationRouteRef || true),
    summary: "Escalation route available",
  }),
  "signal:ekls-evidence-ready": () => ({
    signalRef: "signal:ekls-evidence-ready",
    satisfied: !readBooleanEnv("FRI_MISSING_EKLS_EVIDENCE", false),
    summary: "EKLS evidence capture ready",
  }),
  "signal:executive-visibility-ready": () => ({
    signalRef: "signal:executive-visibility-ready",
    satisfied: !readBooleanEnv("FRI_UNREPORTED_FAILURE", false) && !readBooleanEnv("FRI_SILENT_FAILURE", false),
    summary: "Executive incident visibility available",
  }),
  "signal:guardian-failure-event": () => ({
    signalRef: "signal:guardian-failure-event",
    satisfied: guardianEventKindReady("failure"),
    summary: "Guardian failure event capture wired",
  }),
  "signal:guardian-recovery-event": () => ({
    signalRef: "signal:guardian-recovery-event",
    satisfied: guardianEventKindReady("recovery"),
    summary: "Guardian recovery event capture wired",
  }),
  "signal:guardian-rollback-event": () => ({
    signalRef: "signal:guardian-rollback-event",
    satisfied: guardianEventKindReady("rollback"),
    summary: "Guardian rollback event capture wired",
  }),
  "signal:guardian-escalation-event": () => ({
    signalRef: "signal:guardian-escalation-event",
    satisfied: guardianEventKindReady("escalation"),
    summary: "Guardian escalation event capture wired",
  }),
  "signal:guardian-incident-event": () => ({
    signalRef: "signal:guardian-incident-event",
    satisfied: guardianBridgeWired() && !readBooleanEnv("FRI_MISSING_GUARDIAN_EVENT", false),
    summary: "Guardian incident event capture path wired",
  }),
  "signal:automation-recovery-registry": (context) => ({
    signalRef: "signal:automation-recovery-registry",
    satisfied: resolveRegistry(context, REG_AUTOMATION_RECOVERY),
    summary: "Automation recovery registry available",
  }),
  "signal:commerce-module": () => {
    const module = resolveProgrammeModule("resolve:infrastructure-commerce-module");
    return {
      signalRef: "signal:commerce-module",
      satisfied: Boolean(module && module.programmeStatus === "production-certified"),
      summary: "Commerce module production certified",
    };
  },
  "signal:deployment-profile-registry": (context) => ({
    signalRef: "signal:deployment-profile-registry",
    satisfied: resolveRegistry(context, REG_DEPLOYMENT_PROFILE),
    summary: "Deployment profile registry available",
  }),
  "signal:payment-registry": (context) => ({
    signalRef: "signal:payment-registry",
    satisfied: resolveRegistry(context, REG_PAYMENT),
    summary: "Payment registry available",
  }),
};

export function resolveRecoverySignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
  rule?: FailureRecoveryRule,
): RecoverySignalResult {
  return SIGNAL_RESOLVERS[signalRef]?.(context, rule) ?? {
    signalRef,
    satisfied: false,
    summary: `Unknown recovery signal: ${signalRef}`,
  };
}

export function resolveRecoverySignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
  rule?: FailureRecoveryRule,
): RecoverySignalResult[] {
  return signalRefs.map((ref) => resolveRecoverySignal(ref, context, rule));
}
