import { BookOpen } from "lucide-react";

interface TitleHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function TitleHeader({ eyebrow, title, subtitle }: TitleHeaderProps) {
  return (
    <header className="title-header space-y-4">
      <div className="title-header-eyebrow flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
        <BookOpen className="h-3.5 w-3.5" />
        <span>{eyebrow}</span>
      </div>
      <h1 className="max-w-4xl text-[36px] font-bold leading-[1.02] tracking-[-0.06em] text-slate-900 sm:text-[52px]">
        {title}
      </h1>
      <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
        {subtitle}
      </p>
    </header>
  );
}
