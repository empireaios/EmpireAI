import { AuthProvider } from "@/lib/auth/context";
import { CockpitShell } from "@/components/cockpit/shell/CockpitShell";

export default function CockpitRouteGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthProvider>
      <CockpitShell>{children}</CockpitShell>
    </AuthProvider>
  );
}
