import { PlatformShell } from "@/components/platform/shell/PlatformShell";
import { AuthProvider } from "@/lib/auth/context";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PlatformShell>{children}</PlatformShell>
    </AuthProvider>
  );
}
