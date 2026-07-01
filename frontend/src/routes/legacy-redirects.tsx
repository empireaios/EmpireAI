import { Navigate, useParams } from "react-router-dom";
import { paths } from "@/routes/paths";

export function LegacyBusinessRedirect() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  if (!opportunityId) return <Navigate to={paths.dashboard.brands} replace />;
  return <Navigate to={paths.dashboard.brandDetail(opportunityId)} replace />;
}

export function LegacyBusinessPreviewRedirect() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  if (!opportunityId) return <Navigate to={paths.dashboard.brands} replace />;
  return <Navigate to={paths.dashboard.businessPreview(opportunityId)} replace />;
}
