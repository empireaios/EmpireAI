"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { buildLoginPath } from "@/lib/auth/redirect";

export function CockpitAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(buildLoginPath(pathname));
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] text-sm text-[#8a847a]">
        Verifying session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
