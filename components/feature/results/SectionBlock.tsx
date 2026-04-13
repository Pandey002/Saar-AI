import type { ReactNode } from "react";

interface SectionBlockProps {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({ id, eyebrow, title, children, className = "" }: SectionBlockProps) {
  return (
    <section id={id} className={`section-block rounded-[32px] border border-line bg-[#F6F3E6] p-5 transition sm:p-7 ${className}`}>
      {eyebrow ? (
        <p className="section-eyebrow mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mb-6 font-serif text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
