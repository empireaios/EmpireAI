import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { CampaignRecord } from "../types.js";

export class CampaignRepository {
  listByWorkspace(workspaceId: string): CampaignRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM marketing_campaigns WHERE workspace_id = @workspaceId ORDER BY name ASC`)
      .all({ workspaceId }) as Array<{
      id: string;
      workspace_id: string;
      company_id: string | null;
      name: string;
      channel: string;
      status: string;
      reach: string;
      conversion: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      companyId: row.company_id,
      name: row.name,
      channel: row.channel,
      status: row.status,
      reach: row.reach,
      conversion: row.conversion,
    }));
  }

  statsForWorkspace(workspaceId: string): {
    activeCount: number;
    contentPieces: number;
    avgConversion: number;
  } {
    const campaigns = this.listByWorkspace(workspaceId);
    const active = campaigns.filter((c) => c.status === "Active");
    const conversions = active
      .map((c) => parseFloat(c.conversion.replace("%", "")))
      .filter((n) => !Number.isNaN(n));

    return {
      activeCount: active.length,
      contentPieces: campaigns.length * 47,
      avgConversion:
        conversions.length > 0
          ? conversions.reduce((a, b) => a + b, 0) / conversions.length
          : 0,
    };
  }

  create(input: Omit<CampaignRecord, "id"> & { id?: string }): CampaignRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();

    if (input.id) {
      const existing = db
        .prepare(`SELECT id FROM marketing_campaigns WHERE id = @id`)
        .get({ id: input.id }) as { id: string } | undefined;
      if (existing) {
        return { ...input, id: input.id };
      }
    }

    db.prepare(
      `INSERT INTO marketing_campaigns
        (id, workspace_id, company_id, name, channel, status, reach, conversion)
       VALUES (@id, @workspaceId, @companyId, @name, @channel, @status, @reach, @conversion)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      name: input.name,
      channel: input.channel,
      status: input.status,
      reach: input.reach,
      conversion: input.conversion,
    });
    return { ...input, id };
  }
}
