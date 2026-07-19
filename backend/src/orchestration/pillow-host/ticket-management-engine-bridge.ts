import { buildTicketManagementEngineConfiguration } from "@empireai/pillow";
import type { TicketManagementEngineState, TicketRunReport } from "@empireai/pillow";

function buildOfflineTicketManagementEngineState(): TicketManagementEngineState {
  const configuration = buildTicketManagementEngineConfiguration();
  return {
    engineVersion: "PILLOW-TME-001",
    missionId: "R4-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalTickets: 0,
      openTickets: 0,
      assignedTickets: 0,
      resolvedTickets: 0,
      overdueTickets: 0,
      stalledTickets: 0,
      failedTickets: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      ticketsCreated: 0,
      categoriesClassified: 0,
      prioritiesAssigned: 0,
      ownershipAssigned: 0,
      lifecycleUpdates: 0,
      customerLinks: 0,
      conversationLinks: 0,
      timelineLinks: 0,
      overdueDetected: 0,
      stalledDetected: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Ticket Management Engine snapshot when Pillow session is unavailable. */
export function collectTicketManagementEngineSnapshot() {
  const engine = buildOfflineTicketManagementEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalTickets: 0,
      openTickets: 0,
      assignedTickets: 0,
      resolvedTickets: 0,
      overdueTickets: 0,
      stalledTickets: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      aiCustomerSupportConnected: false,
      recentLogs: [],
    },
    latestReport: null as TicketRunReport | null,
    ticketRecords: [],
  };
}
