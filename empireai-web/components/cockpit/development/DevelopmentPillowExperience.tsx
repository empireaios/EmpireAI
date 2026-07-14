"use client";

import { useEffect, useRef, useState } from "react";
import { PlatformPageHeader, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DevelopmentSupervisorSystemPanel } from "@/components/cockpit/development/DevelopmentSupervisorSystemPanel";
import { DevelopmentBuilderMonitorPanel } from "@/components/cockpit/development/DevelopmentBuilderMonitorPanel";
import { DevelopmentEtaEnginePanel } from "@/components/cockpit/development/DevelopmentEtaEnginePanel";
import { DevelopmentAutonomousRecoveryPanel } from "@/components/cockpit/development/DevelopmentAutonomousRecoveryPanel";
import { DevelopmentZeroHumanAutomationPanel } from "@/components/cockpit/development/DevelopmentZeroHumanAutomationPanel";
import { DevelopmentFounderShellPanel } from "@/components/cockpit/development/DevelopmentFounderShellPanel";
import { DevelopmentVisionSyncPanel } from "@/components/cockpit/development/DevelopmentVisionSyncPanel";
import { DevelopmentContextSyncPanel } from "@/components/cockpit/development/DevelopmentContextSyncPanel";
import { DevelopmentRecoveryPanel } from "@/components/cockpit/development/DevelopmentRecoveryPanel";
import { DevelopmentBrowserTruthPanel } from "@/components/cockpit/development/DevelopmentBrowserTruthPanel";
import { DevelopmentVisualCapturePanel } from "@/components/cockpit/development/DevelopmentVisualCapturePanel";
import { DevelopmentUiStateMapperPanel } from "@/components/cockpit/development/DevelopmentUiStateMapperPanel";
import { DevelopmentComponentRecognitionPanel } from "@/components/cockpit/development/DevelopmentComponentRecognitionPanel";
import { DevelopmentLayoutUnderstandingPanel } from "@/components/cockpit/development/DevelopmentLayoutUnderstandingPanel";
import { DevelopmentNavigationMappingPanel } from "@/components/cockpit/development/DevelopmentNavigationMappingPanel";
import { DevelopmentInteractionTrackingPanel } from "@/components/cockpit/development/DevelopmentInteractionTrackingPanel";
import { DevelopmentContextAwarenessPanel } from "@/components/cockpit/development/DevelopmentContextAwarenessPanel";
import { DevelopmentVisualMemoryPanel } from "@/components/cockpit/development/DevelopmentVisualMemoryPanel";
import { DevelopmentSessionContinuityPanel } from "@/components/cockpit/development/DevelopmentSessionContinuityPanel";
import { DevelopmentVisualFoundationCertificationPanel } from "@/components/cockpit/development/DevelopmentVisualFoundationCertificationPanel";
import { DevelopmentUxRuleEnginePanel } from "@/components/cockpit/development/DevelopmentUxRuleEnginePanel";
import { DevelopmentDesignSystemIntelligencePanel } from "@/components/cockpit/development/DevelopmentDesignSystemIntelligencePanel";
import { DevelopmentExecutiveStyleLearningPanel } from "@/components/cockpit/development/DevelopmentExecutiveStyleLearningPanel";
import { DevelopmentLayoutEvaluationPanel } from "@/components/cockpit/development/DevelopmentLayoutEvaluationPanel";
import { DevelopmentWorkflowOptimizationPanel } from "@/components/cockpit/development/DevelopmentWorkflowOptimizationPanel";
import { DevelopmentAccessibilityIntelligencePanel } from "@/components/cockpit/development/DevelopmentAccessibilityIntelligencePanel";
import { DevelopmentVisualConsistencyPanel } from "@/components/cockpit/development/DevelopmentVisualConsistencyPanel";
import { DevelopmentUxScoringPanel } from "@/components/cockpit/development/DevelopmentUxScoringPanel";
import { DevelopmentRecommendationEnginePanel } from "@/components/cockpit/development/DevelopmentRecommendationEnginePanel";
import { DevelopmentUxIntelligenceCertificationPanel } from "@/components/cockpit/development/DevelopmentUxIntelligenceCertificationPanel";
import { DevelopmentFrontendBuilderPanel } from "@/components/cockpit/development/DevelopmentFrontendBuilderPanel";
import { DevelopmentComponentGeneratorPanel } from "@/components/cockpit/development/DevelopmentComponentGeneratorPanel";
import { DevelopmentLayoutRefactoringPanel } from "@/components/cockpit/development/DevelopmentLayoutRefactoringPanel";
import { DevelopmentThemeBuilderPanel } from "@/components/cockpit/development/DevelopmentThemeBuilderPanel";
import { DevelopmentPreviewGeneratorPanel } from "@/components/cockpit/development/DevelopmentPreviewGeneratorPanel";
import { DevelopmentValidationEnginePanel } from "@/components/cockpit/development/DevelopmentValidationEnginePanel";
import { DevelopmentRegressionProtectionPanel } from "@/components/cockpit/development/DevelopmentRegressionProtectionPanel";
import { DevelopmentRollbackManagerPanel } from "@/components/cockpit/development/DevelopmentRollbackManagerPanel";
import { DevelopmentChangeDocumentationPanel } from "@/components/cockpit/development/DevelopmentChangeDocumentationPanel";
import { DevelopmentAutonomousBuilderCertificationPanel } from "@/components/cockpit/development/DevelopmentAutonomousBuilderCertificationPanel";
import { DevelopmentNaturalUxConversationPanel } from "@/components/cockpit/development/DevelopmentNaturalUxConversationPanel";
import { DevelopmentVoiceUxCommandsPanel } from "@/components/cockpit/development/DevelopmentVoiceUxCommandsPanel";
import { DevelopmentScreenAnnotationPanel } from "@/components/cockpit/development/DevelopmentScreenAnnotationPanel";
import { DevelopmentMultiProposalGeneratorPanel } from "@/components/cockpit/development/DevelopmentMultiProposalGeneratorPanel";
import { DevelopmentSideBySideComparisonPanel } from "@/components/cockpit/development/DevelopmentSideBySideComparisonPanel";
import { DevelopmentExplainDecisionsPanel } from "@/components/cockpit/development/DevelopmentExplainDecisionsPanel";
import { DevelopmentApprovalWorkflowPanel } from "@/components/cockpit/development/DevelopmentApprovalWorkflowPanel";
import { DevelopmentPreferenceLearningPanel } from "@/components/cockpit/development/DevelopmentPreferenceLearningPanel";
import { DevelopmentContinuousCollaborationPanel } from "@/components/cockpit/development/DevelopmentContinuousCollaborationPanel";
import { DevelopmentExecutiveCollaborationCertificationPanel } from "@/components/cockpit/development/DevelopmentExecutiveCollaborationCertificationPanel";
import { DevelopmentTestingPanel } from "@/components/cockpit/development/DevelopmentTestingPanel";
import { DevelopmentJourneyPanel } from "@/components/cockpit/development/DevelopmentJourneyPanel";
import { DevelopmentBrainRuntimePanel } from "@/components/cockpit/development/DevelopmentBrainRuntimePanel";
import { DevelopmentProductionModePanel } from "@/components/cockpit/development/DevelopmentProductionModePanel";
import { DevelopmentDurableSessionsPanel } from "@/components/cockpit/development/DevelopmentDurableSessionsPanel";
import { DevelopmentGuardianMonitoringPanel } from "@/components/cockpit/development/DevelopmentGuardianMonitoringPanel";
import { DevelopmentScalingArchitecturePanel } from "@/components/cockpit/development/DevelopmentScalingArchitecturePanel";
import { DevelopmentPerformanceGovernancePanel } from "@/components/cockpit/development/DevelopmentPerformanceGovernancePanel";
import { DevelopmentExecutionControlCenterPanel } from "@/components/cockpit/development/DevelopmentExecutionControlCenterPanel";
import { DevelopmentVisionIntegrityPanel } from "@/components/cockpit/development/DevelopmentVisionIntegrityPanel";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";

const TABS = [
  { id: "chat", label: "Conversation" },
  { id: "vision-sync", label: "Vision Sync" },
  { id: "context-sync", label: "Context Sync" },
  { id: "recovery", label: "Recovery" },
  { id: "browser-truth", label: "Browser Truth" },
  { id: "visual-capture", label: "Visual Capture" },
  { id: "ui-state-mapper", label: "UI State Mapper" },
  { id: "component-recognition", label: "Component Recognition" },
  { id: "layout-understanding", label: "Layout Understanding" },
  { id: "navigation-mapping", label: "Navigation Mapping" },
  { id: "interaction-tracking", label: "Interaction Tracking" },
  { id: "context-awareness", label: "Context Awareness" },
  { id: "visual-memory", label: "Visual Memory" },
  { id: "session-continuity", label: "Session Continuity" },
  { id: "visual-foundation-certification", label: "T1 Certified" },
  { id: "ux-rule-engine", label: "UX Rules" },
  { id: "design-system-intelligence", label: "Design System" },
  { id: "executive-style-learning", label: "Exec Style" },
  { id: "layout-evaluation", label: "Layout Eval" },
  { id: "workflow-optimization", label: "Workflow" },
  { id: "accessibility-intelligence", label: "Accessibility" },
  { id: "visual-consistency", label: "Consistency" },
  { id: "ux-scoring", label: "UX Score" },
  { id: "recommendations", label: "Recommendations" },
  { id: "ux-intelligence-certification", label: "T2 Certified" },
  { id: "frontend-builder", label: "Frontend Builder" },
  { id: "component-generator", label: "Components" },
  { id: "layout-refactoring", label: "Layouts" },
  { id: "theme-builder", label: "Themes" },
  { id: "preview-generator", label: "Previews" },
  { id: "validation-engine", label: "Validation" },
  { id: "regression-protection", label: "Regression" },
  { id: "rollback-manager", label: "Rollback" },
  { id: "change-documentation", label: "Changes" },
  { id: "autonomous-builder-certification", label: "T3 Certified" },
  { id: "natural-ux-conversation", label: "UX Chat" },
  { id: "voice-ux-commands", label: "Voice UX" },
  { id: "screen-annotation", label: "Annotate" },
  { id: "multi-proposal-generator", label: "Proposals" },
  { id: "side-by-side-comparison", label: "Compare" },
  { id: "explain-decisions", label: "Explain" },
  { id: "approval-workflow", label: "Approve" },
  { id: "preference-learning", label: "Learn" },
  { id: "continuous-collaboration", label: "Partner" },
  { id: "executive-collaboration-certification", label: "T4 Certified" },
  { id: "testing", label: "Testing" },
  { id: "journey", label: "Journey" },
  { id: "runtime", label: "Runtime" },
  { id: "production", label: "Production" },
  { id: "sessions", label: "Sessions" },
  { id: "monitoring", label: "Monitoring" },
  { id: "scaling", label: "Scaling" },
  { id: "performance", label: "Performance" },
  { id: "execution", label: "Execution" },
  { id: "integrity", label: "Integrity" },
  { id: "builder", label: "Builder" },
  { id: "eta", label: "ETA" },
  { id: "autonomous-recovery", label: "Auto Recovery" },
  { id: "automation", label: "Automation" },
  { id: "founder-shell", label: "Founder Shell" },
  { id: "supervisor", label: "Supervisor" },
] as const;

type PillowTab = (typeof TABS)[number]["id"];

function focusPillowQuery(): boolean {
  const input = document.getElementById("pillow-query");
  if (!(input instanceof HTMLInputElement)) return false;
  input.focus();
  return true;
}

/** SCR-800 — Live Pillow conversation (primary) with supervisor engine center secondary. */
export function DevelopmentPillowExperience() {
  const {
    expand,
    ensureHostSession,
    conversation,
    pillowConnected,
    hostSessionId,
    loading,
    context,
    lastResponse,
    connectionError,
  } = useGlobalAiAssistant();
  const [activeTab, setActiveTab] = useState<PillowTab>("chat");
  const activatedRef = useRef(false);

  useEffect(() => {
    if (activatedRef.current) return;
    activatedRef.current = true;

    expand();
    void ensureHostSession();

    let attempts = 0;
    const tryFocus = () => {
      if (focusPillowQuery() || attempts >= 16) return;
      attempts += 1;
      requestAnimationFrame(tryFocus);
    };
    requestAnimationFrame(tryFocus);
  }, [expand, ensureHostSession]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    let attempts = 0;
    const tryFocus = () => {
      if (focusPillowQuery() || attempts >= 8) return;
      attempts += 1;
      requestAnimationFrame(tryFocus);
    };
    requestAnimationFrame(tryFocus);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        eyebrow="Development · SCR-800"
        title="Pillow Chat"
        description="Talk to Pillow about the cockpit, missions, and executive context. The conversation panel opens automatically — type below or in the Pillow panel."
      />

      <div className="flex flex-wrap gap-2 border-b border-gold/10 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gold/10 text-[#f0d78c]"
                : "text-[#6f6a60] hover:text-[#a8a095]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" ? (
        <div className="space-y-4">
          <Panel title="Pillow session">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  pillowConnected
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-amber-500/15 text-amber-200"
                }`}
              >
                {pillowConnected ? "Connected" : "Connecting…"}
              </span>
              {hostSessionId && (
                <span className="text-xs text-[#6f6a60]">
                  Session {hostSessionId.slice(0, 8)}…
                </span>
              )}
              {connectionError && (
                <p className="w-full text-xs text-amber-200">{connectionError}</p>
              )}
            </div>
          </Panel>

          <Panel title="Conversation">
            {loading && (
              <p className="text-sm text-[#8a847a]">Pillow is assembling live context…</p>
            )}
            {!loading && conversation.length === 0 && !lastResponse && (
              <p className="text-sm text-[#8a847a]">
                {context?.pageInsightSummary ??
                  "Ask Pillow anything about this screen — the input is focused and ready."}
              </p>
            )}
            {conversation.length > 0 && (
              <ul className="max-h-[min(50vh,420px)] space-y-3 overflow-y-auto">
                {conversation.map((turn) => (
                  <li
                    key={turn.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      turn.role === "pillow"
                        ? "border border-gold/10 bg-white/[0.02] text-[#c8c0b0]"
                        : "text-[#d4af37]"
                    }`}
                  >
                    <span className="text-[10px] uppercase text-[#6f6a60]">
                      {turn.role === "pillow" ? "Pillow" : "Grand King"}
                    </span>
                    <p className="mt-1">{turn.content}</p>
                  </li>
                ))}
              </ul>
            )}
            {!loading && lastResponse && conversation.length === 0 && (
              <p className="text-sm text-[#c8c0b0]">{lastResponse.interactionSummary}</p>
            )}
          </Panel>
        </div>
      ) : activeTab === "vision-sync" ? (
        <DevelopmentVisionSyncPanel />
      ) : activeTab === "context-sync" ? (
        <DevelopmentContextSyncPanel />
      ) : activeTab === "recovery" ? (
        <DevelopmentRecoveryPanel />
      ) : activeTab === "browser-truth" ? (
        <DevelopmentBrowserTruthPanel />
      ) : activeTab === "visual-capture" ? (
        <DevelopmentVisualCapturePanel />
      ) : activeTab === "ui-state-mapper" ? (
        <DevelopmentUiStateMapperPanel />
      ) : activeTab === "component-recognition" ? (
        <DevelopmentComponentRecognitionPanel />
      ) : activeTab === "layout-understanding" ? (
        <DevelopmentLayoutUnderstandingPanel />
      ) : activeTab === "navigation-mapping" ? (
        <DevelopmentNavigationMappingPanel />
      ) : activeTab === "interaction-tracking" ? (
        <DevelopmentInteractionTrackingPanel />
      ) : activeTab === "context-awareness" ? (
        <DevelopmentContextAwarenessPanel />
      ) : activeTab === "visual-memory" ? (
        <DevelopmentVisualMemoryPanel />
      ) : activeTab === "session-continuity" ? (
        <DevelopmentSessionContinuityPanel />
      ) : activeTab === "visual-foundation-certification" ? (
        <DevelopmentVisualFoundationCertificationPanel />
      ) : activeTab === "ux-rule-engine" ? (
        <DevelopmentUxRuleEnginePanel />
      ) : activeTab === "design-system-intelligence" ? (
        <DevelopmentDesignSystemIntelligencePanel />
      ) : activeTab === "executive-style-learning" ? (
        <DevelopmentExecutiveStyleLearningPanel />
      ) : activeTab === "layout-evaluation" ? (
        <DevelopmentLayoutEvaluationPanel />
      ) : activeTab === "workflow-optimization" ? (
        <DevelopmentWorkflowOptimizationPanel />
      ) : activeTab === "accessibility-intelligence" ? (
        <DevelopmentAccessibilityIntelligencePanel />
      ) : activeTab === "visual-consistency" ? (
        <DevelopmentVisualConsistencyPanel />
      ) : activeTab === "ux-scoring" ? (
        <DevelopmentUxScoringPanel />
      ) : activeTab === "recommendations" ? (
        <DevelopmentRecommendationEnginePanel />
      ) : activeTab === "ux-intelligence-certification" ? (
        <DevelopmentUxIntelligenceCertificationPanel />
      ) : activeTab === "frontend-builder" ? (
        <DevelopmentFrontendBuilderPanel />
      ) : activeTab === "component-generator" ? (
        <DevelopmentComponentGeneratorPanel />
      ) : activeTab === "layout-refactoring" ? (
        <DevelopmentLayoutRefactoringPanel />
      ) : activeTab === "theme-builder" ? (
        <DevelopmentThemeBuilderPanel />
      ) : activeTab === "preview-generator" ? (
        <DevelopmentPreviewGeneratorPanel />
      ) : activeTab === "validation-engine" ? (
        <DevelopmentValidationEnginePanel />
      ) : activeTab === "regression-protection" ? (
        <DevelopmentRegressionProtectionPanel />
      ) : activeTab === "rollback-manager" ? (
        <DevelopmentRollbackManagerPanel />
      ) : activeTab === "change-documentation" ? (
        <DevelopmentChangeDocumentationPanel />
      ) : activeTab === "autonomous-builder-certification" ? (
        <DevelopmentAutonomousBuilderCertificationPanel />
      ) : activeTab === "natural-ux-conversation" ? (
        <DevelopmentNaturalUxConversationPanel />
      ) : activeTab === "voice-ux-commands" ? (
        <DevelopmentVoiceUxCommandsPanel />
      ) : activeTab === "screen-annotation" ? (
        <DevelopmentScreenAnnotationPanel />
      ) : activeTab === "multi-proposal-generator" ? (
        <DevelopmentMultiProposalGeneratorPanel />
      ) : activeTab === "side-by-side-comparison" ? (
        <DevelopmentSideBySideComparisonPanel />
      ) : activeTab === "explain-decisions" ? (
        <DevelopmentExplainDecisionsPanel />
      ) : activeTab === "approval-workflow" ? (
        <DevelopmentApprovalWorkflowPanel />
      ) : activeTab === "preference-learning" ? (
        <DevelopmentPreferenceLearningPanel />
      ) : activeTab === "continuous-collaboration" ? (
        <DevelopmentContinuousCollaborationPanel />
      ) : activeTab === "executive-collaboration-certification" ? (
        <DevelopmentExecutiveCollaborationCertificationPanel />
      ) : activeTab === "testing" ? (
        <DevelopmentTestingPanel />
      ) : activeTab === "journey" ? (
        <DevelopmentJourneyPanel />
      ) : activeTab === "runtime" ? (
        <DevelopmentBrainRuntimePanel />
      ) : activeTab === "production" ? (
        <DevelopmentProductionModePanel />
      ) : activeTab === "sessions" ? (
        <DevelopmentDurableSessionsPanel />
      ) : activeTab === "monitoring" ? (
        <DevelopmentGuardianMonitoringPanel />
      ) : activeTab === "scaling" ? (
        <DevelopmentScalingArchitecturePanel />
      ) : activeTab === "performance" ? (
        <DevelopmentPerformanceGovernancePanel />
      ) : activeTab === "execution" ? (
        <DevelopmentExecutionControlCenterPanel />
      ) : activeTab === "integrity" ? (
        <DevelopmentVisionIntegrityPanel />
      ) : activeTab === "builder" ? (
        <DevelopmentBuilderMonitorPanel />
      ) : activeTab === "eta" ? (
        <DevelopmentEtaEnginePanel />
      ) : activeTab === "autonomous-recovery" ? (
        <DevelopmentAutonomousRecoveryPanel />
      ) : activeTab === "automation" ? (
        <DevelopmentZeroHumanAutomationPanel />
      ) : activeTab === "founder-shell" ? (
        <DevelopmentFounderShellPanel />
      ) : activeTab === "supervisor" ? (
        <DevelopmentSupervisorSystemPanel />
      ) : (
        <DevelopmentSupervisorSystemPanel />
      )}
    </div>
  );
}
