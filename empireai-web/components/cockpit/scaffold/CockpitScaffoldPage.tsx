import type { CockpitScaffoldPageProps } from "@/lib/cockpit/types";

/** REAL-081 placeholder — replaced by department pages in REAL-084+. */
export function CockpitScaffoldPage({ screenId, title }: CockpitScaffoldPageProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-widest text-foreground/60">
        Project Cockpit · Scaffold
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">{title}</h1>
      <p className="mt-4 text-sm text-foreground/60">
        Route registered ({screenId}). Shell, navigation, and screen content ship in REAL-082–088.
      </p>
    </main>
  );
}
