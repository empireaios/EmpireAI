export const DPW_INTEGRATION_TARGETS=["worker_registry","worker_lifecycle","worker_assignment_engine","enterprise_platform_factory_core","backend_worker","frontend_worker","database_worker","api_integration_worker","workflow_builder_worker","testing_worker","executive_reporting_runtime","audit_runtime","worker_recovery_system","worker_performance_review","approved_deployment_infrastructure"] as const;
export const DPW_CAPABILITIES=["validated_deployment","approval_gating","health_validation","controlled_rollback","deployment_audit"] as const;
export const ENGINE_STATUSES=["idle","ready","blocked"] as const;
export const ENVIRONMENTS=["development","staging","production"] as const;
export const DEPLOYMENT_METHODS=["standard","blue_green","rolling","canary"] as const;
export const DEPLOYMENT_WORKER_SYSTEM_PATH="docs/governance/EMPIREAI_DEPLOYMENT_WORKER_SYSTEM.md";
