interface InfoCardProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function InfoCard({ title, description, eyebrow }: InfoCardProps) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-6 text-slate-600">
        {description}
      </p>
    </article>
  );
}
