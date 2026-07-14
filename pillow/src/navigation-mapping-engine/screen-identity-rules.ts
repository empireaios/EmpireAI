/** T1-05 — Screen identity detection rules. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { StructuralRegionType } from "../layout-understanding-engine/types.js";

export type ScreenIdentityRule = {
  name: string;
  regionTypes: StructuralRegionType[];
  baseConfidence: number;
};

export const DEFAULT_SCREEN_IDENTITY_RULES: ScreenIdentityRule[] = [
  { name: "main_screen", regionTypes: ["main_content"], baseConfidence: 0.85 },
  { name: "modal_screen", regionTypes: ["modal", "dialog"], baseConfidence: 0.9 },
  { name: "drawer_screen", regionTypes: ["drawer"], baseConfidence: 0.88 },
];

export type ScreenIdentity = {
  screenId: string;
  routeId: string | null;
  viewId: string | null;
  confidence: number;
  overlayKind: "none" | "modal" | "drawer";
};

export class ScreenIdentityEngine {
  identify(layout: LayoutModel, rules: ScreenIdentityRule[]): ScreenIdentity {
    const baseScreenId =
      layout.metadata.screenId ?? layout.metadata.sourceStateId ?? layout.metadata.layoutId;

    const modalRegion = layout.regions.find(
      (r) => r.regionType === "modal" || r.regionType === "dialog",
    );
    const drawerRegion = layout.regions.find((r) => r.regionType === "drawer");
    const mainRegion = layout.regions.find((r) => r.regionType === "main_content");

    let overlayKind: ScreenIdentity["overlayKind"] = "none";
    let screenId = baseScreenId;
    let confidence = 0.75;

    if (modalRegion) {
      overlayKind = "modal";
      screenId = `${baseScreenId}::modal::${modalRegion.regionId}`;
      confidence = 0.9;
    } else if (drawerRegion) {
      overlayKind = "drawer";
      screenId = `${baseScreenId}::drawer::${drawerRegion.regionId}`;
      confidence = 0.88;
    } else {
      const matchedRule = rules.find((rule) =>
        layout.regions.some((r) => rule.regionTypes.includes(r.regionType)),
      );
      if (matchedRule) confidence = matchedRule.baseConfidence;
      if (mainRegion) {
        screenId = `${baseScreenId}::view::${mainRegion.regionId}`;
      }
    }

    const routeId = layout.metadata.sourceStateId;
    const viewId = mainRegion?.regionId ?? layout.metadata.layoutId;

    return { screenId, routeId, viewId, confidence, overlayKind };
  }
}
