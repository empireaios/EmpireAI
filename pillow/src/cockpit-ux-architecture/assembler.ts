import {
  COCKPIT_CENTRES,
  COCKPIT_UX_PRINCIPLES,
  EXECUTIVE_HOME_FIELDS,
  COCKPIT_WIDGETS,
  REALTIME_DOMAINS,
  PILLOW_PUBLICATIONS,
  SUPERVISOR_PUBLICATIONS,
  GUARDIAN_PUBLICATIONS,
} from "./paths.js";
import type {
  CockpitUxArchitecture,
  CockpitCentreRecord,
  ExecutiveHomeMetric,
  CockpitWidgetRecord,
  RealtimeDomainRecord,
  PublicationFeed,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

const CENTRE_ROUTES: Record<string, { label: string; route: string; description: string }> = {
  executive_home: {
    label: "Executive Home",
    route: "/cockpit",
    description: "Empire health · mission · alerts · Pillow · one-screen awareness",
  },
  mission_centre: {
    label: "Mission Centre",
    route: "/cockpit/missions",
    description: "Active missions · progress · ETA · queue",
  },
  builder: {
    label: "Builder Console",
    route: "/cockpit/founder/builder",
    description: "Builder missions · repository · recovery",
  },
  supervisor: {
    label: "Supervisor Centre",
    route: "/cockpit/founder/supervisor",
    description: "Current mission · step · progress · mission health",
  },
  pillow: {
    label: "Pillow Centre",
    route: "/cockpit/development/pillow",
    description: "Executive intelligence · recommendations · architecture",
  },
  journey: {
    label: "Journey Centre",
    route: "/cockpit/founder/journey",
    description: "Roadmap · journey position · mission history",
  },
  production: {
    label: "Production Centre",
    route: "/cockpit/founder/production",
    description: "Production truth · deployment · browser verification",
  },
  business: {
    label: "Business Centre",
    route: "/cockpit/commerce/workspace",
    description: "Current business · portfolio · business health",
  },
  commerce: {
    label: "Commerce Centre",
    route: "/cockpit/commerce/operating",
    description: "Operating model · revenue · orders · marketing · growth",
  },
  guardian: {
    label: "Guardian Centre",
    route: "/cockpit/founder/guardian",
    description: "Runtime · infrastructure · performance · availability",
  },
  knowledge: {
    label: "Knowledge Centre",
    route: "/cockpit/founder/architecture",
    description: "Repository architecture · engineering intelligence",
  },
  settings: {
    label: "Settings",
    route: "/cockpit/governance/settings",
    description: "Governance · founder preferences",
  },
};

function buildCentres(input: {
  founderShell?: Record<string, unknown>;
}): CockpitCentreRecord[] {
  const workspaces = (input.founderShell?.workspaces as Array<{ id: string; status: string }>) ?? [];

  return COCKPIT_CENTRES.map((id) => {
    const meta = CENTRE_ROUTES[id];
    const ws = workspaces.find((w) => w.id === id || w.id === `${id}_workspace`);
    return {
      id,
      label: meta?.label ?? label(id),
      route: meta?.route ?? `/cockpit/${id}`,
      description: meta?.description ?? "Executive centre",
      status: ws?.status ?? "ready",
    };
  });
}

function buildExecutiveHome(input: {
  founderShell?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  eta?: Record<string, unknown>;
}): ExecutiveHomeMetric[] {
  const executiveHome = (input.founderShell?.executiveHome as Record<string, unknown>) ?? {};
  const context = (input.founderShell?.context as Record<string, unknown>) ?? {};

  const values: Record<string, { value: string; status: string }> = {
    empire_health: {
      value: String(input.founderShell?.shellHealth ?? "healthy"),
      status: String(input.founderShell?.shellHealth ?? "healthy"),
    },
    current_mission: {
      value: String(context.currentMission ?? executiveHome.missionStatus ?? input.journey?.currentMission ?? "—"),
      status: "active",
    },
    current_roadmap_item: {
      value: String(context.currentJourney ?? executiveHome.currentJourney ?? input.journey?.currentJourney ?? "—"),
      status: "tracking",
    },
    overall_progress: {
      value: String(input.supervisor?.progressPercent ?? input.supervisor?.progress ?? "—"),
      status: "in_progress",
    },
    eta: {
      value: String(input.eta?.remainingFormatted ?? input.supervisor?.eta ?? input.eta?.etaSummary ?? "—"),
      status: "countdown",
    },
    builder_status: {
      value: String(executiveHome.builderStatus ?? input.builder?.status ?? "—"),
      status: String(executiveHome.builderStatus ?? input.builder?.status ?? "standby"),
    },
    supervisor_status: {
      value: String(executiveHome.supervisorStatus ?? input.supervisor?.missionStatus ?? input.supervisor?.status ?? "—"),
      status: String(input.supervisor?.supervisorHealth ?? input.supervisor?.health ?? "supervising"),
    },
    guardian_status: {
      value: String(input.guardian?.overallHealth ?? input.guardian?.status ?? input.founderShell?.shellHealth ?? "—"),
      status: String(input.guardian?.overallHealth ?? "monitoring"),
    },
    pillow_recommendations: {
      value: String(
        (executiveHome.recommendations as string[] | undefined)?.length ??
          (input.founderShell?.executiveHome as { recommendations?: string[] })?.recommendations?.length ??
          0,
      ),
      status: "active",
    },
    current_business: {
      value: String(context.currentBusiness ?? executiveHome.businessStatus ?? "—"),
      status: "portfolio",
    },
    revenue: {
      value: String(executiveHome.revenue ?? "—"),
      status: "commerce",
    },
    production_health: {
      value: String(executiveHome.productionStatus ?? input.guardian?.productionHealth ?? "—"),
      status: "production",
    },
    alerts: {
      value: String((executiveHome.alerts as string[] | undefined)?.length ?? 0),
      status: Number((executiveHome.alerts as string[] | undefined)?.length ?? 0) > 0 ? "attention" : "clear",
    },
    pending_approvals: {
      value: String((executiveHome.pendingActions as string[] | undefined)?.length ?? 0),
      status: Number((executiveHome.pendingActions as string[] | undefined)?.length ?? 0) > 0 ? "pending" : "clear",
    },
  };

  return EXECUTIVE_HOME_FIELDS.map((field) => ({
    field,
    label: label(field),
    value: values[field]?.value ?? "—",
    status: values[field]?.status ?? "monitoring",
  }));
}

function buildWidgets(input: {
  founderShell?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  journey?: Record<string, unknown>;
}): CockpitWidgetRecord[] {
  const executiveHome = (input.founderShell?.executiveHome as Record<string, unknown>) ?? {};

  const summaries: Record<string, { status: string; summary: string; refreshMs: number }> = {
    empire_health: {
      status: String(input.founderShell?.shellHealth ?? "healthy"),
      summary: "Empire-wide executive health composite",
      refreshMs: 30_000,
    },
    mission_progress: {
      status: String(input.supervisor?.missionStatus ?? "active"),
      summary: String(input.supervisor?.currentStep ?? "Mission queue · OMS progress"),
      refreshMs: 15_000,
    },
    builder: {
      status: String(executiveHome.builderStatus ?? "ready"),
      summary: "Builder Console · repository · validation · recovery",
      refreshMs: 15_000,
    },
    supervisor: {
      status: String(input.supervisor?.supervisorHealth ?? input.supervisor?.health ?? "supervising"),
      summary: String(input.supervisor?.currentMission ?? "Mission supervision active"),
      refreshMs: 10_000,
    },
    journey: {
      status: "tracking",
      summary: String(input.journey?.currentJourney ?? "Constitutional roadmap position"),
      refreshMs: 60_000,
    },
    production: {
      status: String(executiveHome.productionStatus ?? "validated"),
      summary: "Production Truth · deployment · browser verification",
      refreshMs: 30_000,
    },
    business_health: {
      status: String(executiveHome.businessStatus ?? "building"),
      summary: "Business portfolio · factory · commerce",
      refreshMs: 30_000,
    },
    revenue: {
      status: "tracking",
      summary: String(executiveHome.revenue ?? "Commerce operating model"),
      refreshMs: 60_000,
    },
    notifications: {
      status: Number(contextAlerts(executiveHome)) > 0 ? "attention" : "clear",
      summary: `${contextAlerts(executiveHome)} alerts · Brain SSE + polling`,
      refreshMs: 15_000,
    },
    recommendations: {
      status: "active",
      summary: `${recCount(executiveHome)} Pillow recommendations published`,
      refreshMs: 15_000,
    },
    current_risks: {
      status: String(input.guardian?.overallHealth ?? "monitored"),
      summary: "Guardian runtime · infrastructure · availability",
      refreshMs: 15_000,
    },
  };

  return COCKPIT_WIDGETS.map((widget) => ({
    widget,
    label: label(widget),
    status: summaries[widget]?.status ?? "monitoring",
    summary: summaries[widget]?.summary ?? "Widget active",
    refreshMs: summaries[widget]?.refreshMs ?? 30_000,
  }));
}

function contextAlerts(executiveHome: Record<string, unknown>): number {
  return (executiveHome.alerts as string[] | undefined)?.length ?? 0;
}

function recCount(executiveHome: Record<string, unknown>): number {
  return (executiveHome.recommendations as string[] | undefined)?.length ?? 0;
}

function buildRealtimeDomains(): RealtimeDomainRecord[] {
  const configs: Record<string, { mode: RealtimeDomainRecord["mode"]; intervalMs: number; status: string }> = {
    mission_progress: { mode: "hybrid", intervalMs: 15_000, status: "active" },
    execution_state: { mode: "sse", intervalMs: 0, status: "active" },
    production_health: { mode: "poll", intervalMs: 30_000, status: "active" },
    business_health: { mode: "poll", intervalMs: 30_000, status: "active" },
    eta: { mode: "poll", intervalMs: 5_000, status: "active" },
    recovery: { mode: "sse", intervalMs: 0, status: "active" },
    alerts: { mode: "hybrid", intervalMs: 15_000, status: "active" },
    recommendations: { mode: "hybrid", intervalMs: 15_000, status: "active" },
  };

  return REALTIME_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    mode: configs[domain]?.mode ?? "poll",
    intervalMs: configs[domain]?.intervalMs ?? 30_000,
    status: configs[domain]?.status ?? "active",
  }));
}

function buildPillowPublications(input: {
  founderShell?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): PublicationFeed[] {
  const executiveHome = (input.founderShell?.executiveHome as Record<string, unknown>) ?? {};
  const recs = (executiveHome.recommendations as string[] | undefined) ?? [];
  const alerts = (executiveHome.alerts as string[] | undefined) ?? [];
  const vie = input.vie ?? {};

  return PILLOW_PUBLICATIONS.map((category) => {
    let items: string[] = [];
    switch (category) {
      case "recommendations":
        items = recs.slice(0, 5);
        break;
      case "warnings":
        items = alerts.slice(0, 5);
        break;
      case "architecture_findings":
        items = [String(vie.architectureAlignment ?? "Canonical architecture law active")];
        break;
      case "engineering_findings":
        items = [String(vie.repositoryAlignment ?? "Repository intelligence indexed")];
        break;
      case "business_findings":
        items = [String(vie.businessAlignment ?? "Business objective engine active")];
        break;
      case "vision_findings":
        items = (vie.currentRecommendations as string[] | undefined)?.slice(0, 3) ?? [
          String(vie.visionAlignment ?? "Vision aligned"),
        ];
        break;
      default:
        break;
    }
    return { source: "Pillow", category: label(category), items };
  });
}

function buildSupervisorPublications(input: {
  supervisor?: Record<string, unknown>;
}): PublicationFeed[] {
  const sup = input.supervisor ?? {};
  const map: Record<string, string[]> = {
    current_mission: [String(sup.currentMission ?? sup.missionId ?? "No active mission")],
    progress: [String(sup.progressPercent ?? sup.progress ?? "—")],
    current_step: [String(sup.currentStep ?? sup.step ?? "—")],
    eta: [String(sup.eta ?? sup.remainingTime ?? "—")],
    recovery: [String(sup.recoveryStatus ?? sup.recovery ?? "Standby")],
    mission_health: [String(sup.missionHealth ?? sup.supervisorHealth ?? sup.health ?? "Monitoring")],
  };

  return SUPERVISOR_PUBLICATIONS.map((category) => ({
    source: "Supervisor",
    category: label(category),
    items: map[category] ?? ["—"],
  }));
}

function buildGuardianPublications(input: {
  guardian?: Record<string, unknown>;
}): PublicationFeed[] {
  const g = input.guardian ?? {};
  const map: Record<string, string[]> = {
    runtime_health: [String(g.runtimeHealth ?? g.overallHealth ?? g.status ?? "Monitoring")],
    infrastructure_health: [String(g.infrastructureHealth ?? g.infrastructure ?? "Monitoring")],
    performance: [String(g.performance ?? g.performanceScore ?? "Within thresholds")],
    alerts: Array.isArray(g.alerts) ? (g.alerts as string[]).slice(0, 5) : [String(g.alertCount ?? "0")],
    availability: [String(g.availability ?? g.uptime ?? "Monitoring")],
  };

  return GUARDIAN_PUBLICATIONS.map((category) => ({
    source: "Guardian",
    category: label(category),
    items: map[category] ?? ["—"],
  }));
}

export function assembleCockpitUxArchitecture(input: {
  founderShell?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  eta?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): CockpitUxArchitecture {
  const executiveHome = buildExecutiveHome(input);
  const widgets = buildWidgets(input);
  const centres = buildCentres(input);
  const realtimeDomains = buildRealtimeDomains();

  const integratedCentres = centres.filter((c) => c.status === "ready").length;
  const score = Math.round((integratedCentres / centres.length) * 40 + 45);

  const pillowPublications = buildPillowPublications(input);
  const supervisorPublications = buildSupervisorPublications(input);
  const guardianPublications = buildGuardianPublications(input);

  const pillowAdvisory = [
    `Executive awareness: ${score}/100 (${healthLabel(score)})`,
    `${centres.length} executive centres · ${integratedCentres} ready`,
    `${widgets.length} canonical widgets · near real-time refresh`,
    `Real-time: Brain SSE + ${realtimeDomains.filter((d) => d.mode !== "sse").length} polling domains`,
    `Pillow publishes ${pillowPublications.reduce((n, p) => n + p.items.length, 0)} findings`,
    `Grand King understands Empire state within seconds on Executive Home`,
    `Ready for P7-03 Pillow UX`,
  ];

  return {
    architectureVersion: "P7-02",
    computedAt: new Date().toISOString(),
    cockpitSummary:
      "One permanent Executive Cockpit User Experience — the constitutional executive control centre providing immediate awareness of Empire health, missions, execution, production, business and recommendations without navigating multiple pages",
    empireHealth: `${score}/100 · ${healthLabel(score)}`,
    executiveAwarenessScore: score,
    navigationStatus: `${integratedCentres}/${centres.length} centres integrated · context preserved`,
    realtimeStatus: "Brain SSE + polling fallback · CockpitRealtimeBridge active",
    executiveHome,
    centres,
    widgets,
    realtimeDomains,
    pillowPublications,
    supervisorPublications,
    guardianPublications,
    uxPrinciples: [...COCKPIT_UX_PRINCIPLES],
    pillowAdvisory,
    integrations: {
      founderShell: input.founderShell ? "P7-01 · PILLOW-FS-001" : "standby",
      executiveHome: "SCR-001 · Executive Home command centre",
      brainSse: "Brain SSE · task_complete · workflow · escalation · approval",
      pillowCentre: "P7-03 successor · Pillow Centre",
      builderConsole: String(input.builder?.status ?? "P7-05 · Builder Console"),
      supervisorCentre: String(input.supervisor?.status ?? "Supervisor active"),
      guardianCentre: String(input.guardian?.status ?? input.guardian?.overallHealth ?? "Guardian monitoring"),
      journeyCentre: String(input.journey?.currentJourney ?? "Journey tracked"),
      commerceCentre: "Commerce · Business workspaces",
    },
    readyForP703: true,
  };
}

export function buildFallbackCockpitUxArchitecture(): CockpitUxArchitecture {
  return assembleCockpitUxArchitecture({});
}
