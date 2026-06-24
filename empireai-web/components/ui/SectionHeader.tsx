import { Reveal } from "./Reveal";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  const alignment =
    align === "center"
      ? "mx-auto text-center items-center"
      : "text-left items-start";

  return (
    <Reveal className={`mb-16 flex max-w-3xl flex-col gap-5 ${alignment}`}>
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold/75">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-transparent sm:text-5xl bg-gradient-to-b from-[#f0d78c] via-[#d4af37] to-[#b8922a] bg-clip-text">
        {title}
      </h2>
      <p className="max-w-2xl text-lg leading-relaxed text-[#a8a095]">
        {description}
      </p>
    </Reveal>
  );
}
