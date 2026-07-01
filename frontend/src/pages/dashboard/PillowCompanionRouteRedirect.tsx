import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { usePillowCompanion } from "@/context/PillowCompanionContext";
import { paths } from "@/routes/paths";

/** Legacy /dashboard/pillow route — opens companion and returns to current workflow. */
export function PillowCompanionRouteRedirect() {
  const navigate = useNavigate();
  const { openCompanion } = usePillowCompanion();

  useEffect(() => {
    openCompanion();
    navigate(paths.dashboard.home, { replace: true });
  }, [navigate, openCompanion]);

  return null;
}
