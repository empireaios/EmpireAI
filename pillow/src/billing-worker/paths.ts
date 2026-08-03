export const BILLING_WORKER_ID = "wkr-billing-01" as const;
export const BILLING_WORKER_SYSTEM_PATH = "docs/governance/EMPIREAI_BILLING_WORKER_SYSTEM.md" as const;
export const BLW_METADATA_VERSION = "BLW-001-v1" as const;
export const BILLING_REPORT_VERSION = "BLW-RPT-v1" as const;
export const INTEGRATION_TARGETS = ["worker_registry","worker_lifecycle","worker_assignment_engine","enterprise_platform_factory_core","requirements_worker","architecture_worker","backend_worker","database_worker","authentication_worker","authorization_worker","executive_reporting_runtime","audit_runtime","worker_recovery_system","worker_performance_review"] as const;
export const BLW_CAPABILITIES = ["manage_billing_accounts","create_subscription_plans","support_recurring_billing","generate_invoices","track_invoice_lifecycle","coordinate_payment_provider_workflows","record_billing_transactions","handle_refunds_and_credit_notes","produce_billing_audit_history"] as const;
export const ENGINE_STATUSES = ["idle","active","failed"] as const;
export const BILLING_COMPONENTS = ["accounts","plans","subscriptions","invoices","transactions","refunds","credit_notes","audit"] as const;
