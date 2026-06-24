import { steps } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-24 lg:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(212,175,55,0.08),transparent_45%)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Process"
          title="From vision to operating company in four movements"
          description="EmpireAI compresses years of startup formation into a repeatable, AI-native manufacturing pipeline."
        />

        <div className="relative">
          <div
            aria-hidden
            className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent lg:left-1/2 lg:block lg:-translate-x-1/2"
          />

          <div className="space-y-8 lg:space-y-0">
            {steps.map((step, index) => (
              <Reveal key={step.step} delay={index * 120}>
                <div
                  className={`relative flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16 ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  } ${index > 0 ? "lg:mt-16" : ""}`}
                >
                  <div className="lg:w-1/2">
                    <div className="rounded-2xl border border-gold/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all duration-700 hover:border-gold/25 hover:bg-white/[0.04]">
                      <p className="font-display text-5xl text-gold/20">
                        {step.step}
                      </p>
                      <h3 className="mt-2 font-display text-3xl text-[#f0d78c]">
                        {step.title}
                      </h3>
                      <p className="mt-4 leading-relaxed text-[#8a847a]">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:w-1/2 lg:justify-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-[#0a0a0a] shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                      <span className="font-display text-xl text-[#d4af37]">
                        {step.step}
                      </span>
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-gold/20 animate-ping-slow"
                      />
                    </div>
                  </div>

                  <div className="lg:hidden">
                    <div className="ml-8 h-px w-16 bg-gradient-to-r from-gold/40 to-transparent" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
