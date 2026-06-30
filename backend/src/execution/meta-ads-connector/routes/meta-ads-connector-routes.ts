import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { metaAdCreativeSchema, metaAudienceSchema } from "../models/meta-ads-campaign-record.js";
import {
  applyMetaCampaignApproval,
  exchangeMetaAdsOAuthCode,
  getMetaAdsOAuthStatus,
  getMetaCampaignById,
  launchMetaCampaign,
  listMetaCampaigns,
  MetaAdsBlockedError,
  prepareMetaCampaign,
  syncMetaCampaignReport,
  syncMetaCampaignStatus,
  uploadMetaCreative,
  getMetaAdsOAuthUrl,
} from "../services/meta-ads-campaign-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

const approvalSchema = z.object({
  campaignId: z.string().min(1),
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: z.string().datetime({ offset: true }),
});

function requireFounder(role: string, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  if (role !== "founder" && role !== "admin") {
    reply.code(403).send({ error: "Grand King founder approval required for Meta Ads launch" });
    return false;
  }
  return true;
}

export async function registerMetaAdsConnectorRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get(
    "/meta-ads/oauth/url",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({ companyId: z.string().min(1) })
        .parse(request.query);

      const result = getMetaAdsOAuthUrl({
        workspaceId: user.workspaceId,
        companyId: query.companyId,
      });

      return reply.send(result);
    },
  );

  app.post(
    "/meta-ads/oauth/exchange",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({ companyId: z.string().min(1), code: z.string().min(1) })
        .parse(request.body);

      const oauth = await exchangeMetaAdsOAuthCode({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        code: body.code,
      });

      auditLogger.write({
        action: "meta_ads.oauth_connected",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: { mock: oauth.mock },
      });

      return reply.send({ oauth: { ...oauth, accessToken: "[redacted]" } });
    },
  );

  app.get(
    "/meta-ads/oauth/status",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const oauth = getMetaAdsOAuthStatus(user.workspaceId, query.companyId);
      return reply.send({
        connected: Boolean(oauth),
        mock: oauth?.mock ?? false,
        adAccountId: oauth?.adAccountId ?? null,
      });
    },
  );

  app.post(
    "/meta-ads/campaigns/prepare",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          name: z.string().min(1),
          objective: z.string().optional(),
          budgetCents: z.number().int().min(100),
          budgetType: z.enum(["daily", "lifetime"]).optional(),
          currency: z.string().length(3).optional(),
          audience: metaAudienceSchema,
          creative: metaAdCreativeSchema.optional(),
        })
        .parse(request.body);

      const campaign = prepareMetaCampaign({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        name: body.name,
        objective: body.objective,
        budgetCents: body.budgetCents,
        budgetType: body.budgetType,
        currency: body.currency,
        audience: body.audience,
        creative: body.creative,
      });

      auditLogger.write({
        action: "meta_ads.campaign_prepared",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: { campaignId: campaign.campaignId, status: campaign.status },
      });

      return reply.send({ campaign });
    },
  );

  app.post(
    "/meta-ads/campaigns/approve",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = approvalSchema.parse(request.body);
      const campaign = applyMetaCampaignApproval(body);

      if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "meta_ads.campaign_approved",
        actor: user.email,
        workspaceId: campaign.workspaceId,
        companyId: campaign.companyId,
        correlationId: request.id,
        metadata: { campaignId: campaign.campaignId },
      });

      return reply.send({ campaign });
    },
  );

  app.post(
    "/meta-ads/campaigns/creative",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          campaignId: z.string().min(1),
          creative: metaAdCreativeSchema,
        })
        .parse(request.body);

      const campaign = uploadMetaCreative(body);
      if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "meta_ads.creative_uploaded",
        actor: user.email,
        workspaceId: campaign.workspaceId,
        companyId: campaign.companyId,
        correlationId: request.id,
        metadata: { campaignId: campaign.campaignId },
      });

      return reply.send({ campaign });
    },
  );

  app.post(
    "/meta-ads/campaigns/launch",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (!requireFounder(user.role, reply)) return;

      const body = z.object({ campaignId: z.string().min(1) }).parse(request.body);

      try {
        const campaign = await launchMetaCampaign(body.campaignId);
        if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
          return reply.code(403).send({ error: "Workspace mismatch" });
        }

        auditLogger.write({
          action: "meta_ads.campaign_launched",
          actor: user.email,
          workspaceId: campaign.workspaceId,
          companyId: campaign.companyId,
          correlationId: request.id,
          metadata: {
            campaignId: campaign.campaignId,
            status: campaign.status,
            metaCampaignId: campaign.metaCampaignId,
          },
        });

        return reply.send({ campaign });
      } catch (error) {
        if (error instanceof MetaAdsBlockedError) {
          return reply.code(403).send({
            error: error.message,
            blocked: true,
            protectTheEmpire: error.protectTheEmpire,
          });
        }
        throw error;
      }
    },
  );

  app.post(
    "/meta-ads/campaigns/status/sync",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ campaignId: z.string().min(1) }).parse(request.body);
      const campaign = await syncMetaCampaignStatus(body.campaignId);

      if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "meta_ads.status_synced",
        actor: user.email,
        workspaceId: campaign.workspaceId,
        companyId: campaign.companyId,
        correlationId: request.id,
        metadata: { campaignId: campaign.campaignId, status: campaign.status },
      });

      return reply.send({ campaign });
    },
  );

  app.post(
    "/meta-ads/campaigns/report/sync",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ campaignId: z.string().min(1) }).parse(request.body);
      const campaign = await syncMetaCampaignReport(body.campaignId);

      if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "meta_ads.report_synced",
        actor: user.email,
        workspaceId: campaign.workspaceId,
        companyId: campaign.companyId,
        correlationId: request.id,
        metadata: {
          campaignId: campaign.campaignId,
          spendCents: campaign.report?.spendCents ?? 0,
        },
      });

      return reply.send({ campaign });
    },
  );

  app.get(
    "/meta-ads/campaigns",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const campaigns = listMetaCampaigns(user.workspaceId, query.companyId);
      return reply.send({ campaigns });
    },
  );

  app.get(
    "/meta-ads/campaigns/:campaignId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ campaignId: z.string().min(1) }).parse(request.params);
      const campaign = getMetaCampaignById(params.campaignId);
      if (!campaign) {
        return reply.code(404).send({ error: "Campaign not found" });
      }
      if (campaign.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }
      return reply.send({ campaign });
    },
  );
}
