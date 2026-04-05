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
    <section id={id} className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8 ${className}`}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-[24px] font-bold tracking-[-0.04em] text-slate-900">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
