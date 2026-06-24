import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { AdChannelRecord } from "../types.js";

export class AdRepository {
  listByWorkspace(workspaceId: string): AdChannelRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM ad_channels WHERE workspace_id = @workspaceId ORDER BY channel ASC`)
      .all({ workspaceId }) as Array<{
      id: string;
      workspace_id: string;
      channel: string;
      spend_cents: number;
      roas: number;
      status: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      channel: row.channel,
      spendCents: row.spend_cents,
      roas: row.roas,
      status: row.status,
    }));
  }

  statsForWorkspace(workspaceId: string): {
    dailyBudgetCents: number;
    spendTodayCents: number;
    blendedRoas: number;
    conversions: number;
  } {
    const channels = this.listByWorkspace(workspaceId);
    const live = channels.filter((c) => c.status === "Live");
    const spend = live.reduce((sum, c) => sum + c.spendCents, 0);
    const roas =
      live.length > 0 ? live.reduce((sum, c) => sum + c.roas, 0) / live.length : 0;

    return {
      dailyBudgetCents: Math.round(spend * 1.2),
      spendTodayCents: Math.round(spend * 0.76),
      blendedRoas: roas,
      conversions: Math.round(spend / 100 / 15),
    };
  }

  create(input: Omit<AdChannelRecord, "id"> & { id?: string }): AdChannelRecord {
    const db = getDatabase();
    const id = input.id ?? randomUUID();
    db.prepare(
      `INSERT INTO ad_channels (id, workspace_id, channel, spend_cents, roas, status)
       VALUES (@id, @workspaceId, @channel, @spendCents, @roas, @status)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      channel: input.channel,
      spendCents: input.spendCents,
      roas: input.roas,
      status: input.status,
    });
    return { ...input, id };
  }
}
