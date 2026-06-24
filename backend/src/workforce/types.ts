export type WorkforceRoleId =
  | "ai-ceo"
  | "ai-cfo"
  | "ai-product-intelligence"
  | "ai-product-scout"
  | "ai-marketing-director"
  | "ai-operations"
  | "ai-supplier-manager"
  | "ai-supplier-intelligence"
  | "ai-customer-success"
  | "ai-treasurer"
  | "ai-guardian";

export type WorkforceRoleDefinition = {
  id: WorkforceRoleId;
  title: string;
  module: string;
  agentId?: string;
  responsibilities: string[];
  authorityLevel: "L0" | "L1" | "L2" | "L3" | "L4";
  status: "active" | "prepared" | "planned";
  reportsTo?: WorkforceRoleId;
};

export type WorkforceOrgChart = {
  roles: WorkforceRoleDefinition[];
  checkedAt: string;
};
