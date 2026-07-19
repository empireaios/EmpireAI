/** R4-02 — CRM Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import { appendCrmLog } from "./crm-logging.js";
import { CrmRegistry } from "./crm-registry.js";
import { CrmMetadataGenerator } from "./crm-metadata-generator.js";
import { CustomerProfileManager } from "./customer-profile-manager.js";
import { CustomerRecordEngine } from "./customer-record-engine.js";
import { CustomerSearchEngine } from "./customer-search-engine.js";
import { CustomerAttributeManager } from "./customer-attribute-manager.js";
import { CrmValidationEngine } from "./crm-validation-engine.js";
import { CrmValidator } from "./crm-validator.js";
import { CrmRetryManager } from "./crm-retry-manager.js";
import type { CrmFoundationConfiguration } from "./configuration.js";
import type {
  AddCustomerNoteInput,
  ConnectCrmFoundationInput,
  CreateCustomerProfileInput,
  CrmEngineRecord,
  CrmRecord,
  CrmRunReport,
  SearchCustomerRecordsInput,
  UpdateCrmRecordInput,
  UpdateCustomAttributesInput,
  UpdateCustomerTagsInput,
} from "./types.js";

export class CrmManager {
  private engineRecord: CrmEngineRecord | null = null;
  private readonly registry = new CrmRegistry();
  private readonly metadataGenerator = new CrmMetadataGenerator();
  private readonly profileManager = new CustomerProfileManager();
  private readonly recordEngine = new CustomerRecordEngine();
  private readonly searchEngine = new CustomerSearchEngine();
  private readonly attributeManager = new CustomerAttributeManager();
  private readonly validationEngine = new CrmValidationEngine();
  private readonly validator = new CrmValidator();
  private readonly retryManager = new CrmRetryManager();

  constructor(private readonly identityEngine: CustomerIdentityEngine | null) {}

  getEngineRecord(): CrmEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): CrmRegistry {
    return this.registry;
  }

  getCrmRecords(): CrmRecord[] {
    return this.registry.list();
  }

  getProfileManager(): CustomerProfileManager {
    return this.profileManager;
  }

  getRetryManager(): CrmRetryManager {
    return this.retryManager;
  }

  private isIdentityEngineConnected(): boolean {
    try {
      const record = this.identityEngine?.getEngineRecord();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveIdentity(customerId: string): { valid: boolean; profileRef: string | null; error: string | null } {
    if (!this.identityEngine) {
      return { valid: false, profileRef: null, error: "Customer Identity Engine unavailable" };
    }
    const identity = this.identityEngine.getCustomerRecords().find((r) => r.customerId === customerId);
    if (!identity) {
      return { valid: false, profileRef: null, error: `Customer identity ${customerId} not found` };
    }
    return { valid: true, profileRef: identity.customerId, error: null };
  }

  connectCrmFoundation(
    _input: ConnectCrmFoundationInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const identityConnected = this.isIdentityEngineConnected();

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail"
          ? "failed"
          : identityConnected
            ? "active"
            : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: identityConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }
    if (!identityConnected) {
      validation.warnings.push("Customer Identity Engine not connected");
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendCrmLog({
      event: "engine_initialization",
      level: "info",
      details: `CRM Foundation connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      crmRecords: [],
      searchResults: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createCustomerProfile(
    input: CreateCustomerProfileInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("create_profile", config, () => {
      const identity = this.resolveIdentity(input.customerId);
      if (!identity.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(identity.error ?? "Invalid customer identity");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: identity.error,
        };
      }

      if (this.registry.getByCustomerId(input.customerId)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("CRM record already exists for customer");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "CRM record already exists for customer",
        };
      }

      const record = this.metadataGenerator.buildCrmRecord({
        customerId: input.customerId,
        customerProfileReference: identity.profileRef!,
        customerLifecycleStatus: input.customerLifecycleStatus,
        customerOwner: input.customerOwner,
        customerTags: input.customerTags,
        customerAccountRefs: input.customerAccountRefs,
        contactInformation: {
          email: input.contactInformation?.email ?? null,
          phone: input.contactInformation?.phone ?? null,
          address: input.contactInformation?.address ?? null,
        },
        customAttributes: input.customAttributes,
      });

      const validation = this.validationEngine.validateCrmRecord(record, config);
      if (validation.decision === "fail") {
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(record);

      appendCrmLog({
        event: "customer_profile_creation",
        level: "info",
        details: `CRM profile ${record.crmRecordId} created for ${input.customerId}`,
      });

      return {
        crmRecords: [record],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  updateCrmRecord(
    input: UpdateCrmRecordInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("update_record", config, () => {
      const existing = this.registry.get(input.crmRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("CRM record not found");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "CRM record not found",
        };
      }

      if (input.customerLifecycleStatus && input.customerLifecycleStatus !== existing.customerLifecycleStatus) {
        const lifecycleValidation = this.validationEngine.validateLifecycleTransition(
          existing.customerLifecycleStatus,
          input.customerLifecycleStatus,
          config,
        );
        if (lifecycleValidation.decision === "fail") {
          return {
            crmRecords: [],
            searchResults: [],
            validation: lifecycleValidation,
            error: lifecycleValidation.errors.join("; "),
          };
        }
      }

      const updated = this.recordEngine.applyUpdate(existing, input);
      const validation = this.validationEngine.validateCrmRecord(updated, config);
      if (validation.decision === "fail") {
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      updated.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(updated);

      appendCrmLog({
        event: "crm_update",
        level: "info",
        details: `CRM record ${input.crmRecordId} updated`,
      });

      return {
        crmRecords: [updated],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  searchCustomerRecords(
    input: SearchCustomerRecordsInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("search_customers", config, () => {
      const results = this.searchEngine.search(
        this.registry.list(),
        input.query,
        config,
        { searchBy: input.searchBy, limit: input.limit },
      );

      appendCrmLog({
        event: "customer_search",
        level: "info",
        details: `Search "${input.query}" returned ${results.length} result(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (results.length === 0) validation.warnings.push("No matching CRM records found");

      return {
        crmRecords: results
          .map((r) => this.registry.get(r.crmRecordId))
          .filter(Boolean) as CrmRecord[],
        searchResults: results,
        validation,
        error: null,
      };
    });
  }

  addCustomerNote(
    input: AddCustomerNoteInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("add_note", config, () => {
      const existing = this.registry.get(input.crmRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("CRM record not found");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "CRM record not found",
        };
      }

      if (!input.content?.trim()) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Note content is required");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "Note content is required",
        };
      }

      const note = this.metadataGenerator.buildCustomerNote({
        author: input.author,
        content: input.content,
      });
      const updated: CrmRecord = {
        ...existing,
        timestamp: new Date().toISOString(),
        customerNotes: [...existing.customerNotes, note],
      };

      const validation = this.validationEngine.validateCrmRecord(updated, config);
      updated.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(updated);

      appendCrmLog({
        event: "crm_update",
        level: "info",
        details: `Note added to CRM record ${input.crmRecordId}`,
      });

      return {
        crmRecords: [updated],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  updateCustomerTags(
    input: UpdateCustomerTagsInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("update_tags", config, () => {
      const existing = this.registry.get(input.crmRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("CRM record not found");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "CRM record not found",
        };
      }

      const { record: updated, error } = this.attributeManager.applyTags(
        existing,
        input.tags,
        input.mode ?? "replace",
        config,
      );
      if (error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(error);
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error,
        };
      }

      const validation = this.validationEngine.validateCrmRecord(updated, config);
      updated.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(updated);

      appendCrmLog({
        event: "crm_update",
        level: "info",
        details: `Tags updated on CRM record ${input.crmRecordId}`,
      });

      return {
        crmRecords: [updated],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  updateCustomAttributes(
    input: UpdateCustomAttributesInput,
    config: CrmFoundationConfiguration,
  ): CrmRunReport {
    return this.runAction("update_attributes", config, () => {
      const existing = this.registry.get(input.crmRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("CRM record not found");
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: "CRM record not found",
        };
      }

      const updated = this.attributeManager.applyAttributes(
        existing,
        input.attributes,
        input.mode ?? "merge",
      );
      const validation = this.validationEngine.validateCrmRecord(updated, config);
      if (validation.decision === "fail") {
        return {
          crmRecords: [],
          searchResults: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      updated.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(updated);

      appendCrmLog({
        event: "crm_update",
        level: "info",
        details: `Custom attributes updated on CRM record ${input.crmRecordId}`,
      });

      return {
        crmRecords: [updated],
        searchResults: [],
        validation,
        error: null,
      };
    });
  }

  private runAction(
    action: CrmRunReport["action"],
    config: CrmFoundationConfiguration,
    fn: () => {
      crmRecords: CrmRecord[];
      searchResults: CrmRunReport["searchResults"];
      validation: CrmRunReport["validation"];
      error: string | null;
    },
  ): CrmRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("CRM Foundation not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      crmRecords: result.crmRecords,
      searchResults: result.searchResults,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
