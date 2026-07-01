/** Cockpit screen identifiers — REAL-079 screen map. */
export type CockpitScreenId =
  | "SCR-001"
  | "SCR-010"
  | "SCR-020"
  | "SCR-100"
  | "SCR-101"
  | "SCR-102"
  | "SCR-103"
  | "SCR-200"
  | "SCR-201"
  | "SCR-202"
  | "SCR-203"
  | "SCR-204"
  | "SCR-300"
  | "SCR-301"
  | "SCR-302"
  | "SCR-400"
  | "SCR-401"
  | "SCR-402"
  | "SCR-403"
  | "SCR-500"
  | "SCR-501"
  | "SCR-502"
  | "SCR-600"
  | "SCR-601"
  | "SCR-602"
  | "SCR-603"
  | "SCR-700"
  | "SCR-701"
  | "SCR-702"
  | "SCR-703"
  | "SCR-704"
  | "SCR-800"
  | "SCR-801"
  | "SCR-802"
  | "SCR-803";

export const COCKPIT_BASE = "/cockpit";

export type CockpitScaffoldPageProps = {
  screenId: CockpitScreenId;
  title: string;
};
