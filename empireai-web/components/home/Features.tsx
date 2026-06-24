import { features } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Capabilities"
          title="Everything required to manufacture a modern company"
          description="EmpireAI replaces fragmented tools with a unified operating layer—strategy, execution, and intelligence in one sovereign system."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 80}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-gold/10 bg-white/[0.02] p-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-gold/30 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(212,175,55,0.08)]">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
                  {feature.metric}
                </p>
                <h3 className="mt-4 font-display text-2xl text-[#f5f0e6]">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-[#8a847a]">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
