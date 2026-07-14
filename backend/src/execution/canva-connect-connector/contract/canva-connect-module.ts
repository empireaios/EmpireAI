export const CANVA_CONNECT_MODULE_ID = "canva-connect-connector" as const;

export const CANVA_CONNECT_CAPABILITIES = [
  "oauth_authorization",
  "token_lifecycle",
  "design_operations",
  "asset_upload",
  "design_export",
] as const;

export type CanvaConnectCapability = (typeof CANVA_CONNECT_CAPABILITIES)[number];

export type CanvaConnectModuleContract = {
  moduleId: typeof CANVA_CONNECT_MODULE_ID;
  providerId: "canva";
  capabilities: CanvaConnectCapability[];
  internalOnly: true;
  consumedBy: ["visual-generation-layer"];
};

export function createCanvaConnectModuleContract(): CanvaConnectModuleContract {
  return {
    moduleId: CANVA_CONNECT_MODULE_ID,
    providerId: "canva",
    capabilities: [...CANVA_CONNECT_CAPABILITIES],
    internalOnly: true,
    consumedBy: ["visual-generation-layer"],
  };
}
