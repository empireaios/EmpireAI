import { footerLinks } from "@/lib/content";
import { GoldButton } from "@/components/ui/GoldButton";
import { Reveal } from "@/components/ui/Reveal";

export function Footer() {
  return (
    <footer id="footer" className="relative border-t border-gold/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="py-20 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold/75">
              Ready to build
            </p>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold text-transparent sm:text-5xl bg-gradient-to-b from-[#f0d78c] via-[#d4af37] to-[#b8922a] bg-clip-text">
              Your empire starts with a single command.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[#8a847a]">
              Join founders manufacturing companies at machine speed. Launch
              your first venture on EmpireAI today.
            </p>
            <div className="mt-10">
              <GoldButton href="/cockpit">Launch EmpireAI</GoldButton>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-12 border-t border-gold/10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-2xl tracking-[0.1em] text-transparent bg-gradient-to-r from-[#f0d78c] to-[#d4af37] bg-clip-text">
              EmpireAI
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#6f6a60]">
              The AI operating system that manufactures companies for the next
              generation of founders.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37] capitalize">
                {group}
              </p>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#8a847a] transition-colors duration-300 hover:text-[#f0d78c]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gold/10 py-8 sm:flex-row">
          <p className="text-xs text-[#6f6a60]">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            EmpireAI. All rights reserved.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[#6f6a60]">
            Manufacture. Scale. Sovereign.
          </p>
        </div>
      </div>
    </footer>
  );
}
