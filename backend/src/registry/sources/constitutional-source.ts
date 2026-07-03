/**
 * EA-003 — Tier 0 constitutional registry source (REG-DOCTRINE).
 */

import { GOVERNANCE_DOCTRINE_CATALOG } from "../../foundation/empire-governance-doctrine/catalog/gvd-catalog.js";
import type { GovernanceDoctrineArticle } from "../../foundation/empire-governance-doctrine/models/governance-doctrine.js";

export const DOCTRINE_REGISTRY_VERSION = "1.0.0";

export function loadDoctrineRows(): GovernanceDoctrineArticle[] {
  return [...GOVERNANCE_DOCTRINE_CATALOG];
}

export function loadDoctrineRow(doctrineId: string): GovernanceDoctrineArticle | undefined {
  return GOVERNANCE_DOCTRINE_CATALOG.find((d) => d.doctrineId === doctrineId);
}
