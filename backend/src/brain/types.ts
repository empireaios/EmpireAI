export type AuthorityLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export type BrainEventType =
  | "request"
  | "signal"
  | "task_complete"
  | "escalation"
  | "approval_needed"
  | "workflow_started"
  | "workflow_completed"
  | "workflow_failed"
  | "agent_invoked"
  | "tool_executed"
  | "decision_made"
  | "memory_stored";

export type BrainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  type: BrainEventType;
  source: string;
  target?: string;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  payload: TPayload;
  correlationId: string;
  timestamp: string;
};

export type TaskPriority = "critical" | "high" | "normal" | "low";

export type BrainTaskType =
  | "agent.run"
  | "workflow.run"
  | "tool.execute"
  | "scheduler.tick";

export type BrainTaskPayload = {
  type: BrainTaskType;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  workflowId?: string;
  toolName?: string;
  input: Record<string, unknown>;
  correlationId: string;
  priority?: TaskPriority;
};

export type LLMProviderName = "openai" | "anthropic" | "gemini";

export type LLMMessageRole = "system" | "user" | "assistant" | "tool";

export type LLMMessage = {
  role: LLMMessageRole;
  content: string;
  name?: string;
};

export type LLMCompletionRequest = {
  provider?: LLMProviderName;
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: LLMToolDefinition[];
  workspaceId: string;
  correlationId: string;
};

export type LLMToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type LLMCompletionResponse = {
  provider: LLMProviderName;
  model: string;
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export type ToolContext = {
  workspaceId: string;
  companyId?: string;
  agentId: string;
  correlationId: string;
};

export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext,
) => Promise<unknown>;

export type RegisteredTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  module: string;
  authorityLevel: AuthorityLevel;
  handler: ToolHandler;
};

export type AgentDefinition = {
  id: string;
  name: string;
  role: string;
  module: string;
  description: string;
  systemPrompt: string;
  authorityLevel: AuthorityLevel;
  defaultProvider?: LLMProviderName;
  defaultModel?: string;
  tools: string[];
};

export type AgentRunRequest = {
  workspaceId: string;
  companyId?: string;
  agentId: string;
  objective: string;
  context?: Record<string, unknown>;
  correlationId?: string;
  provider?: LLMProviderName;
  model?: string;
};

export type AgentRunResult = {
  agentId: string;
  correlationId: string;
  output: string;
  toolResults: Array<{ tool: string; result: unknown }>;
  decisions: DecisionRecord[];
};

export type DecisionRecord = {
  id: string;
  agentId: string;
  action: string;
  authorityLevel: AuthorityLevel;
  approved: boolean;
  requiresFounderApproval: boolean;
  rationale: string;
  timestamp: string;
};

export type WorkflowStep = {
  id: string;
  agentId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  dependsOn?: string[];
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
};

export type WorkflowRunRequest = {
  workflowId: string;
  workspaceId: string;
  companyId?: string;
  input?: Record<string, unknown>;
  correlationId?: string;
};

export type MemoryScope = "session" | "workspace" | "company" | "agent";

export type MemoryRecord = {
  id: string;
  scope: MemoryScope;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  key: string;
  value: unknown;
  embedding?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditAction =
  | "orchestrator.dispatch"
  | "agent.run"
  | "workflow.run"
  | "tool.execute"
  | "llm.complete"
  | "decision.evaluate"
  | "memory.write"
  | "event.publish"
  | "task.enqueue"
  | "scheduler.schedule"
  | "auth.login"
  | "auth.logout"
  | "auth.failed"
  | "guardian.block"
  | "guardian.health_check"
  | "guardian.risk_resolved"
  | "revenue_loop.payment_received"
  | "revenue_loop.store_deployed"
  | "revenue_loop.fulfillment_approved"
  | "revenue_loop.live_fulfillment_submitted"
  | "production_deploy.prepared"
  | "production_deploy.approved"
  | "production_deploy.executed"
  | "production_deploy.rolled_back"
  | "live_payment.checkout_created"
  | "live_payment.payment_intent_created"
  | "live_payment.succeeded"
  | "live_payment.failed"
  | "live_payment.refunded"
  | "customer_order.checkout_started"
  | "customer_order.payment_verified"
  | "customer_order.fulfillment_approved"
  | "customer_order.fulfillment_submitted"
  | "customer_order.tracking_synced"
  | "customer_order.delivered"
  | "live_cj_fulfillment.prepared"
  | "live_cj_fulfillment.approved"
  | "live_cj_fulfillment.submitted"
  | "live_cj_fulfillment.tracking_synced"
  | "live_cj_fulfillment.recovered"
  | "analytics_conversion.pixels_registered"
  | "analytics_conversion.server_event_dispatched"
  | "analytics_conversion.purchase_tracked"
  | "analytics_conversion.ad_spend_recorded"
  | "meta_ads.oauth_connected"
  | "meta_ads.campaign_prepared"
  | "meta_ads.campaign_approved"
  | "meta_ads.creative_uploaded"
  | "meta_ads.campaign_launched"
  | "meta_ads.status_synced"
  | "meta_ads.report_synced"
  | "product_publishing.catalog_prepared"
  | "product_publishing.catalog_published"
  | "product_publishing.inventory_synced"
  | "product_publishing.prices_synced"
  | "product_publishing.availability_synced"
  | "product_publishing.products_updated"
  | "grand_kings_revenue.cycle_run"
  | "grand_kings_revenue.kpi_snapshot"
  | "first_revenue_validation.completed"
  | "soul_file.initialized"
  | "soul_file.evolved"
  | "soul_file.exported"
  | "soul_file.imported"
  | "soul_runtime.captured"
  | "governance.decision"
  | "governance.policy_updated"
  | "identity_registry.registered"
  | "identity_registry.display_name_updated"
  | "doctrine.published"
  | "doctrine.modified"
  | "doctrine.deprecated"
  | "doctrine.superseded"
  | "doctrine.referenced"
  | "policy.created"
  | "policy.modified"
  | "policy.disabled"
  | "policy.enabled"
  | "policy.resolved"
  | "promise_register.registered"
  | "promise_register.modified"
  | "promise_register.progress_updated"
  | "promise_register.fulfilled"
  | "promise_register.obsoleted"
  | "promise_register.superseded"
  | "kpi_engine.observation_recorded"
  | "kpi_engine.batch_recorded"
  | "kpi_engine.target_set"
  | "kpi_engine.synced"
  | "decision_registry.recorded"
  | "decision_registry.approved"
  | "decision_registry.modified"
  | "decision_registry.superseded"
  | "decision_registry.deprecated"
  | "strategic_memory.recorded"
  | "strategic_memory.recalled"
  | "strategic_memory.modified"
  | "strategic_memory.archived"
  | "strategic_memory.superseded"
  | "ecommerce_os.workflow_started"
  | "ecommerce_os.research_completed"
  | "ecommerce_os.products_approved"
  | "ecommerce_os.launch_prepared"
  | "marketplace_infrastructure.connect_started"
  | "marketplace_infrastructure.connect_completed"
  | "account_infrastructure.setup_started"
  | "account_infrastructure.connect_completed"
  | "account_infrastructure.error_marked"
  | "account_infrastructure.disabled"
  | "account_infrastructure.human_action_completed"
  | "marketplace_connection.started"
  | "marketplace_connection.completed"
  | "marketplace_connection.refreshed"
  | "marketplace_connection.revoked"
  | "marketplace_connection.verified"
  | "commerce_readiness.evaluated"
  | "product_discovery.session_started"
  | "product_discovery.discovered"
  | "product_discovery.approved"
  | "business_workspace.approved"
  | "business_workspace.rejected"
  | "business_workspace.saved"
  | "business_preview.generated"
  | "business_preview.regenerated"
  | "business_preview.approved_for_build"
  | "market_strategy.generated"
  | "business_build.started"
  | "business_build.validated"
  | "business_simulation.run"
  | "publication_package.generate"
  | "marketing_campaign.generate"
  | "fulfillment_package.generate"
  | "revenue_activation.generate"
  | "business_health.evaluate"
  | "growth_optimization.recommend"
  | "customer_lifetime.analyze"
  | "pipeline_validation.run"
  | "execution_layer.full_pipeline"
  | "reality_integration.connect"
  | "reality_integration.disconnect"
  | "reality_integration.refresh"
  | "reality_integration.vault.revoke"
  | "reality_integration.validate_all"
  | "reality_integration.credential.verified"
  | "reality_integration.live_commerce.oauth.start"
  | "reality_integration.live_commerce.oauth.complete"
  | "reality_integration.live_commerce.sync"
  | "eye_series.run"
  | "eye_series.run_all"
  | "eye_series.validate_all"
  | "empire_self_inspection.generate"
  | "commerce_runtime.plan.created"
  | "commerce_runtime.pipeline.normalized"
  | "commerce_runtime.dispatch.blocked"
  | "commerce_runtime.event.processed"
  | "commerce_runtime.plugin.dispatch"
  | "global_commerce.expansion.planned"
  | "global_commerce_intelligence.opportunity.ranked"
  | "empire_knowledge.object.created"
  | "empire_knowledge.learning.recorded"
  | "founder_automation.plan.created"
  | "amazon_global_seller.listing.created"
  | "commerce_intelligence_studio.analyze"
  | "commerce_intelligence.pull"
  | "commerce_intelligence.mission_decision"
  | "commerce_intelligence.launch_executed"
  | "commerce_intelligence.monitor"
  | "executive_council.debate"
  | "executive_surveillance.observe"
  | "grand_king.automation.run"
  | "grand_king_revenue_pipeline.transition"
  | "ofd.milestone.recorded"
  | "ofd.real_event.recorded"
  | "pillow.request"
  | "pillow.session.create"
  | "pillow.session.destroy"
  | "pillow.startup"
  | "pillow.shutdown"
  | "pillow.approval.register"
  | "pillow.approval.decide"
  | "pillow.approval.history"
  | "pillow.cursor.dispatch"
  | "pillow.cursor.recovery"
  | "pillow.learning.observe"
  | "pillow.learning.approve"
  | "pillow.learning.reject"
  | "pillow.learning.merge"
  | "pillow.learning.archive"
  | "pillow.executive_council.debate"
  | "pillow.executive_council.decide"
  | "global_notifications.sync"
  | "global_notifications.read"
  | "global_notifications.read_all"
  | "global_notifications.acknowledge"
  | "global_assistant.session.create"
  | "global_assistant.why"
  | "global_assistant.chat"
  | "global_assistant.mission.request"
  | "global_assistant.audit.request"
  | "global_assistant.command.decide";

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  actor: string;
  workspaceId: string;
  companyId?: string;
  agentId?: string;
  correlationId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
};

export type OrchestratorDispatchRequest = {
  module: string;
  action: string;
  workspaceId: string;
  companyId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
};

export type OrchestratorDispatchResult = {
  correlationId: string;
  status: "queued" | "completed" | "requires_approval";
  result?: unknown;
  taskId?: string;
};
