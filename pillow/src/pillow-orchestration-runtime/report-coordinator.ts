import { appendPorLog } from "./por-logging.js";
import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { InvocationResult, PorInput, ReportRequestDescriptor } from "./types.js";

export class ReportCoordinator {
  retrieve(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    sessionId: string,
    requestId: string,
    descriptor: ReportRequestDescriptor,
    _input: PorInput,
  ): InvocationResult {
    const invocationId = nextPorId("por-inv-report");
    const timestamp = new Date().toISOString();
    const deps = integrations.getDependencies();
    const handler =
      deps.executiveReportingRuntime?.retrieveReport ?? deps.executiveReportingRuntime?.getReport;

    store.saveInvocation({
      invocationId,
      kind: "report",
      sessionId,
      requestId,
      timestamp,
      descriptor: { ...descriptor },
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
      neverFabricateExecutionResults: true,
    });

    if (handler) {
      const handlerResult = handler({ reportType: descriptor.reportType, sessionId, requestId }) as Record<
        string,
        unknown
      > | null;
      const reportId = handlerResult?.reportId ?? handlerResult?.id;
      const result: InvocationResult = {
        invocationId,
        kind: "report",
        status: reportId ? "succeeded" : "structural_recorded",
        timestamp,
        handlerInvoked: true,
        fabricated: false,
        evidence: [`report_retrieved:${descriptor.reportType}`, reportId ? `reportId:${reportId}` : "no_report_id"],
        notes: reportId
          ? [`Executive report ${descriptor.reportType} retrieved via ERR DI`]
          : [`ERR handler invoked but no reportId returned — recorded structurally`],
        metadataVersion: POR_METADATA_VERSION,
        structuralSignalOnly: true,
      };
      store.saveResult(result);
      appendPorLog({ event: "retrieve_report", details: `${descriptor.reportType}:${result.status}` });
      return result;
    }

    const result: InvocationResult = {
      invocationId,
      kind: "report",
      status: "structural_recorded",
      timestamp,
      handlerInvoked: false,
      fabricated: false,
      evidence: [`report_structural:${descriptor.reportType}`],
      notes: [
        `Structural executive report request recorded for ${descriptor.reportType}`,
        "No ERR DI handler available — never fabricates report content",
      ],
      metadataVersion: POR_METADATA_VERSION,
      structuralSignalOnly: true,
    };
    store.saveResult(result);
    appendPorLog({ event: "retrieve_report_structural", details: descriptor.reportType });
    return result;
  }
}
