import type { CreatePolicyInput, PolicyRule } from "./types.js";
export class PolicyStore {
  private readonly policies = new Map<string, PolicyRule>();
  create(input: CreatePolicyInput) { if (!input.roleId && !input.principalId && !input.permissionId) throw new Error("Policy needs a role, principal, or permission"); const policyId = input.policyId ?? `azw-pol-${Date.now()}-${this.policies.size + 1}`; if (this.policies.has(policyId)) throw new Error("Policy ID already exists"); const policy: PolicyRule = { policyId, name: input.name, effect: input.effect, roleId: input.roleId, principalId: input.principalId, permissionId: input.permissionId, resource: input.resource, action: input.action, priority: input.priority ?? 0, validated: input.validated !== false, createdAt: new Date().toISOString() }; this.policies.set(policyId, policy); return { ...policy }; }
  list() { return [...this.policies.values()].sort((a, b) => b.priority - a.priority).map((policy) => ({ ...policy })); }
}
