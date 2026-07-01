import { AuthProvider } from "@/lib/auth/context";

/** REAL-081 — minimal wrapper. CockpitShell lands in REAL-084. */
export default function CockpitRouteGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthProvider>
      <div data-cockpit-scaffold className="min-h-screen bg-background">
        {children}
      </div>
    </AuthProvider>
  );
}
