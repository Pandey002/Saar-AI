"use client";

import { useMemo, type ReactNode } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";
import {
  containsMathNotation,
  isLikelyStandaloneFormula,
  normalizeFormulaToLatex,
  tokenizeMath,
} from "@/lib/utils/math";

interface MathTextProps {
  text: string;
  className?: string;
  displayMode?: "auto" | "inline" | "block";
  textRenderer?: (text: string) => ReactNode;
}

const htmlCache = new Map<string, string>();

export function MathText({
  text,
  className,
  displayMode = "auto",
  textRenderer,
}: MathTextProps) {
  const content = useMemo(() => {
    if (!text) {
      return [];
    }

    if (displayMode !== "auto") {
      return [
        {
          type: "math" as const,
          value: text,
          display: displayMode === "block",
        },
      ];
    }

    if (isLikelyStandaloneFormula(text)) {
      return [
        {
          type: "math" as const,
          value: text,
          display: true,
        },
      ];
    }

    return tokenizeMath(text);
  }, [displayMode, text]);

  if (!text) {
    return null;
  }

  return (
    <span className={className}>
      {content.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <span key={`text-${index}`}>
              {textRenderer ? textRenderer(segment.value) : segment.value}
            </span>
          );
        }

        const rendered = renderFormula(segment.value, segment.display);
        if (!rendered) {
          return (
            <span key={`fallback-${index}`}>
              {textRenderer && !containsMathNotation(segment.value) ? textRenderer(segment.value) : segment.value}
            </span>
          );
        }

        return (
          <span
            key={`math-${index}`}
            className={cn(
              "align-middle text-slate-950",
              segment.display && "my-2 block overflow-x-auto overflow-y-hidden py-1"
            )}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        );
      })}
    </span>
  );
}

function renderFormula(input: string, displayMode: boolean) {
  const latex = normalizeFormulaToLatex(input);
  if (!latex) {
    return "";
  }

  const cacheKey = `${displayMode ? "block" : "inline"}:${latex}`;
  const cached = htmlCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore",
    });
    htmlCache.set(cacheKey, html);
    return html;
  } catch {
    return "";
  }
}
