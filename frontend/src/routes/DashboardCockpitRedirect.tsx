import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildCockpitRedirectUrl } from "@/lib/cockpit-redirects";

/** REAL-126 — Redirect legacy Vite dashboard routes to Cockpit. */
export function DashboardCockpitRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.location.replace(buildCockpitRedirectUrl(pathname));
  }, [pathname]);

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#8a847a" }}>
      Redirecting to Cockpit…
    </div>
  );
}
