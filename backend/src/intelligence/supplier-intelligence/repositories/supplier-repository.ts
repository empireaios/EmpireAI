import type {
  SupplierProfile,
  SupplierProfileCreateInput,
  SupplierProfileUpdateInput,
} from "../models/supplier-profile.js";
import type { SupplierRiskLevel } from "../models/supplier-risk-profile.js";

export type SupplierListQuery = {
  workspaceId: string;
  supplierId?: string;
  country?: string;
  category?: string;
  minTrustScore?: number;
  riskLevel?: SupplierRiskLevel;
  limit?: number;
  offset?: number;
};

/** Persistence contract for supplier intelligence profiles. */
export interface SupplierRepository {
  create(workspaceId: string, input: SupplierProfileCreateInput): Promise<SupplierProfile>;
  getById(workspaceId: string, id: string): Promise<SupplierProfile | null>;
  getBySupplierId(workspaceId: string, supplierId: string): Promise<SupplierProfile | null>;
  update(
    workspaceId: string,
    id: string,
    input: SupplierProfileUpdateInput,
  ): Promise<SupplierProfile>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: SupplierListQuery): Promise<SupplierProfile[]>;
}
