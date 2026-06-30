import type { RegisteredTool } from "../../../brain/types.js";
import { listKnowledgeObjects, getKnowledgeObject, createKnowledgeObject } from "../services/knowledge-object-service.js";
import { queryKnowledgeGraph, listKnowledgeEdges } from "../services/knowledge-graph-service.js";
import { listLearningRecords, createLearningRecord } from "../services/learning-record-service.js";
import { reasonAboutProduct } from "../services/knowledge-reasoning-service.js";
import { buildEmpireKnowledgeDashboard } from "../services/empire-knowledge-dashboard-service.js";
import { CreateKnowledgeObjectInputSchema } from "../models/knowledge-object.js";
import { CreateLearningRecordInputSchema } from "../models/learning-record.js";
import { KnowledgeReasoningInputSchema } from "../models/knowledge-reasoning.js";

export const empireKnowledgeTools: RegisteredTool[] = [
  {
    name: "empire_knowledge.objects",
    description: "List or get canonical knowledge objects (K-001)",
    module: "empire-knowledge",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, objectId: { type: "string" }, objectType: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      if (args.objectId) return getKnowledgeObject(String(args.objectId));
      return listKnowledgeObjects(workspaceId, args.objectType ? String(args.objectType) : undefined);
    },
  },
  {
    name: "empire_knowledge.graph",
    description: "Query knowledge graph relationships (K-002)",
    module: "empire-knowledge",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, objectId: { type: "string" }, depth: { type: "number" } },
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      if (args.objectId) {
        return queryKnowledgeGraph(workspaceId, String(args.objectId), args.depth ? Number(args.depth) : 2);
      }
      return listKnowledgeEdges(workspaceId);
    },
  },
  {
    name: "empire_knowledge.learnings",
    description: "List or create learning records (K-003)",
    module: "empire-knowledge",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        observation: { type: "string" },
        evidence: { type: "string" },
        importance: { type: "string" },
      },
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      if (args.observation && args.evidence) {
        const input = CreateLearningRecordInputSchema.parse({
          observation: String(args.observation),
          evidence: String(args.evidence),
          importance: args.importance ? String(args.importance) : undefined,
        });
        return createLearningRecord(workspaceId, input);
      }
      return listLearningRecords(workspaceId);
    },
  },
  {
    name: "empire_knowledge.reason",
    description: "Reason about product launches with evidence (K-004)",
    module: "empire-knowledge",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, productCategory: { type: "string" }, productName: { type: "string" } },
      required: ["productCategory"],
    },
    handler: async (args) => {
      const input = KnowledgeReasoningInputSchema.parse({
        productCategory: String(args.productCategory),
        productName: args.productName ? String(args.productName) : undefined,
        companyId: args.companyId ? String(args.companyId) : undefined,
      });
      return reasonAboutProduct(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", input);
    },
  },
  {
    name: "empire_knowledge.dashboard",
    description: "Empire Knowledge Mission Control dashboard (K-005)",
    module: "empire-knowledge",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildEmpireKnowledgeDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
];
