import type { FormulaBlockData } from "@/types";

interface FormulaBlockProps {
  data: FormulaBlockData;
}

export function FormulaBlock({ data }: FormulaBlockProps) {
  return (
    <section className="rounded-[28px] bg-slate-900 px-6 py-8 text-white shadow-[0_22px_60px_rgba(15,23,42,0.24)] sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
        Mathematical Model
      </p>
      <div className="mt-5 text-center text-[30px] font-semibold tracking-[-0.04em] sm:text-[40px]">
        {data.expression || "Key relation coming soon"}
      </div>
      {data.caption ? (
        <p className="mt-4 text-center text-sm leading-6 text-slate-300">
          {data.caption}
        </p>
      ) : null}
      {data.variables.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.variables.map((item) => (
            <div key={`${item.label}-${item.description}`} className="rounded-2xl bg-white/6 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{item.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
