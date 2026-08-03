import type { ApprovalGate } from "./types.js"; export function isApproved(gate:ApprovalGate|undefined){return gate?.status==="approved"}
