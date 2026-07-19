/** R4-19 — End-to-end customer workflow test runner. */

import { appendCocLog } from "./coc-logging.js";
import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";

export type EndToEndValidationResult = {
  result: "pass" | "partial" | "fail";
  evidenceReferences: string[];
  errors: string[];
  warnings: string[];
};

export class EndToEndCustomerTestRunner {
  async run(
    ctx: CustomerOperationsCertificationContext,
    config: CustomerOperationsCertificationConfiguration,
  ): Promise<EndToEndValidationResult> {
    const evidenceReferences: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.safeTestMode) {
      warnings.push("End-to-end validation skipped — safe test mode disabled");
      return { result: "partial", evidenceReferences, errors, warnings };
    }

    appendCocLog({
      event: "e2e_validation_start",
      level: "info",
      details: "End-to-end customer workflow validation started",
    });

    try {
      if (!ctx.customerIdentityEngine || !ctx.crmFoundation || !ctx.customerTimelineEngine) {
        errors.push("Identity, CRM or timeline engine unavailable for E2E workflow");
      } else if (config.includeSmokeTests) {
        ctx.customerIdentityEngine.connectCustomerIdentityEngine();
        ctx.crmFoundation.connectCrmFoundation();
        ctx.customerTimelineEngine.connectCustomerTimelineEngine();
        evidenceReferences.push("customer-identity-engine:connect");
        evidenceReferences.push("crm-foundation:connect");
        evidenceReferences.push("customer-timeline-engine:connect");
      }

      if (!ctx.emailCommunicationEngine) {
        warnings.push("Email communication unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.emailCommunicationEngine.connectEmailCommunicationEngine();
        evidenceReferences.push("email-communication-engine:connect");
      }

      if (!ctx.aiCustomerSupport) {
        warnings.push("AI customer support unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.aiCustomerSupport.connectAiCustomerSupport();
        evidenceReferences.push("ai-customer-support:connect");
      }

      if (!ctx.customerSentimentEngine) {
        warnings.push("Customer sentiment engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.customerSentimentEngine.connectCustomerSentimentEngine();
        evidenceReferences.push("customer-sentiment-engine:connect");
      }

      if (!ctx.customerSegmentationEngine) {
        warnings.push("Customer segmentation engine unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.customerSegmentationEngine.connectSegmentationEngine();
        evidenceReferences.push("customer-segmentation-engine:connect");
      }

      if (!ctx.customerJourneyIntelligenceEngine) {
        warnings.push("Customer journey intelligence unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.customerJourneyIntelligenceEngine.connectJourneyIntelligenceEngine();
        evidenceReferences.push("customer-journey-intelligence-engine:connect");
      }

      if (!ctx.executiveCustomerDashboard) {
        warnings.push("Executive customer dashboard unavailable — partial E2E");
      } else if (config.includeSmokeTests) {
        ctx.executiveCustomerDashboard.connectExecutiveCustomerDashboard();
        ctx.executiveCustomerDashboard.refreshExecutiveCustomerDashboard({ forceRefresh: true });
        evidenceReferences.push("executive-customer-dashboard:refresh");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "E2E workflow failed");
    }

    const result = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    appendCocLog({
      event: "e2e_validation_complete",
      level: result === "fail" ? "warn" : "info",
      details: `E2E result=${result} evidence=${evidenceReferences.length}`,
    });

    return { result, evidenceReferences, errors, warnings };
  }
}
