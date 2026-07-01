import type { ReactNode } from "react";

type GoldButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  href?: string;
};

export function GoldButton({
  children,
  variant = "primary",
  className = "",
  href = "/cockpit",
}: GoldButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

  const styles =
    variant === "primary"
      ? `${base} text-[#1a1408]`
      : `${base} border border-gold/25 bg-white/[0.03] text-[#f0d78c] backdrop-blur-sm hover:border-gold/50 hover:bg-white/[0.06]`;

  return (
    <a href={href} className={`${styles} ${className}`}>
      {variant === "primary" && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#b8922a] via-[#f0d78c] to-[#d4af37]"
          />
          <span
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-[#d4af37] via-[#fff0c2] to-[#f0d78c]"
          />
        </>
      )}
      <span className="relative">{children}</span>
    </a>
  );
}
