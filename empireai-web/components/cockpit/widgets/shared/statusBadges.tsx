import { Badge } from "@/components/platform/ui/PlatformPrimitives";

export function statusBadgeVariant(
  status: string,
): "success" | "gold" | "default" | "warning" | "danger" {
  const normalized = status.toLowerCase();
  if (["complete", "ready", "live", "published", "active", "online", "connected"].includes(normalized)) {
    return "success";
  }
  if (["in_progress", "review", "pending", "draft", "queued"].includes(normalized)) {
    return "gold";
  }
  if (["blocked", "failed", "offline", "disconnected"].includes(normalized)) {
    return "warning";
  }
  if (["critical", "error"].includes(normalized)) {
    return "danger";
  }
  return "default";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{status.replace(/_/g, " ")}</Badge>;
}
