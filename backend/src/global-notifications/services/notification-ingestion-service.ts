import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import { listActiveSignals } from "../../executive-surveillance/services/signal-engine-service.js";
import { buildSurveillanceDashboard } from "../../executive-surveillance/services/surveillance-dashboard-service.js";
import { collectModuleObservations } from "../../executive-surveillance/services/cross-module-observer.js";
import { buildEyeSeriesDashboard } from "../../orchestration/eye-series/services/eye-series-service.js";
import type { GlobalNotification, GlobalNotificationType } from "../models/global-notification.js";
import { inferTypeFromSignalPriority, priorityForType } from "../models/global-notification.js";
import { getGlobalNotificationRepository } from "../repositories/sqlite-global-notification-repository.js";
import { DEEP_LINKS, moduleDeepLink } from "../deep-links.js";

type Draft = Omit<GlobalNotification, "notificationId" | "readAt" | "acknowledgedAt">;

function draft(input: Omit<Draft, "priority" | "createdAt"> & { type: GlobalNotificationType }): Draft {
  const now = new Date().toISOString();
  return {
    ...input,
    priority: priorityForType(input.type),
    createdAt: now,
  };
}

function upsertDraft(draftNotification: Draft): GlobalNotification {
  const repo = getGlobalNotificationRepository();
  const existing = repo.getBySourceRef(
    draftNotification.workspaceId,
    draftNotification.companyId,
    draftNotification.sourceRef,
  );
  const notification: GlobalNotification = {
    ...draftNotification,
    notificationId: existing?.notificationId ?? repo.createId(),
    readAt: existing?.readAt ?? null,
    acknowledgedAt: existing?.acknowledgedAt ?? null,
    createdAt: existing?.createdAt ?? draftNotification.createdAt,
  };
  return repo.upsert(notification);
}

function ingestEss(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const dashboard = buildSurveillanceDashboard(workspaceId, companyId);
    for (const signal of dashboard.signals.slice(0, 20)) {
      const type =
        signal.priority === "CRITICAL"
          ? "critical"
          : signal.signalType.includes("RISK") || signal.signalType.includes("CONCERN")
            ? "error"
            : inferTypeFromSignalPriority(signal.priority);
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type,
            source: "executive-surveillance",
            title: signal.title,
            body: signal.summary,
            deepLink: moduleDeepLink(signal.affectedModules[0] ?? "executive-surveillance"),
            sourceRef: `executive-surveillance:signal:${signal.signalId}`,
            metadata: { signalType: signal.signalType, watcherId: signal.watcherId },
          }),
        ),
      );
    }

    for (const risk of dashboard.activeRisks.slice(0, 10)) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "critical",
            source: "executive-surveillance",
            title: risk.title,
            body: risk.summary,
            deepLink: DEEP_LINKS["executive-surveillance"] as string,
            sourceRef: `executive-surveillance:risk:${risk.signalId}`,
            metadata: { signalType: risk.signalType },
          }),
        ),
      );
    }
  } catch {
    // ESS optional during bootstrap
  }
  return results;
}

function ingestEyeSeries(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const eye = buildEyeSeriesDashboard(workspaceId, companyId);
    for (const [index, alert] of eye.urgentAlerts.slice(0, 10).entries()) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "warning",
            source: "eye-series",
            title: typeof alert === "string" ? alert : String(alert),
            body: "Urgent alert from EmpireAI Eye intelligence cycle",
            deepLink: DEEP_LINKS["eye-series"] as string,
            sourceRef: `eye-series:urgent:${index}:${typeof alert === "string" ? alert.slice(0, 48) : "alert"}`,
          }),
        ),
      );
    }

    for (const [index, risk] of eye.topRisks.slice(0, 10).entries()) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "error",
            source: "eye-series",
            title: typeof risk === "string" ? risk : String(risk),
            body: "Top risk surfaced by Eye Series surveillance",
            deepLink: DEEP_LINKS["eye-series"] as string,
            sourceRef: `eye-series:risk:${index}:${typeof risk === "string" ? risk.slice(0, 48) : "risk"}`,
          }),
        ),
      );
    }

    for (const [index, rec] of eye.executiveRecommendations.slice(0, 5).entries()) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "executive",
            source: "eye-series",
            title: typeof rec === "string" ? rec : String(rec),
            body: "Executive recommendation from Eye Series briefing",
            deepLink: DEEP_LINKS["eye-series"] as string,
            sourceRef: `eye-series:exec:${index}:${typeof rec === "string" ? rec.slice(0, 48) : "rec"}`,
          }),
        ),
      );
    }
  } catch {
    // Eye optional
  }
  return results;
}

function ingestRealModules(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const observations = collectModuleObservations(workspaceId, companyId);
    for (const obs of observations) {
      const readiness = Number(obs.metrics.readiness ?? obs.metrics.commercialConfidence ?? obs.metrics.score ?? 50);
      const critical = Number(obs.metrics.critical ?? 0);
      const blocked = Number(obs.metrics.blocked ?? 0);
      const risks = Number(obs.metrics.risks ?? 0);

      let type: GlobalNotificationType = "information";
      if (critical > 0 || readiness < 35) type = "critical";
      else if (blocked > 0 || risks > 0 || readiness < 50) type = "warning";
      else if (readiness >= 70) type = "success";

      const source =
        obs.moduleId === "reality-integration" ? "reality-integration" : ("commerce-runtime" as const);

      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type,
            source,
            title: obs.label,
            body: obs.summary,
            deepLink: moduleDeepLink(obs.moduleId),
            sourceRef: `real-module:${obs.moduleId}`,
            metadata: { moduleId: obs.moduleId, metrics: obs.metrics },
          }),
        ),
      );
    }
  } catch {
    // REAL modules optional
  }
  return results;
}

function ingestExecutiveCouncil(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const hq = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
    for (const rec of hq.recommendationsAwaitingKing.slice(0, 10)) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "executive",
            source: "executive-council",
            title: `Council recommendation: ${rec.topic}`,
            body: rec.majorityRecommendation ?? "Review council recommendation",
            deepLink: "/dashboard/approvals",
            sourceRef: `executive-council:rec:${rec.decisionId}`,
            metadata: { consensus: rec.consensus },
          }),
        ),
      );
    }

    for (const disagreement of hq.disagreements.slice(0, 5)) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "warning",
            source: "executive-council",
            title: `Council disagreement: ${disagreement.topic}`,
            body: `${disagreement.opposingExecutives.length} executives in conflict — review debate`,
            deepLink: DEEP_LINKS["executive-council"] as string,
            sourceRef: `executive-council:conflict:${disagreement.conflictId}`,
          }),
        ),
      );
    }

    if (hq.generatedMissions.length > 0) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "executive",
            source: "grand-king",
            title: `${hq.generatedMissions.length} mission(s) awaiting the King`,
            body: "Executive Council missions require Grand King approval",
            deepLink: "/dashboard/approvals",
            sourceRef: `grand-king:awaiting:${hq.generatedMissions.length}`,
          }),
        ),
      );
    }
  } catch {
    // Council optional
  }
  return results;
}

function ingestPillow(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const signals = listActiveSignals(workspaceId, companyId);
    const pillowSignals = signals.filter((s) =>
      s.affectedModules.some((m) => m.includes("pillow") || s.title.toLowerCase().includes("pillow")),
    );
    for (const signal of pillowSignals.slice(0, 5)) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "information",
            source: "pillow",
            title: signal.title,
            body: signal.summary,
            deepLink: DEEP_LINKS.pillow as string,
            sourceRef: `pillow:signal:${signal.signalId}`,
          }),
        ),
      );
    }

    results.push(
      upsertDraft(
        draft({
          workspaceId,
          companyId,
          type: "information",
          source: "pillow",
          title: "Pillow executive assistant available",
          body: "Open Pillow for Grand King conversation and approval workflows",
          deepLink: DEEP_LINKS.pillow as string,
          sourceRef: `pillow:status:${companyId}`,
        }),
      ),
    );
  } catch {
    // Pillow optional
  }
  return results;
}

function ingestUxMissionHome(workspaceId: string, companyId: string): GlobalNotification[] {
  const results: GlobalNotification[] = [];
  try {
    const signals = listActiveSignals(workspaceId, companyId);
    const criticalCount = signals.filter((s) => s.priority === "CRITICAL").length;
    if (criticalCount > 0) {
      results.push(
        upsertDraft(
          draft({
            workspaceId,
            companyId,
            type: "critical",
            source: "ux",
            title: `${criticalCount} critical item(s) on Mission Home`,
            body: "Review Mission Home critical notifications panel",
            deepLink: DEEP_LINKS.ux as string,
            sourceRef: `ux:mission-critical:${criticalCount}`,
          }),
        ),
      );
    }
  } catch {
    // UX bridge optional
  }
  return results;
}

/** GC-03 — Pull notifications from ESS, Eye, REAL, Council, Pillow, and UX modules. */
export function ingestNotificationsFromSources(workspaceId: string, companyId: string): GlobalNotification[] {
  return [
    ...ingestEss(workspaceId, companyId),
    ...ingestEyeSeries(workspaceId, companyId),
    ...ingestRealModules(workspaceId, companyId),
    ...ingestExecutiveCouncil(workspaceId, companyId),
    ...ingestPillow(workspaceId, companyId),
    ...ingestUxMissionHome(workspaceId, companyId),
  ];
}

export function seedDemoNotification(workspaceId: string, companyId: string): GlobalNotification {
  return upsertDraft(
    draft({
      workspaceId,
      companyId,
      type: "information",
      source: "executive-surveillance",
      title: "Global Notification System online",
      body: "GC-03 notifications center is connected to ESS and Eye Series feeds",
      deepLink: DEEP_LINKS["executive-surveillance"] as string,
      sourceRef: `executive-surveillance:gc03-bootstrap:${companyId}`,
    }),
  );
}
