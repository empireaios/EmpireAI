/** T1-05 — Route and view state detection. */

import type { ScreenIdentity } from "./screen-identity-rules.js";

export type RouteState = {
  routeId: string | null;
  viewId: string | null;
  screenId: string;
  routeChanged: boolean;
  viewChanged: boolean;
  screenChanged: boolean;
  previousRouteId: string | null;
  previousViewId: string | null;
  previousScreenId: string | null;
};

export class RouteStateDetector {
  detect(
    identity: ScreenIdentity,
    previous: RouteState | null,
  ): RouteState {
    const routeId = identity.routeId;
    const viewId = identity.viewId;
    const screenId = identity.screenId;

    return {
      routeId,
      viewId,
      screenId,
      routeChanged: previous !== null && previous.routeId !== routeId,
      viewChanged: previous !== null && previous.viewId !== viewId,
      screenChanged: previous !== null && previous.screenId !== screenId,
      previousRouteId: previous?.routeId ?? null,
      previousViewId: previous?.viewId ?? null,
      previousScreenId: previous?.screenId ?? null,
    };
  }
}
