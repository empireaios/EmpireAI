/** PILLOW-013 — EmpireAI Orchestrator types. */

export type SubsystemId =
  | "bootstrap"
  | "intelligence"
  | "context_builder"
  | "memory"
  | "mission_planner"
  | "cursor_supervisor"
  | "recovery_manager"
  | "executive_audit_reviewer"
  | "repository_synchronizer"
  | "due_diligence"
  | "autonomous_improvement"
  | "live_repository_watcher"
  | "grand_king_command_interface"
  | "objective_engine"
  | "technical_chief"
  | "ux_designer"
  | "cursor_bridge"
  | "vision_synchronization"
  | "context_synchronization"
  | "cursor_protocol"
  | "recovery_doctrine"
  | "browser_truth"
  | "visual_capture"
  | "ui_state_mapper"
  | "component_recognition"
  | "layout_understanding"
  | "navigation_mapping"
  | "interaction_tracking"
  | "context_awareness"
  | "visual_memory"
  | "session_continuity"
  | "visual_foundation_certification"
  | "ux_rule_engine"
  | "design_system_intelligence"
  | "executive_style_learning"
  | "layout_evaluation"
  | "workflow_optimization"
  | "accessibility_intelligence"
  | "visual_consistency"
  | "ux_scoring"
  | "recommendation_engine"
  | "ux_intelligence_certification"
  | "frontend_builder"
  | "component_generator"
  | "layout_refactoring"
  | "theme_builder"
  | "preview_generator"
  | "validation_engine"
  | "regression_protection"
  | "rollback_manager"
  | "change_documentation"
  | "autonomous_builder_certification"
  | "natural_ux_conversation"
  | "voice_ux_commands"
  | "screen_annotation"
  | "multi_proposal_generator"
  | "side_by_side_comparison"
  | "explain_decisions"
  | "approval_workflow"
  | "preference_learning"
  | "continuous_collaboration"
  | "executive_collaboration_certification"
  | "continuous_screen_observation"
  | "autonomous_ux_audit"
  | "ux_opportunity_discovery"
  | "productivity_intelligence"
  | "workflow_evolution"
  | "adaptive_interface"
  | "continuous_ux_evolution"
  | "executive_workspace_intelligence"
  | "self_improving_ux"
  | "visual_intelligence_certification"
  | "e2e_testing"
  | "journey_system"
  | "brain_runtime"
  | "production_mode"
  | "durable_sessions"
  | "guardian_monitoring"
  | "scaling_architecture"
  | "performance_governance"
  | "execution_control_center"
  | "vision_integrity_engine"
  | "builder_monitor"
  | "eta_engine"
  | "autonomous_recovery_engine"
  | "zero_human_automation"
  | "founder_shell"
  | "infrastructure_commander"
  | "commerce_intelligence"
  | "marketplace_connector_framework"
  | "amazon_marketplace_integration"
  | "amazon_product_intelligence"
  | "amazon_order_management"
  | "amazon_inventory_sync"
  | "walmart_marketplace_integration"
  | "etsy_marketplace_integration"
  | "ebay_marketplace_integration"
  | "tiktok_shop_marketplace_integration"
  | "shopify_store_marketplace_integration"
  | "woocommerce_marketplace_integration"
  | "marketplace_product_normalization"
  | "marketplace_order_normalization"
  | "marketplace_health_monitor"
  | "marketplace_certification"
  | "supplier_framework"
  | "cj_dropshipping_integration"
  | "aliexpress_integration"
  | "oss1688_integration"
  | "supplier_product_sync"
  | "supplier_inventory_sync"
  | "supplier_pricing_engine"
  | "supplier_ranking_engine"
  | "procurement_engine"
  | "fulfilment_orchestrator"
  | "shipping_carrier_integration"
  | "shipment_tracking_engine"
  | "return_management"
  | "warehouse_intelligence"
  | "multi_warehouse_support"
  | "supplier_risk_monitor"
  | "logistics_optimization"
  | "fulfilment_sla_monitor"
  | "procurement_intelligence"
  | "supplier_operations_certification"
  | "financial_framework"
  | "payment_gateway_integration"
  | "banking_integration"
  | "revenue_engine"
  | "expense_engine"
  | "profit_calculation_engine"
  | "cash_flow_monitor"
  | "reconciliation_engine"
  | "invoice_generator"
  | "refund_engine"
  | "tax_intelligence_engine"
  | "multi_currency_engine"
  | "financial_forecast_engine"
  | "budget_management_engine"
  | "financial_risk_monitor"
  | "executive_financial_dashboard"
  | "accounting_export_engine"
  | "financial_operations_certification"
  | "customer_identity_engine"
  | "crm_foundation"
  | "customer_timeline_engine"
  | "email_communication_engine"
  | "sms_communication_engine"
  | "whatsapp_integration"
  | "live_chat_integration"
  | "ai_customer_support"
  | "ticket_management_engine"
  | "customer_sentiment_engine"
  | "review_management_engine"
  | "loyalty_programme_engine"
  | "returns_intelligence_engine"
  | "customer_risk_engine"
  | "customer_lifetime_value_engine"
  | "customer_segmentation_engine"
  | "customer_journey_intelligence_engine"
  | "executive_customer_dashboard"
  | "customer_operations_certification"
  | "marketing_framework"
  | "meta_ads_integration"
  | "google_ads_integration"
  | "tiktok_ads_integration"
  | "youtube_ads_integration"
  | "seo_intelligence_engine"
  | "campaign_manager"
  | "audience_intelligence"
  | "attribution_engine"
  | "marketing_analytics_dashboard"
  | "creative_asset_manager"
  | "ai_campaign_generator"
  | "budget_optimization_engine"
  | "conversion_intelligence"
  | "competitor_marketing_monitor"
  | "viral_trend_intelligence"
  | "marketing_experiment_engine"
  | "cross_channel_orchestrator"
  | "autonomous_marketing_engine"
  | "real_world_operations_certification"
  | "company_factory_framework"
  | "business_opportunity_discovery"
  | "market_validation_engine"
  | "business_model_generator"
  | "brand_creation_engine"
  | "domain_digital_asset_planner"
  | "store_generation_engine"
  | "product_portfolio_builder"
  | "pricing_strategy_engine"
  | "launch_readiness_validator"
  | "business_launch_orchestrator"
  | "growth_initialization_engine"
  | "launch_monitoring_engine"
  | "first_revenue_optimizer"
  | "company_factory_certified"
  | "enterprise_portfolio_framework"
  | "multi_company_registry"
  | "portfolio_performance_engine"
  | "cross_business_knowledge_engine"
  | "capital_distribution_engine"
  | "executive_portfolio_dashboard"
  | "portfolio_risk_engine"
  | "portfolio_balance_engine"
  | "business_health_ranking"
  | "portfolio_intelligence_certified"
  | "cross_company_resource_engine"
  | "shared_customer_intelligence"
  | "shared_supplier_intelligence"
  | "portfolio_forecast_engine"
  | "acquisition_evaluation_engine"
  | "portfolio_optimization_engine"
  | "company_lifecycle_manager"
  | "portfolio_expansion_planner"
  | "enterprise_value_engine"
  | "autonomous_portfolio_board"
  | "portfolio_certified"
  | "autonomous_scaling_framework"
  | "winning_product_detector"
  | "scaling_decision_engine"
  | "capacity_planning_engine"
  | "marketing_scale_engine"
  | "supplier_scale_engine"
  | "financial_scale_engine"
  | "workforce_intelligence"
  | "executive_scaling_dashboard"
  | "bottleneck_intelligence"
  | "operational_elasticity_engine"
  | "performance_preservation_engine"
  | "scaling_risk_monitor"
  | "global_scaling_planner"
  | "autonomous_growth_optimizer"
  | "revenue_acceleration_engine"
  | "profit_scaling_engine"
  | "scale_simulation_engine"
  | "self_balancing_enterprise"
  | "global_expansion_framework"
  | "empire_intelligence_framework"
  | "country_intelligence_engine"
  | "localization_engine"
  | "language_intelligence"
  | "currency_intelligence"
  | "regional_compliance_engine"
  | "global_tax_intelligence"
  | "international_logistics_engine"
  | "global_market_intelligence"
  | "executive_global_dashboard"
  | "global_brand_management"
  | "international_partnership_engine"
  | "global_talent_intelligence"
  | "regional_growth_optimizer"
  | "global_risk_intelligence"
  | "cross-region-learning-engine"
  | "empire-knowledge-engine"
  | "empire-memory-engine"
  | "empire-optimization-engine"
  | "empire-capital-allocation"
  | "empire-opportunity-engine"
  | "empire-innovation-engine"
  | "empire-resilience-engine"
  | "empire-self-improvement-engine"
  | "executive-empire-dashboard"
  | "cross-empire-governance-engine"
  | "autonomous-investment-engine"
  | "enterprise-succession-engine"
  | "empire-legacy-engine"
  | "grand-king-advisory-engine"
  | "civilization-knowledge-engine"
  | "autonomous-empire-evolution"
  | "empire-performance-guardian"
  | "infinite-growth-engine"
  | "empire-certified"
  | "executive-planner"
  | "opportunity-scanner"
  | "business-state-manager"
  | "execution-memory"
  | "decision-engine"
  | "approval-router"
  | "strategic-recommendation-engine"
  | "executive-audit-engine"
  | "workforce-orchestrator"
  | "workforce-capability-registry"
  | "workforce-access-manager"
  | "skill-tool-router"
  | "collective-reasoning-engine"
  | "experience-replay-engine"
  | "operational-playbook-engine"
  | "decision-memory"
  | "adaptive-workforce-optimizer"
  | "executive-command-center"
  | "workforce-operating-system"
  | "task-negotiation-protocol"
  | "peer-review-runtime"
  | "escalation-framework"
  | "knowledge-sharing-bus"
  | "inter-worker-messaging"
  | "mission-coordination-engine"
  | "executive-reporting-runtime"
  | "worker-quality-standard"
  | "worker-self-critique-protocol"
  | "workforce-certification-monitor"
  | "unified-workforce-certification"
  | "worker-constitution"
  | "organization-charter"
  | "role-taxonomy"
  | "skill-taxonomy"
  | "authority-matrix"
  | "responsibility-matrix"
  | "worker-registry"
  | "worker-lifecycle"
  | "worker-assignment-engine"
  | "worker-monitoring"
  | "worker-performance-review"
  | "worker-recovery-system"
  | "workforce-factory-certification"
  | "empire-builder-factory-core"
  | "business-idea-interpreter"
  | "empire-builder-model-generator"
  | "market-research-worker"
  | "opportunity-evaluation-worker"
  | "business-blueprint-worker"
  | "launch-plan-worker"
  | "business-risk-worker"
  | "business-approval-pack-worker"
  | "empire-builder-certification"
  | "commerce-factory-core"
  | "product-discovery-worker"
  | "product-evaluation-worker"
  | "supplier-discovery-worker"
  | "supplier-evaluation-worker"
  | "supplier-negotiation-worker"
  | "product-image-worker"
  | "product-listing-worker"
  | "pricing-worker"
  | "inventory-worker"
  | "order-worker"
  | "refund-dispute-worker"
  | "commerce-analytics-worker"
  | "commerce-certification"
  | "media-factory-core"
  | "editor-in-chief-worker"
  | "trend-research-worker"
  | "topic-planner-worker"
  | "script-worker"
  | "hook-worker"
  | "thumbnail-worker"
  | "visual-research-worker"
  | "image-creative-worker"
  | "voice-worker"
  | "video-assembly-worker"
  | "subtitle-worker"
  | "music-sound-worker"
  | "publishing-worker"
  | "media-analytics-worker"
  | "media-learning-worker"
  | "channel-recommendation-worker"
  | "media-executive-review-worker"
  | "media-certification"
  | "digital-products-factory-core"
  | "digital-product-research-worker"
  | "ebook-worker"
  | "prompt-product-worker"
  | "course-builder-worker"
  | "template-builder-worker"
  | "design-worker"
  | "sales-page-worker"
  | "checkout-worker"
  | "digital-delivery-worker"
  | "digital-product-analytics-worker"
  | "digital-products-certification"
  | "enterprise-platform-factory-core"
  | "requirements-worker"
  | "architecture-worker"
  | "frontend-worker"
  | "backend-worker"
  | "database-worker"
  | "authentication-worker"
  | "authorization-worker"
  | "billing-worker"
  | "api-integration-worker"
  | "workflow-builder-worker"
  | "notification-worker"
  | "testing-worker"
  | "deployment-worker"
  | "platform-certification"
  | "local-business-factory-core"
  | "local-market-research-worker"
  | "service-offer-worker"
  | "booking-worker"
  | "crm-worker"
  | "whatsapp-worker"
  | "local-seo-worker"
  | "lead-generation-worker"
  | "operations-worker"
  | "local-business-launch-pack"
  | "local-business-certification"
  | "affiliate-factory-core"
  | "affiliate-opportunity-worker"
  | "comparison-site-worker"
  | "review-content-worker"
  | "seo-content-worker"
  | "email-funnel-worker"
  | "analytics-worker"
  | "affiliate-compliance-worker"
  | "affiliate-certification"
  | "capital-factory-core"
  | "accounting-worker"
  | "cashflow-worker"
  | "budget-planning-worker"
  | "profitability-worker"
  | "forecasting-worker"
  | "tax-support-worker"
  | "investment-planning-worker"
  | "financial-reporting-worker"
  | "capital-risk-worker"
  | "capital-factory-certification"
  | "shared-runtime-core"
  | "pillow-orchestration-runtime"
  | "mission-runtime"
  | "queue-runtime"
  | "memory-runtime"
  | "api-runtime"
  | "tool-runtime"
  | "communication-runtime"
  | "approval-runtime"
  | "monitoring-runtime"
  | "recovery-runtime"
  | "scheduling-runtime"
  | "audit-runtime"
  | "shared-runtime-certification"
  | "production-certification-core"
  | "worker-readiness-audit"
  | "pillow-command-audit"
  | "business-factory-audit"
  | "security-audit"
  | "performance-audit"
  | "recovery-audit"
  | "financial-readiness-audit"
  | "executive-acceptance-pack"
  | "grand-king-acceptance-gate"
  | "post-launch-monitoring"
  | "q-series-certification"
  | "q-series-completion"
  | "ai-innovation-factory"
  | "implementation-specification-engine"
  | "repository-intelligence-engine"
  | "mission-planning-engine"
  | "cursor-specification-generator"
  | "implementation-recovery-planner"
  | "programme-certification-factory"
  | "global-expansion-simulator"
  | "international-executive-cockpit"
  | "global-operations-certified"
  | "empire_intelligence_framework"
  | "empire_commander"
  | "empire_operating_system"
  | "continuous_evolution";

export type SubsystemHealth = "ready" | "degraded" | "unavailable" | "deferred";

export interface SubsystemEntry {
  id: SubsystemId;
  label: string;
  missionId: string | null;
  health: SubsystemHealth;
  runtimePath: string | null;
  discoveredAt: string;
}

export type WorkerKind =
  | "engineering"
  | "testing"
  | "documentation"
  | "review"
  | "commercial"
  | "research";

export type WorkerAvailability = "available" | "busy" | "offline" | "deferred";

export interface WorkerEntry {
  id: string;
  label: string;
  kind: WorkerKind;
  availability: WorkerAvailability;
  replaceable: true;
  description: string;
}

export type WorkflowId =
  | "engineering"
  | "repository_synchronization"
  | "executive_review"
  | "mission_planning"
  | "recovery"
  | "architecture_improvement"
  | "commercial_improvement"
  | "continuous_due_diligence";

export interface WorkflowStep {
  order: number;
  label: string;
  subsystemId: SubsystemId;
  optional?: boolean;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  label: string;
  steps: WorkflowStep[];
}

export type WorkflowStepStatus =
  | "pending"
  | "delegated"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked";

export interface CoordinatedStep {
  step: WorkflowStep;
  status: WorkflowStepStatus;
  delegatedTo: string;
  notes?: string;
}

export interface WorkflowCoordinationResult {
  workflowId: WorkflowId;
  coordinatedAt: string;
  durationMs: number;
  steps: CoordinatedStep[];
  recommendation: string;
}

export type FailureAction =
  | "recovery_required"
  | "retry_appropriate"
  | "mission_postponement"
  | "escalation_required"
  | "grand_king_notification";

export interface FailureEvent {
  source: string;
  message: string;
  missionId?: string;
  recoverable?: boolean;
}

export interface FailureCoordinationResult {
  event: FailureEvent;
  actions: FailureAction[];
  recommendation: string;
  preserveRepositoryIntegrity: true;
}

export interface ScheduledWorkItem {
  id: string;
  label: string;
  priority: number;
  workflowId: WorkflowId;
  reason: string;
  blocked: boolean;
}

export interface SchedulingResult {
  scheduledAt: string;
  queue: ScheduledWorkItem[];
  grandKingOverride: boolean;
}

export interface RuntimeAwareness {
  activeMissions: number;
  queuedMissions: number;
  workerAvailability: Record<string, WorkerAvailability>;
  repositoryHealthScore: number;
  journeyPosition: string | null;
  currentMission: string | null;
  recoveryStatus: string;
  synchronizationStatus: string;
  executiveAuditStatus: string;
  subsystemHealth: Record<SubsystemId, SubsystemHealth>;
  grandKingPriorityActive: boolean;
}

export interface GrandKingCommand {
  command: string;
  issuedAt: string;
  priority: "grand_king";
}

export interface OrchestratorEngineState {
  engineVersion: "PILLOW-013";
  status: "ready" | "coordinating" | "grand_king_priority" | "paused";
  initializedAt: string;
  contractPath: string;
  subsystemCount: number;
  workerCount: number;
  workflowCount: number;
  grandKingPriorityActive: boolean;
  lastCommand: GrandKingCommand | null;
}

export interface OrchestratorEngineOptions {
  maxScheduledItems?: number;
}

export interface CoordinateWorkflowRequest {
  workflowId?: WorkflowId;
}

export interface OrchestratorExecutionResult {
  coordination: WorkflowCoordinationResult;
  scheduling: SchedulingResult;
  awareness: RuntimeAwareness;
}
