import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { MathText } from "@/components/feature/results/MathText";
import { Button } from "@/components/ui/Button";
import type { FormulaBlockData } from "@/types";

interface FormulaBlockProps {
  data: FormulaBlockData;
}

export function FormulaBlock({ data }: FormulaBlockProps) {
  const [copied, setCopied] = useState(false);
  const formulaText = useMemo(() => data.latex?.trim() || data.expression?.trim() || "", [data.expression, data.latex]);

  async function handleCopy() {
    if (!formulaText || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formulaText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-[28px] bg-slate-900 px-6 py-8 text-white shadow-[0_22px_60px_rgba(15,23,42,0.24)] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
          Mathematical Model
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleCopy()}
          disabled={!formulaText}
          className="gap-2 rounded-full border-white/15 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Formula"}
        </Button>
      </div>
      <div className="mt-5 overflow-x-auto rounded-[24px] border border-white/10 bg-white px-4 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:px-6">
        <MathText
          text={formulaText || "Key relation coming soon"}
          displayMode="block"
          className="block min-w-max text-[30px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[40px]"
        />
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
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                <MathText text={item.label} />
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{item.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
