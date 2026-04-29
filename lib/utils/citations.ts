import { CitedPoint, SummaryResult, ExplanationResult } from "@/types";

export interface SourceItem {
  id: number;
  excerpt: string;
  refId: string;
}

export function extractSources(data: SummaryResult | ExplanationResult): SourceItem[] {
  const sourcesMap = new Map<string, { id: number; refId: string }>();
  let nextId = 1;

  const processPoint = (pt: string | CitedPoint, contextId: string) => {
    if (typeof pt === "string" || !pt) return;
    if (!pt.citation || pt.citation === "general knowledge") return;

    if (!sourcesMap.has(pt.citation)) {
      sourcesMap.set(pt.citation, { id: nextId++, refId: contextId });
    }
  };

  // Process coreConcepts
  (data.coreConcepts || []).forEach((pt, idx) => processPoint(pt, `core-ref-${idx}`));

  // Process concepts (SummaryResult only)
  if ("concepts" in data && data.concepts) {
    data.concepts.forEach((concept, cIdx) => {
      (concept.explanation || []).forEach((pt, pIdx) => processPoint(pt, `concept-${cIdx}-pt-${pIdx}`));
    });
  }

  // Process sections
  (data.sections || []).forEach((section, sIdx) => {
    (section.points || []).forEach((pt, pIdx) => processPoint(pt, `sec-${sIdx}-pt-${pIdx}`));
    (section.subsections || []).forEach((sub, subIdx) => {
      (sub.points || []).forEach((pt, pIdx) => processPoint(pt, `sec-${sIdx}-sub-${subIdx}-pt-${pIdx}`));
    });
  });

  // Process keyTakeaways for ExplanationResult
  if ("keyTakeaways" in data && data.keyTakeaways) {
    data.keyTakeaways.forEach((pt, idx) => processPoint(pt, `takeaway-ref-${idx}`));
  }

  if ("analogyCard" in data && data.analogyCard) {
    data.analogyCard.explanation.forEach((pt, pIdx) => processPoint(pt, `analogy-pt-${pIdx}`));
  }

  // Process examQuestions
  if (data.examQuestions) {
    data.examQuestions.forEach((q, qIdx) => {
      processPoint(q.question, `exam-q-${qIdx}`);
      processPoint(q.answer, `exam-ans-${qIdx}`);
    });
  }

  return Array.from(sourcesMap.entries()).map(([excerpt, info]) => ({
    id: info.id,
    excerpt,
    refId: info.refId,
  }));
}

export function getCitationInfo(pt: string | CitedPoint, sources: SourceItem[]) {
  if (typeof pt === "string") return null;
  if (!pt.citation) return null;
  if (pt.citation === "general knowledge") return { type: "gk" as const };
  
  const source = sources.find(s => s.excerpt === pt.citation);
  return source ? { type: "cite" as const, id: source.id } : null;
}
