import { randomUUID } from "node:crypto";

import type { ExecutiveSignal, ExecutiveSignalType, ExecutiveObservation } from "../models/surveillance-core.js";
import type { ExecutiveWatcher } from "../models/surveillance-core.js";
import { collectModuleObservations, type ModuleObservationSnapshot } from "./cross-module-observer.js";
import { enrichSignalWithPriority, rankSignals } from "./priority-engine-service.js";
import { getActiveWatchers } from "./watcher-registry-service.js";
import { getExecutiveSurveillanceRepository } from "../repositories/sqlite-ess-repository.js";

const RISK_TYPES: ExecutiveSignalType[] = ["RISK", "WARNING", "ANOMALY", "SUPPLIER_CONCERN", "MARKETPLACE_CONCERN", "CUSTOMER_CONCERN"];
const OPPORTUNITY_TYPES: ExecutiveSignalType[] = ["OPPORTUNITY", "GROWTH_OPPORTUNITY", "EXPANSION_OPPORTUNITY", "COST_SAVING"];

function inferSignalType(watcher: ExecutiveWatcher, obs: ModuleObservationSnapshot): ExecutiveSignalType {
  const readiness = Number(obs.metrics.readiness ?? obs.metrics.commercialConfidence ?? obs.metrics.score ?? 50);
  const waiting = Number(obs.metrics.awaitingReview ?? obs.metrics.waitingFounder ?? obs.metrics.awaitingKing ?? 0);
  const critical = Number(obs.metrics.critical ?? 0);

  if (watcher.domain === "risk" || critical > 0) return readiness < 40 ? "RISK" : "WARNING";
  if (watcher.domain === "expansion") return readiness >= 60 ? "EXPANSION_OPPORTUNITY" : "TREND";
  if (watcher.domain === "supply_chain" && waiting > 0) return "SUPPLIER_CONCERN";
  if (watcher.domain === "marketplace" && readiness < 50) return "MARKETPLACE_CONCERN";
  if (watcher.domain === "customer") return waiting > 3 ? "CUSTOMER_CONCERN" : "TREND";
  if (watcher.domain === "finance") return readiness >= 60 ? "COST_SAVING" : "WARNING";
  if (readiness >= 65) return "OPPORTUNITY";
  if (readiness >= 50) return "GROWTH_OPPORTUNITY";
  if (waiting > 5) return "ANOMALY";
  return "TREND";
}

function watcherObservations(watcher: ExecutiveWatcher, observations: ModuleObservationSnapshot[]): ModuleObservationSnapshot[] {
  return observations.filter((o) => watcher.watchedModules.includes(o.moduleId));
}

/** ESS-003 — Signal Engine. */
export function runExecutiveSurveillance(workspaceId: string, companyId: string): {
  observations: ExecutiveObservation[];
  signals: ExecutiveSignal[];
} {
  const repo = getExecutiveSurveillanceRepository();
  const watchers = getActiveWatchers(workspaceId, companyId);
  const moduleObs = collectModuleObservations(workspaceId, companyId);
  const observations: ExecutiveObservation[] = [];
  const signals: ExecutiveSignal[] = [];

  for (const watcher of watchers) {
    const relevant = watcherObservations(watcher, moduleObs);
    if (relevant.length === 0) continue;

    const obs: ExecutiveObservation = {
      observationId: randomUUID(),
      watcherId: watcher.watcherId,
      moduleId: relevant.map((r) => r.moduleId).join(","),
      summary: `${watcher.title} observed ${relevant.length} module(s): ${relevant.map((r) => r.label).join(", ")}`,
      signalsEmitted: 0,
      observedAt: new Date().toISOString(),
    };

    for (const mod of relevant) {
      const signalType = inferSignalType(watcher, mod);
      const confidence = Math.min(95, Math.max(40, 50 + (relevant.length * 8) + (RISK_TYPES.includes(signalType) ? 10 : 0)));

      const raw = enrichSignalWithPriority({
        signalId: randomUUID(),
        watcherId: watcher.watcherId,
        watcherTitle: watcher.title,
        signalType,
        title: `${watcher.title}: ${mod.label}`,
        summary: mod.summary,
        confidence,
        evidence: mod.evidence,
        affectedModules: [mod.moduleId],
        emittedAt: new Date().toISOString(),
      });

      signals.push(raw);
      obs.signalsEmitted += 1;
    }

    observations.push(obs);
    repo.saveObservation(obs, workspaceId, companyId);
  }

  for (const signal of signals) {
    repo.saveSignal(signal, workspaceId, companyId);
  }

  return { observations, signals: rankSignals(signals) };
}

export function listActiveSignals(workspaceId: string, companyId: string): ExecutiveSignal[] {
  return getExecutiveSurveillanceRepository().listSignals(workspaceId, companyId);
}

export function filterSignalsByType(signals: ExecutiveSignal[], types: ExecutiveSignalType[]): ExecutiveSignal[] {
  return signals.filter((s) => types.includes(s.signalType));
}

export function getRiskSignals(signals: ExecutiveSignal[]): ExecutiveSignal[] {
  return signals.filter((s) => RISK_TYPES.includes(s.signalType));
}

export function getOpportunitySignals(signals: ExecutiveSignal[]): ExecutiveSignal[] {
  return signals.filter((s) => OPPORTUNITY_TYPES.includes(s.signalType));
}

export function getExpansionSignals(signals: ExecutiveSignal[]): ExecutiveSignal[] {
  return signals.filter((s) => s.signalType === "EXPANSION_OPPORTUNITY" || s.signalType === "GROWTH_OPPORTUNITY");
}
