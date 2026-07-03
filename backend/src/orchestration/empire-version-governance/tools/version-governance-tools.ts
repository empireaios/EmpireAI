import type { RegisteredTool } from "../../../brain/types.js";
import {
  authorizeEmpireVersion1Lock,
  buildEmpireVersion1LockReport,
  recommendFutureVersion,
} from "../services/version-lock-service.js";
import { buildEmpireVersionStatusReport } from "../services/version-status-service.js";
import { assessEmpireVersion1Certification } from "../services/version-1-certification-service.js";

export const versionGovernanceTools: RegisteredTool[] = [
  {
    name: "empire_version_governance.certification",
    description: "EmpireAI Version 1.0 certification and activation assessment",
    module: "empire-version-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        validationSuitePass: { type: "boolean" },
        backendTypecheckPass: { type: "boolean" },
        frontendTypecheckPass: { type: "boolean" },
      },
    },
    handler: async (args) =>
      assessEmpireVersion1Certification({
        validationSuitePass: Boolean(args.validationSuitePass ?? true),
        backendTypecheckPass: Boolean(args.backendTypecheckPass ?? true),
        frontendTypecheckPass: Boolean(args.frontendTypecheckPass ?? true),
      }),
  },
  {
    name: "empire_version_governance.lock_report",
    description: "EmpireAI Version 1.0 lock report with snapshots and history",
    module: "empire-version-governance",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        grandKingAuthorizes: { type: "boolean" },
      },
    },
    handler: async (args) =>
      buildEmpireVersion1LockReport({
        actorId: String(args.actorId ?? "grand-king"),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        grandKingAuthorizes: Boolean(args.grandKingAuthorizes ?? true),
        validationSuitePass: true,
        backendTypecheckPass: true,
        frontendTypecheckPass: true,
      }),
  },
  {
    name: "empire_version_governance.status",
    description: "Current released version, working version, and version history counts",
    module: "empire-version-governance",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () =>
      buildEmpireVersionStatusReport({
        validationSuitePass: true,
        backendTypecheckPass: true,
        frontendTypecheckPass: true,
      }),
  },
  {
    name: "empire_version_governance.authorize_lock",
    description: "Grand King authorized Version 1.0 lock under Version Lock Doctrine",
    module: "empire-version-governance",
    authorityLevel: "L0",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        grandKingAuthorizes: { type: "boolean" },
      },
    },
    handler: async (args) =>
      authorizeEmpireVersion1Lock({
        actorId: String(args.actorId ?? "grand-king"),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        grandKingAuthorizes: Boolean(args.grandKingAuthorizes ?? false),
        validationSuitePass: true,
        backendTypecheckPass: true,
        frontendTypecheckPass: true,
      }),
  },
  {
    name: "empire_version_governance.recommend_version",
    description: "Pillow version recommendation — never auto-creates a version",
    module: "empire-version-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        workspaceId: { type: "string" },
        ownerId: { type: "string" },
        suggestedVersion: { type: "string" },
        summary: { type: "string" },
      },
    },
    handler: async (args) =>
      recommendFutureVersion({
        actorId: String(args.actorId ?? "pillow"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        ownerId: String(args.ownerId ?? "grand-king"),
        suggestedVersion: String(args.suggestedVersion ?? "1.1"),
        summary: String(args.summary ?? "Pillow pending version recommendation"),
      }),
  },
];
