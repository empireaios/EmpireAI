import { GoldButton } from "@/components/ui/GoldButton";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.16),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(212,175,55,0.05),transparent_35%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <Reveal>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.35em] text-gold/80">
                The AI Operating System
              </p>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl lg:text-7xl bg-gradient-to-b from-[#fff0c2] via-[#d4af37] to-[#9a7b1a] bg-clip-text">
                The AI OS that manufactures companies.
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-[#a8a095] lg:mx-0 lg:text-xl">
                EmpireAI orchestrates autonomous agents, market intelligence, and
                global infrastructure to build, launch, and scale ventures at
                machine speed—for founders who think in empires.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <GoldButton href="/platform/dashboard">Launch EmpireAI</GoldButton>
                <GoldButton href="#how-it-works" variant="secondary">
                  See How It Works
                </GoldButton>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="mt-14 flex flex-wrap items-center justify-center gap-8 border-t border-gold/10 pt-10 lg:justify-start">
                {[
                  { value: "$840M+", label: "Portfolio GMV" },
                  { value: "2,400+", label: "Companies launched" },
                  { value: "18+", label: "AI agents per venture" },
                ].map((stat) => (
                  <div key={stat.label} className="text-left">
                    <p className="font-display text-2xl text-[#f0d78c]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#6f6a60]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative">
            <div className="hero-float relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-gold/20 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-[#0a0a0a]/90 shadow-[0_0_80px_rgba(212,175,55,0.12)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d4af37]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gold/20" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#6f6a60]">
                    Command Center
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Revenue", value: "$128K", delta: "+24%" },
                      { label: "Agents", value: "18", delta: "Active" },
                      { label: "Margin", value: "42%", delta: "+6%" },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-xl border border-gold/10 bg-white/[0.02] p-3"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
                          {metric.label}
                        </p>
                        <p className="mt-1 font-display text-lg text-[#f0d78c]">
                          {metric.value}
                        </p>
                        <p className="text-[10px] text-emerald-400/80">
                          {metric.delta}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gold/10 bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#6f6a60]">
                        Agent Activity
                      </p>
                      <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      {[
                        "Growth Agent — scaled Meta ROAS to 4.2×",
                        "Product Agent — launched 12 SKUs in EU",
                        "Finance Agent — optimized margin to 42%",
                      ].map((line) => (
                        <div
                          key={line}
                          className="flex items-center gap-3 rounded-lg bg-black/40 px-3 py-2 text-xs text-[#c8c0b0]"
                        >
                          <span className="h-1 w-1 shrink-0 rounded-full bg-[#d4af37]" />
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {["Manufacture", "Optimize", "Scale"].map((action, i) => (
                      <div
                        key={action}
                        className={`flex-1 rounded-lg py-2 text-center text-[10px] font-semibold uppercase tracking-wider ${
                          i === 0
                            ? "bg-gradient-to-r from-[#b8922a] to-[#d4af37] text-[#1a1408]"
                            : "border border-gold/15 text-[#a8a095]"
                        }`}
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
