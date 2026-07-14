/** T5-02 — UX Audit Engine — aggregates issue detectors. */

import type { ObservationRecord } from "../continuous-screen-observation-engine/types.js";
import type { AutonomousUxAuditConfiguration } from "./configuration.js";
import { AccessibilityIssueDetector } from "./accessibility-issue-detector.js";
import { ComponentIssueDetector } from "./component-issue-detector.js";
import { LayoutIssueDetector } from "./layout-issue-detector.js";
import { NavigationIssueDetector } from "./navigation-issue-detector.js";
import { StateIssueDetector } from "./state-issue-detector.js";
import { VisualConsistencyIssueDetector } from "./visual-consistency-issue-detector.js";
import { WorkflowIssueDetector } from "./workflow-issue-detector.js";
import type { AutonomousUxAuditEngineBundle, DetectedUxIssue } from "./types.js";

export class UxAuditEngine {
  private readonly layoutDetector = new LayoutIssueDetector();
  private readonly componentDetector = new ComponentIssueDetector();
  private readonly navigationDetector = new NavigationIssueDetector();
  private readonly workflowDetector = new WorkflowIssueDetector();
  private readonly accessibilityDetector = new AccessibilityIssueDetector();
  private readonly consistencyDetector = new VisualConsistencyIssueDetector();
  private readonly stateDetector = new StateIssueDetector();

  detectIssues(input: {
    engines: AutonomousUxAuditEngineBundle;
    observation: ObservationRecord | null;
    config: AutonomousUxAuditConfiguration;
  }): DetectedUxIssue[] {
    if (!input.config.issueDetectionRulesEnabled) return [];

    const issues: DetectedUxIssue[] = [
      ...this.layoutDetector.detect(input.engines),
      ...this.componentDetector.detect(input.engines),
      ...this.navigationDetector.detect(input.engines, input.observation),
      ...this.workflowDetector.detect(input.engines),
      ...this.accessibilityDetector.detect(input.engines),
      ...this.consistencyDetector.detect(input.engines),
      ...this.stateDetector.detect(input.observation),
    ];

    if (input.config.severityRulesEnabled) {
      return issues;
    }

    return issues.map((issue) => ({ ...issue, severity: "medium" }));
  }
}
