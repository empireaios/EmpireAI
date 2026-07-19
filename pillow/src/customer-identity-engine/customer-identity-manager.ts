/** R4-01 — Customer Identity Manager. */

import { appendCieLog } from "./cie-logging.js";
import { IdentityRegistry } from "./identity-registry.js";
import { CustomerMetadataGenerator } from "./customer-metadata-generator.js";
import { CustomerProfileEngine } from "./customer-profile-engine.js";
import { IdentityResolutionEngine } from "./identity-resolution-engine.js";
import { IdentityMergeEngine } from "./identity-merge-engine.js";
import { CustomerValidationEngine } from "./customer-validation-engine.js";
import { CustomerIdentityValidator } from "./customer-identity-validator.js";
import { IdentityRetryManager } from "./identity-retry-manager.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type {
  ConnectCustomerIdentityEngineInput,
  CreateCustomerIdentityInput,
  CustomerIdentityEngineRecord,
  CustomerIdentityRecord,
  CustomerIdentityRunReport,
  DetectDuplicateIdentitiesInput,
  LinkCustomerIdentityInput,
  MergeCustomerIdentitiesInput,
  ResolveCustomerIdentityInput,
} from "./types.js";

export class CustomerIdentityManager {
  private engineRecord: CustomerIdentityEngineRecord | null = null;
  private readonly registry = new IdentityRegistry();
  private readonly metadataGenerator = new CustomerMetadataGenerator();
  private readonly profileEngine = new CustomerProfileEngine();
  private readonly resolutionEngine = new IdentityResolutionEngine();
  private readonly mergeEngine = new IdentityMergeEngine();
  private readonly validationEngine = new CustomerValidationEngine();
  private readonly validator = new CustomerIdentityValidator();
  private readonly retryManager = new IdentityRetryManager();

  getEngineRecord(): CustomerIdentityEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): IdentityRegistry {
    return this.registry;
  }

  getCustomerRecords(): CustomerIdentityRecord[] {
    return this.registry.list();
  }

  connectCustomerIdentityEngine(
    _input: ConnectCustomerIdentityEngineInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
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

    appendCieLog({
      event: "engine_initialization",
      level: "info",
      details: `Customer Identity Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      customerRecords: [],
      duplicateMatches: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createCustomerIdentity(
    input: CreateCustomerIdentityInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    return this.runAction("create_identity", config, () => {
      const record = this.metadataGenerator.buildCustomerRecord({
        customerName: input.customerName,
        customerIdentifiers: input.customerIdentifiers ?? [],
        contactReferences: input.contactReferences,
        marketplaceReferences: input.marketplaceReferences,
        communicationReferences: input.communicationReferences,
      });

      const validation = this.validationEngine.validateCustomerRecord(record, config);
      if (validation.decision === "fail") {
        return {
          customerRecords: [],
          duplicateMatches: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(record);

      appendCieLog({
        event: "customer_creation",
        level: "info",
        details: `Customer identity ${record.customerId} created`,
      });

      return {
        customerRecords: [record],
        duplicateMatches: [],
        validation,
        error: null,
      };
    });
  }

  linkCustomerIdentity(
    input: LinkCustomerIdentityInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    return this.runAction("link_identity", config, () => {
      const existing = this.registry.get(input.customerId);
      if (!existing) {
        const validation = this.validator.validateCustomerRecord(
          { customerId: input.customerId } as CustomerIdentityRecord,
          config,
        );
        validation.decision = "fail";
        validation.errors.push("Customer identity not found");
        return {
          customerRecords: [],
          duplicateMatches: [],
          validation,
          error: "Customer identity not found",
        };
      }

      const updated: CustomerIdentityRecord = {
        ...existing,
        timestamp: new Date().toISOString(),
        identityStatus: "linked",
        communicationReferences: [
          ...new Set([...existing.communicationReferences, `${input.channel}:${input.reference}`]),
        ],
      };

      if (input.identifierType && input.identifierValue) {
        updated.customerIdentifiers = [
          ...existing.customerIdentifiers,
          {
            identifierType: input.identifierType,
            identifierValue: input.identifierValue,
            channel: input.channel,
          },
        ];
      }

      const validation = this.validationEngine.validateCustomerRecord(updated, config);
      updated.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.store(updated);

      appendCieLog({
        event: "identity_resolution",
        level: "info",
        details: `Linked ${input.channel}:${input.reference} to ${input.customerId}`,
      });

      return {
        customerRecords: [updated],
        duplicateMatches: [],
        validation,
        error: null,
      };
    });
  }

  detectDuplicateIdentities(
    input: DetectDuplicateIdentitiesInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    return this.runAction("detect_duplicates", config, () => {
      const matches = this.resolutionEngine.findDuplicates(
        this.registry,
        config,
        input.customerId,
      );

      for (const match of matches) {
        const record = this.registry.get(match.customerId);
        if (record && record.identityStatus !== "merged") {
          this.registry.store({ ...record, identityStatus: "duplicate" });
        }
      }

      appendCieLog({
        event: "identity_resolution",
        level: matches.length > 0 ? "warn" : "info",
        details: `Detected ${matches.length} duplicate match(es)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (matches.length > 0) validation.warnings.push(`${matches.length} duplicate(s) detected`);

      return {
        customerRecords: this.registry.list(),
        duplicateMatches: matches,
        validation,
        error: null,
      };
    });
  }

  mergeCustomerIdentities(
    input: MergeCustomerIdentitiesInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    return this.runAction("merge_identities", config, () => {
      const source = this.registry.get(input.sourceCustomerId);
      const target = this.registry.get(input.targetCustomerId);

      if (!source || !target) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Source or target customer identity not found");
        return {
          customerRecords: [],
          duplicateMatches: [],
          validation,
          error: "Source or target customer identity not found",
        };
      }

      try {
        const { merged, source: mergedSource, validation } = this.mergeEngine.merge(
          source,
          target,
          config,
          input.forceMerge,
        );

        this.registry.store(merged);
        this.registry.store(mergedSource);

        appendCieLog({
          event: "identity_merge",
          level: "info",
          details: `Merged ${input.sourceCustomerId} into ${input.targetCustomerId}`,
        });

        return {
          customerRecords: [merged, mergedSource],
          duplicateMatches: [],
          validation,
          error: null,
        };
      } catch (err) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(err instanceof Error ? err.message : String(err));
        return {
          customerRecords: [],
          duplicateMatches: [],
          validation,
          error: validation.errors.join("; "),
        };
      }
    });
  }

  resolveCustomerIdentity(
    input: ResolveCustomerIdentityInput,
    config: CustomerIdentityEngineConfiguration,
  ): CustomerIdentityRunReport {
    return this.runAction("resolve_identity", config, () => {
      const idValidation = this.validationEngine.validateIdentifier({
        identifierType: input.identifierType,
        identifierValue: input.identifierValue,
        channel: null,
      });

      if (idValidation.decision === "fail") {
        return {
          customerRecords: [],
          duplicateMatches: [],
          validation: idValidation,
          error: idValidation.errors.join("; "),
        };
      }

      const resolved = this.resolutionEngine.resolveByIdentifier(
        this.registry,
        input.identifierType,
        input.identifierValue,
        config,
      );

      appendCieLog({
        event: "identity_resolution",
        level: resolved ? "info" : "warn",
        details: resolved
          ? `Resolved identity ${resolved.customerId} for ${input.identifierType}`
          : `No identity found for ${input.identifierType}`,
      });

      const validation = idValidation;
      if (!resolved) {
        validation.warnings.push("No matching customer identity found");
        validation.decision = "partial";
      }

      return {
        customerRecords: resolved ? [resolved] : [],
        duplicateMatches: [],
        validation,
        error: null,
      };
    });
  }

  getProfileEngine(): CustomerProfileEngine {
    return this.profileEngine;
  }

  getRetryManager(): IdentityRetryManager {
    return this.retryManager;
  }

  private runAction(
    action: CustomerIdentityRunReport["action"],
    config: CustomerIdentityEngineConfiguration,
    fn: () => {
      customerRecords: CustomerIdentityRecord[];
      duplicateMatches: CustomerIdentityRunReport["duplicateMatches"];
      validation: CustomerIdentityRunReport["validation"];
      error: string | null;
    },
  ): CustomerIdentityRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Customer identity engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      customerRecords: result.customerRecords,
      duplicateMatches: result.duplicateMatches,
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
