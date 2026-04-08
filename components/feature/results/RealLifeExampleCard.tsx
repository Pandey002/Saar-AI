interface RealLifeExampleCardProps {
  text: string;
  title?: string;
}

export function RealLifeExampleCard({
  text,
  title = "Real-life example",
}: RealLifeExampleCardProps) {
  return (
    <article className="rounded-[24px] border border-amber-200 bg-[linear-gradient(180deg,#fff7d6,#fff1b8)] p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
        Real-life example
      </p>
      <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-6 text-slate-700">
        {text}
      </p>
    </article>
  );
}
