/**
 * G2-09 — Commerce plugin domain contract kinds.
 */

export const COMMERCE_PLUGIN_DOMAIN_CONTRACT_KINDS = [
  "commerce_plugin_slot",
  "commerce_plugin_adapter",
  "commerce_plugin_registration",
  "commerce_plugin_lifecycle",
  "commerce_plugin_capability",
] as const;

export type CommercePluginDomainContractKind =
  (typeof COMMERCE_PLUGIN_DOMAIN_CONTRACT_KINDS)[number];

export function listCommercePluginDomainContractKinds(): readonly CommercePluginDomainContractKind[] {
  return COMMERCE_PLUGIN_DOMAIN_CONTRACT_KINDS;
}
