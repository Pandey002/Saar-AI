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
      element.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-2xl");
      setTimeout(() => element.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-2xl"), 2000);
    }
  };

  return (
    <a
      href={`#source-item-${id}`}
      id={referenceId}
      onClick={handleClick}
      className="ml-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-800 transition-all hover:bg-emerald-200 hover:scale-110 active:scale-95 shadow-sm align-top mt-0.5"
      title={`Source ${id}`}
    >
      {id}
    </a>
  );
}

export function GeneralKnowledgeTag() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-line bg-canvas/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted shadow-sm">
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
    <section id="sources-section" className="mt-16 border-t border-line pt-12">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          ?
        </span>
        <h2 className="font-serif text-[28px] font-bold tracking-tight text-ink">Sources & Citations</h2>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        These extracts from your notes were used to ground and verify the points generated above.
      </p>
      
      <div className="mt-8 grid gap-4 sm:grid-cols-1">
        {sources.map((source) => (
          <div
            key={source.id}
            id={`source-item-${source.id}`}
            onClick={() => handleSourceClick(source.id, source.refId)}
            className="group cursor-pointer rounded-2xl border border-line bg-[#F6F3E6] p-5 transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.995]"
          >
            <div className="flex gap-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white shadow-sm transition-transform group-hover:scale-110">
                {source.id}
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium italic leading-relaxed text-ink/80">
                  &ldquo;{source.excerpt}&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                    Jump to reference
                  </span>
                  <span className="text-[11px] font-medium text-muted/60 italic">
                    Verified Source
                  </span>
                </div>
              </div>
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

export function splitLead(text: string) {
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
