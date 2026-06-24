import { plans } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GoldButton } from "@/components/ui/GoldButton";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(212,175,55,0.1),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Investment"
          title="Plans built for founders and empire builders"
          description="Start with one venture or orchestrate an entire portfolio. Every tier includes the core manufacturing engine."
        />

        <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 100}>
              <article
                className={`relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  plan.highlighted
                    ? "scale-[1.02] border-gold/40 bg-gradient-to-b from-gold/10 to-white/[0.02] shadow-[0_0_60px_rgba(212,175,55,0.15)]"
                    : "border-gold/10 bg-white/[0.02] hover:border-gold/25"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1a1408]">
                    Most Popular
                  </span>
                )}

                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                  {plan.name}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl text-[#f0d78c]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-[#6f6a60]">{plan.period}</span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#8a847a]">
                  {plan.description}
                </p>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-[#c8c0b0]"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#d4af37]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <GoldButton
                    href="#"
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </GoldButton>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
