import { getDatabase } from "../../../brain/database.js";
import type { CrirReport } from "../models/crir-report.js";

function mapRow(row: Record<string, unknown>): CrirReport {
  return JSON.parse(String(row.record_json)) as CrirReport;
}

let tablesEnsured = false;

export class SqliteCrirReportRepository {
  ensureTables(): void {
    if (tablesEnsured) return;
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS crir_reports (
        report_id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        product_or_opportunity_id TEXT,
        certification_status TEXT NOT NULL,
        survivability_assessment TEXT NOT NULL,
        record_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_crir_reports_scope
        ON crir_reports(workspace_id, company_id, updated_at DESC);
    `);
    tablesEnsured = true;
  }

  upsert(report: CrirReport): CrirReport {
    this.ensureTables();
    const db = getDatabase();
    db.prepare(
      `INSERT INTO crir_reports
        (report_id, workspace_id, company_id, product_or_opportunity_id,
         certification_status, survivability_assessment, record_json, updated_at)
       VALUES
        (@reportId, @workspaceId, @companyId, @productOrOpportunityId,
         @certificationStatus, @survivabilityAssessment, @json, @updatedAt)
       ON CONFLICT(report_id) DO UPDATE SET
         certification_status = excluded.certification_status,
         survivability_assessment = excluded.survivability_assessment,
         product_or_opportunity_id = excluded.product_or_opportunity_id,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      reportId: report.reportId,
      workspaceId: report.workspaceId,
      companyId: report.companyId,
      productOrOpportunityId: report.productOrOpportunityId ?? null,
      certificationStatus: report.certificationStatus,
      survivabilityAssessment: report.survivabilityAssessment,
      json: JSON.stringify(report),
      updatedAt: report.updatedAt,
    });
    return report;
  }

  getById(reportId: string): CrirReport | null {
    this.ensureTables();
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM crir_reports WHERE report_id = @reportId`)
      .get({ reportId }) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : null;
  }

  listForCompany(workspaceId: string, companyId: string): CrirReport[] {
    this.ensureTables();
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM crir_reports
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY updated_at DESC`,
      )
      .all({ workspaceId, companyId }) as Array<Record<string, unknown>>;
    return rows.map(mapRow);
  }

  findBestForLaunchScope(
    workspaceId: string,
    companyId: string,
    productOrOpportunityId?: string,
  ): CrirReport | null {
    const reports = this.listForCompany(workspaceId, companyId);
    if (reports.length === 0) return null;

    if (productOrOpportunityId) {
      const productMatch = reports.find(
        (report) => report.productOrOpportunityId === productOrOpportunityId,
      );
      if (productMatch) return productMatch;
    }

    return reports[0] ?? null;
  }
}

let repositoryInstance: SqliteCrirReportRepository | null = null;

export function getCrirReportRepository(): SqliteCrirReportRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteCrirReportRepository();
  }
  return repositoryInstance;
}

export function resetCrirReportRepository(): void {
  if (repositoryInstance) {
    repositoryInstance.ensureTables();
    const db = getDatabase();
    db.exec(`DELETE FROM crir_reports`);
  }
  repositoryInstance = null;
  tablesEnsured = false;
}
