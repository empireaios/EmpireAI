import { testimonials } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Founder Stories"
          title="Trusted by operators building real empires"
          description="From solo founders to portfolio holding companies—EmpireAI is the operating system behind the next generation of AI-native ventures."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 100}>
              <figure className="group flex h-full flex-col rounded-2xl border border-gold/10 bg-white/[0.02] p-8 transition-all duration-700 hover:border-gold/25 hover:bg-white/[0.04]">
                <div className="mb-6 font-display text-5xl leading-none text-gold/20">
                  &ldquo;
                </div>
                <blockquote className="flex-1 text-lg leading-relaxed text-[#c8c0b0]">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-8 border-t border-gold/10 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-[#f0d78c]">{item.name}</p>
                      <p className="mt-1 text-sm text-[#6f6a60]">{item.role}</p>
                    </div>
                    <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-semibold text-[#d4af37]">
                      {item.metric}
                    </span>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
