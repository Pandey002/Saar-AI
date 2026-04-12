import React from "react";
import { Info } from "lucide-react";
import { MathText } from "@/components/feature/results/MathText";
import { CitedPoint } from "@/types";

interface CitationLinkProps {
  id: number;
  referenceId: string;
}

export function CitationLink({ id, referenceId }: CitationLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(`source-item-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => element.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 2000);
    }
  };

  return (
    <a
      href={`#source-item-${id}`}
      id={referenceId}
      onClick={handleClick}
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-blue-50 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
    >
      [{id}]
    </a>
  );
}

export function GeneralKnowledgeTag() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      <Info className="h-2.5 w-2.5" />
      General knowledge
    </span>
  );
}

interface SourceItem {
  id: number;
  excerpt: string;
  refId: string; // The first occurrence ID to scroll back to
}

interface SourcesSectionProps {
  sources: SourceItem[];
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  if (sources.length === 0) {
    return null;
  }

  const handleSourceClick = (id: number, refId: string) => {
    const element = document.getElementById(refId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-4", "ring-primary/20", "ring-offset-4", "rounded-lg");
      setTimeout(() => element.classList.remove("ring-4", "ring-primary/20", "ring-offset-4", "rounded-lg"), 2000);
    }
  };

  return (
    <section id="sources-section" className="mt-12 border-t border-slate-100 pt-10 dark:border-slate-800">
      <h2 className="font-serif text-[32px] tracking-[-0.04em] text-slate-950 dark:text-slate-50">Sources</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Extracts from your notes used to ground the points above.
      </p>
      
      <div className="mt-6 space-y-4">
        {sources.map((source) => (
          <div
            key={source.id}
            id={`source-item-${source.id}`}
            onClick={() => handleSourceClick(source.id, source.refId)}
            className="group cursor-pointer rounded-[20px] border border-slate-100 bg-white p-5 transition hover:border-primary/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex gap-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[11px] font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary dark:bg-slate-800 dark:text-slate-500">
                {source.id}
              </span>
              <p className="text-[15px] italic leading-relaxed text-slate-600 dark:text-slate-400">
                &ldquo;{source.excerpt}&rdquo;
              </p>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 group-hover:text-primary/50 transition opacity-0 group-hover:opacity-100">
                Back to reference
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface PointBulletProps {
  text: string | CitedPoint;
  referenceId?: string;
  sources?: SourceItem[];
  className?: string;
  renderLeadText?: boolean;
  variant?: "bullet" | "inline";
  prefix?: string;
}

export function PointBullet({
  text,
  referenceId,
  sources,
  className = "",
  renderLeadText = false,
  variant = "bullet",
  prefix,
}: PointBulletProps) {
  const rawText = typeof text === "string" ? text : text.text;
  const citation = typeof text !== "string" ? text.citation : null;
  
  const [lead, rest] = splitLead(rawText);
  
  const getCiteInfo = () => {
    if (!citation) return null;
    if (citation === "general knowledge") return { type: "gk" as const };
    const source = sources?.find((s) => s.excerpt === citation);
    return source ? { type: "cite" as const, id: source.id } : null;
  };

  const citeInfo = getCiteInfo();
  const isGK = citeInfo?.type === "gk";

  if (variant === "inline") {
    return (
      <span className={`${isGK ? "opacity-60" : ""} ${className}`}>
        {prefix && <span className="font-bold text-slate-600">{prefix}</span>}
        <MathText text={rawText} textRenderer={renderHighlightedText} />
        {citeInfo?.type === "cite" && referenceId && (
          <CitationLink id={citeInfo.id} referenceId={referenceId} />
        )}
        {isGK && <GeneralKnowledgeTag />}
      </span>
    );
  }

  return (
    <li className={`flex gap-3 text-[18px] leading-relaxed text-slate-700 ${isGK ? "opacity-60" : ""} ${className}`}>
      <span className="mt-3.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      <span>
        {prefix && <span className="font-bold text-slate-600">{prefix}</span>}
        {renderLeadText && lead ? (
          <>
            <strong className="font-bold text-slate-950">
              <MathText text={lead} textRenderer={renderHighlightedText} />
            </strong>
            {rest ? (
              <>
                {": "}
                <MathText text={rest} textRenderer={renderHighlightedText} />
              </>
            ) : (
              ""
            )}
          </>
        ) : (
          <MathText text={rawText} textRenderer={renderHighlightedText} />
        )}
        {citeInfo?.type === "cite" && referenceId && (
          <CitationLink id={citeInfo.id} referenceId={referenceId} />
        )}
        {isGK && <GeneralKnowledgeTag />}
      </span>
    </li>
  );
}

function splitLead(text: string) {
  const at = text.indexOf(":");
  return at > 0 && at < 32 ? [text.slice(0, at).trim(), text.slice(at + 1).trim()] : [text.trim(), ""];
}

function renderHighlightedText(text: string) {
  const parts = text.split(/(\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|\d{4}|[A-Z][a-z]+(?:\s+\d{1,2},\s+\d{4})?)\b)/g);

  return parts.map((part, index) => {
    const trimmed = part.trim();
    const shouldHighlight =
      /^(?:\d{4}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/.test(trimmed) &&
      trimmed.length > 2 &&
      trimmed.toLowerCase() !== "the";

    return shouldHighlight ? (
      <strong key={`${part}-${index}`} className="font-semibold text-slate-950">
        {part}
      </strong>
    ) : (
      part
    );
  });
}
