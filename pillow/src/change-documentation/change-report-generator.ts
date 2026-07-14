/** T3-09 — Change documentation report generation and persistence. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type {
  ChangeDocumentationRecord,
  ChangeDocumentationRunReport,
  ChangeDocumentationRunValidationReport,
} from "./types.js";
import { ChangeMetadataGenerator } from "./change-metadata-generator.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ChangeReportGenerator {
  private readonly metadata = new ChangeMetadataGenerator();

  buildReport(
    records: ChangeDocumentationRecord[],
    validation: ChangeDocumentationRunValidationReport,
    durationMs: number,
  ): ChangeDocumentationRunReport {
    appendChangeDocumentationLog({
      event: "documentation_report_generation",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Report with ${records.length} record(s)`,
    });

    return {
      changeDocumentationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      records,
      validation,
      durationMs,
      metadataVersion: CHANGE_METADATA_VERSION,
    };
  }

  persist(
    report: ChangeDocumentationRunReport,
    config: ChangeDocumentationConfiguration,
    repositoryRoot?: string,
  ): void {
    const base = repositoryRoot
      ? join(repositoryRoot, config.documentationOutputLocation)
      : config.documentationOutputLocation;

    try {
      mkdirSync(base, { recursive: true });
      const filename = `${report.changeDocumentationRunReportId}.json`;
      const path = join(base, filename);
      writeFileSync(path, JSON.stringify(report, null, 2), "utf8");

      if (config.documentationFormat === "markdown") {
        const mdPath = join(base, `${report.changeDocumentationRunReportId}.md`);
        writeFileSync(mdPath, this.toMarkdown(report), "utf8");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to persist report";
      appendChangeDocumentationLog({
        event: "documentation_failure",
        level: "warn",
        details: `Report persistence skipped: ${message}`,
      });
    }
  }

  private toMarkdown(report: ChangeDocumentationRunReport): string {
    const lines = [
      `# Change Documentation Report`,
      ``,
      `**Run ID:** ${report.changeDocumentationRunReportId}`,
      `**Timestamp:** ${report.runTimestamp}`,
      `**Decision:** ${report.validation.decision}`,
      `**Records:** ${report.records.length}`,
      ``,
    ];

    for (const record of report.records) {
      lines.push(`## ${record.changeType}`);
      lines.push(`- **Summary:** ${record.changeSummary}`);
      lines.push(`- **UX Rationale:** ${record.uxRationale}`);
      lines.push(`- **Files:** ${record.affectedFiles.join(", ") || "none"}`);
      lines.push(`- **Status:** ${record.finalChangeStatus}`);
      lines.push(``);
    }

    return lines.join("\n");
  }
}
