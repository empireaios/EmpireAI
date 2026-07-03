import { useEffect } from "react";

import { buildCockpitRedirectUrl } from "@/lib/cockpit-redirects";
import { paths } from "@/routes/paths";

/** Legacy /dashboard/pillow — redirects to canonical Cockpit Pillow panel. */
export function PillowCompanionRouteRedirect() {
  useEffect(() => {
    window.location.replace(buildCockpitRedirectUrl(paths.dashboard.pillow));
  }, []);

  return null;
}
