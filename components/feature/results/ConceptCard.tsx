interface ConceptCardProps {
  title: string;
  description: string;
}

export function ConceptCard({ title, description }: ConceptCardProps) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-[#f8fbff] p-5 shadow-[0_12px_30px_rgba(59,130,246,0.08)]">
      <div className="h-2 w-8 rounded-full bg-primary/80" />
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-6 text-slate-600">
        {description}
      </p>
    </article>
  );
}
