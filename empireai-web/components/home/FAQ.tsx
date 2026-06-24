"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(212,175,55,0.06),transparent_45%)]"
      />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Questions"
          title="Everything founders ask before they launch"
          description="Clear answers on ownership, security, and how EmpireAI differs from every other AI tool on the market."
        />

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <Reveal key={faq.question} delay={index * 60}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen
                      ? "border-gold/30 bg-white/[0.04]"
                      : "border-gold/10 bg-white/[0.02] hover:border-gold/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-[#f0d78c]">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 text-[#d4af37] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isOpen ? "rotate-45 bg-gold/10" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 leading-relaxed text-[#8a847a]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
