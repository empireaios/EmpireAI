import { categories } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ProductCategories() {
  return (
    <section id="categories" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Verticals"
          title="Manufacture across every high-velocity category"
          description="EmpireAI ships with domain-specific playbooks, agent configurations, and infrastructure tuned for how each market actually wins."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.name} delay={index * 70}>
              <article className="group relative overflow-hidden rounded-2xl border border-gold/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-gold/30 hover:shadow-[0_20px_60px_rgba(212,175,55,0.1)]">
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/5 blur-2xl transition-all duration-700 group-hover:bg-gold/10"
                />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
                  {category.stats}
                </p>
                <h3 className="mt-4 font-display text-3xl text-[#f5f0e6]">
                  {category.name}
                </h3>
                <p className="mt-3 leading-relaxed text-[#8a847a]">
                  {category.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-[#d4af37] opacity-0 transition-all duration-500 group-hover:opacity-100">
                  <span>Explore playbook</span>
                  <span aria-hidden>→</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
