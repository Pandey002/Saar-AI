"use client";

import { useState } from "react";
import { Download, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LearningPathPanel } from "@/components/feature/results/LearningPathPanel";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { ListenButton } from "@/components/feature/results/ListenButton";
import { MathText } from "@/components/feature/results/MathText";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import { toStandaloneBulletPoints } from "@/lib/utils";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";
import { ExamQuestionsSection } from "@/components/feature/results/ExamQuestionsSection";
import { CitationLink, GeneralKnowledgeTag, SourcesSection, PointBullet } from "@/components/feature/results/CitationUI";
import { ConceptsSkeleton, ExamQuestionsSkeleton } from "@/components/feature/results/ResultSkeletons";
import { extractSources } from "@/lib/utils/citations";
import type { ConceptDependencyGraphResult, SummaryResult, TopicImageData, CitedPoint, UserTier, ExamQuestion } from "@/types";
import { canAccessTool } from "@/lib/tiers";

interface SummaryResultPageProps {
  data: SummaryResult;
  language: string;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
  onStudyGaps: (topic: string) => void;
  showRealLifeExamples: boolean;
  onSaveAsFlashcards: () => void;
  isSavingFlashcards: boolean;
  flashcardMessage: string;
  onRequestLearningGraph: (topic: string) => Promise<ConceptDependencyGraphResult>;
  onLoadLearningTopic: (topic: string) => void;
  onStartLearningPath: (steps: string[]) => void;
  onAddQuestionToAssignment?: (question: any) => void;
  onSolveQuestion?: (question: any) => void;
  onAskDoubt?: () => void;
  tier: UserTier;
  unlockedFeatures?: Set<string>;
  onRequestAdUnlock?: (id: string, name: string) => void;
}

export function SummaryResultPage({
  data,
  language,
  sourceTopic,
  onFollowUp,
  onStudyGaps,
  showRealLifeExamples,
  onSaveAsFlashcards,
  isSavingFlashcards,
  flashcardMessage,
  onRequestLearningGraph,
  onLoadLearningTopic,
  onStartLearningPath,
  onAddQuestionToAssignment,
  onSolveQuestion,
  onAskDoubt,
  tier,
  unlockedFeatures = new Set(),
  onRequestAdUnlock,
}: SummaryResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const realLifeExamples = showRealLifeExamples ? extractRealLifeExamples(data?.sections || []) : [];
  const contentSections = filterOutRealLifeExamples(data?.sections || []);
  const displayTopic = sourceTopic || data?.title || "Topic";
  const sources = extractSources(data);

  const getPointText = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);

  const quickRevision = [
    `Start with the main idea of ${data?.title || displayTopic}.`,
    `Revise these keywords: ${(data?.coreConcepts || []).slice(0, 4).map(getPointText).join(", ")}.`,
    `Use one short example if the answer needs explanation.`,
    "Keep your answer direct: definition, key point, example, conclusion.",
  ];
  const listenText = [
    data?.title || "",
    data?.introduction || "",
    ...(data?.concepts || []).map((concept) => `${concept.title}. ${concept.explanation.map(getPointText).join(" ")}`),
    ...contentSections.map((section) => `${section.heading}. ${section.paragraph} ${(section.points || []).map(getPointText).join(". ")}`),
    ...realLifeExamples.map((example) => `${example.title || "Example"}. ${example.body}`),
    "What to remember before a test.",
    ...(data?.coreConcepts || []).map(getPointText),
    ...quickRevision,
  ].join(" ");

  async function downloadPdf() {
    if (!canAccessTool(tier, "canDownloadPdf") && !unlockedFeatures.has("canDownloadPdf")) {
      onRequestAdUnlock?.("canDownloadPdf", "PDF Download");
      return;
    }
    setIsPreparingPdf(true);
    try {
      const win = window.open("", "_blank", "width=1200,height=900");
      if (!win) {
        window.alert("Please allow pop-ups so Vidya can open the PDF preview.");
        return;
      }
      // Convert image to base64 so it renders correctly in the PDF popup (CORS blocks external URLs)
      let resolvedImageUrl: string | null = null;
      if (topicImage?.imageUrl) {
        try {
          const res = await fetch(topicImage.imageUrl);
          const blob = await res.blob();
          resolvedImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          resolvedImageUrl = topicImage.imageUrl; // fallback to original URL
        }
      }
      win.document.write(buildSummaryPdf(data, displayTopic, resolvedImageUrl, topicImage, contentSections, realLifeExamples, quickRevision, data.examQuestions || []));
      win.document.close();
    } finally {
      setIsPreparingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      <article className="study-prose overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm">
        <section className="border-b border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
          <div className="summary-header sticky top-0 z-10 flex flex-col gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur-md sm:px-8 sm:flex-row sm:items-center sm:justify-between sm:py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/10 text-[10px] font-bold text-emerald-700">
                1
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Summary</span>
            </div>
            <h1 className="mt-1 font-serif text-[20px] font-bold tracking-tight text-ink sm:text-[30px] truncate">
              {data.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-3">
              {onAskDoubt && (
                <Button onClick={onAskDoubt} disabled={isSavingFlashcards} className="rounded-xl bg-primary px-4 py-2 text-[12px] text-white shadow-sm transition hover:bg-emerald-700 sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm">
                  <Sparkles className="mr-2 h-3.5 w-3.5 text-white/80 sm:h-4 sm:w-4" />
                  Ask Adhyapak
                </Button>
              )}
              <Button onClick={onSaveAsFlashcards} disabled={isSavingFlashcards} className="rounded-xl bg-primary px-4 py-2 text-[12px] text-white shadow-sm transition hover:bg-emerald-700 sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm">
                {isSavingFlashcards ? "Saving..." : "+ Flashcards"}
              </Button>
              <div className="flex items-center gap-2">
                <ListenButton text={listenText} language={language} />
                <Button 
                  onClick={downloadPdf} 
                  disabled={isPreparingPdf} 
                  className="group relative rounded-xl px-4 py-2 text-[12px] shadow-[0_8px_20px_rgba(6,182,212,0.15)] transition hover:shadow-[0_12px_25px_rgba(16,42,67,0.2)] sm:rounded-2xl sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 sm:h-4 sm:w-4" />
                    {!canAccessTool(tier, "canDownloadPdf") && <Lock className="h-3 w-3 text-slate-400" />}
                    <span className="hidden xs:inline">{isPreparingPdf ? "PDF" : "Download"}</span>
                  </div>
                </Button>
              </div>
          </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            {data.introduction}
          </p>
          
          {flashcardMessage ? (
            <p className="mb-5 text-[13px] font-medium text-emerald-700">{flashcardMessage}</p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-line bg-[#F6F3E6] p-5 shadow-sm md:p-6">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Key Takeaways</h3>
            <ul className="space-y-3">
              {(data?.coreConcepts || []).map((item, idx) => (
                <PointBullet 
                  key={`core-${idx}`} 
                  text={item} 
                  referenceId={`core-ref-${idx}`} 
                  sources={sources} 
                  renderLeadText
                />
              ))}
            </ul>
          </div>
        </section>

        <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">



          <section className="space-y-4">
            {data.concepts && data.concepts.length > 0 ? (
              <>
                <h2 className="font-serif text-[30px] tracking-[-0.04em] text-ink">Important terms to remember</h2>
                <div className="rounded-2xl border border-line bg-[#F6F3E6] p-5 shadow-sm">
                  <div className="space-y-4">
                  {data.concepts.map((concept: any, cIdx: number) => (
                    <div key={`${concept.title}-${cIdx}`} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                        <MathText text={concept.title} />
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {concept.explanation.map((item: any, idx: number) => (
                          <PointBullet 
                            key={`${concept.title}-${idx}`} 
                            text={item} 
                            referenceId={`concept-${cIdx}-pt-${idx}`} 
                            sources={sources} 
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                  </div>
                </div>
              </>
            ) : (
              <ConceptsSkeleton />
            )}
          </section>

          {contentSections.map((section: any, sIdx: number) => (
            <section key={section.heading} className="space-y-4 border-t border-slate-100 pt-7 md:pt-8">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">
                <MathText text={section.heading} />
              </h2>
              
              {((contentSections.length >= 2 && (sIdx === 0 || sIdx === Math.floor(contentSections.length / 2))) || 
                (contentSections.length === 1 && sIdx === 0)) && (
                <TopicImagePanel
                  query={`${displayTopic} ${section.heading}`}
                  title={section.heading}
                  scrapbook
                />
              )}

              <div className="space-y-5">
                {section.paragraph && (
                  <div className="rounded-2xl border border-line bg-[#F6F3E6] p-5">
                    <ul className="space-y-3">
                      {toStandaloneBulletPoints(section.paragraph, 4).map((item: string, idx: number) => (
                        <PointBullet key={`para-${idx}`} text={item} />
                      ))}
                    </ul>
                  </div>
                )}
                
                {(section.points || []).length > 0 && (
                  <div className="rounded-2xl border border-line bg-[#F6F3E6] p-5">
                    <ul className="space-y-3">
                      {(section.points || []).map((item: any, idx: number) => (
                        <PointBullet 
                          key={`pt-${idx}`} 
                          text={item} 
                          referenceId={`sec-${sIdx}-pt-${idx}`} 
                          sources={sources} 
                        />
                      ))}
                    </ul>
                  </div>
                )}

                {(section.subsections || []).map((sub: any, subIdx: number) => (
                  <div key={sub.heading} className="rounded-2xl border border-line bg-[#F6F3E6] p-5">
                    <h4 className="text-[18px] font-bold text-slate-900">{sub.heading}</h4>
                    <ul className="mt-3 space-y-2">
                      {(sub.points || []).map((pt: any, ptIdx: number) => (
                        <PointBullet 
                          key={`sub-${subIdx}-pt-${ptIdx}`} 
                          text={pt} 
                          referenceId={`sec-${sIdx}-sub-${subIdx}-pt-${ptIdx}`} 
                          sources={sources} 
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {realLifeExamples.length > 0 ? (
            <section className="space-y-4 border-t border-line pt-7 md:pt-8">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-ink">Examples that make the topic easier</h2>
              <div className="space-y-4">
                {realLifeExamples.map((example: any, index: number) => (
                  <div key={`${example.title}-${index}`} className="rounded-2xl border border-line bg-[#F6F3E6] p-4 md:p-5">
                    <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                      <MathText text={example.title || `Example ${index + 1}`} />
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {toStandaloneBulletPoints(example.body, 3).map((item: string, idx: number) => (
                        <PointBullet key={`${example.title}-${idx}`} text={item} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[24px] border border-line bg-[#F6F3E6] p-5 md:p-6">
            <h2 className="mt-3 font-serif text-[30px] tracking-[-0.04em] text-ink">What to remember before a test</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-[#F6F3E6] p-4 md:p-5">
                <p className="text-[14px] font-semibold text-slate-900">Key Takeaways</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(data?.coreConcepts || []).map((item: any, idx: number) => {
                    const txt = getPointText(item);
                    return (
                      <span key={`key-${idx}`} className="rounded-xl border border-slate-200 bg-[#f8fbff] px-3 py-1.5 text-[14px] font-medium text-slate-700">
                        {txt}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl bg-[#F6F3E6] p-4 md:p-5">
                <p className="text-[14px] font-semibold text-slate-900">Revision Plan</p>
                <ul className="mt-3 space-y-2">
                  {quickRevision.map((item: string, idx: number) => (
                    <PointBullet key={`rev-${idx}`} text={item} />
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>

      <LearningPathPanel
        key={displayTopic}
        topic={displayTopic}
        onRequestGraph={onRequestLearningGraph}
        onLoadTopic={onLoadLearningTopic}
        onStartStudyPath={onStartLearningPath}
      />

      {data.examQuestions && data.examQuestions.length > 0 ? (
        <ExamQuestionsSection
          questions={data.examQuestions}
          sources={sources}
          onAddToAssignment={(q) => onAddQuestionToAssignment?.(q)}
          onSolve={(q) => onSolveQuestion?.(q)}
        />
      ) : (
        <ExamQuestionsSkeleton />
      )}

      <SourcesSection sources={sources} />
      <FollowUpChips topics={data.relatedTopics || []} onSelect={onFollowUp} />
    </div>
  );
}

function buildSummaryPdf(data: SummaryResult, topic: string, resolvedImageUrl: string | null, image: TopicImageData | null, sections: SummaryResult["sections"], examples: { title?: string; body: string }[], quickRevision: string[], examQuestions: ExamQuestion[]) {
  const getPT = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;

  const sectionHtml = sections.map((section) => {
    let html = `<section class="section"><h2>${e(section.heading)}</h2>`;
    if (section.paragraph) {
      html += `<p>${e(section.paragraph)}</p>`;
    }
    if ((section.points || []).length > 0) {
      html += bullets((section.points || []).map(getPT));
    }
    for (const sub of (section.subsections || [])) {
      html += `<h3>${e(sub.heading)}</h3>`;
      if ((sub.points || []).length > 0) {
        html += bullets((sub.points || []).map(getPT));
      }
    }
    html += `</section>`;
    return html;
  }).join("");

  const examplesHtml = examples.length > 0
    ? `<section class="section"><h2>Real-Life Examples</h2>${examples.map((item, index) => `<h3>${e(item.title || `Example ${index + 1}`)}</h3><p>${e(item.body)}</p>`).join("")}</section>`
    : "";

  const questionsHtml = examQuestions.length > 0
    ? `<section class="section"><h2>Practice Questions</h2>${examQuestions.map((q, idx) => `
        <div class="question-item">
          <p><strong>Q${idx + 1}: ${e(typeof q.question === "string" ? q.question : q.question.text)}</strong></p>
          ${q.options && q.options.length > 0 ? `<ul class="options-list">${q.options.map(opt => `<li>${e(opt.label)}: ${e(opt.text)}</li>`).join("")}</ul>` : ""}
          <p class="answer"><strong>Correct Answer:</strong> ${e(typeof q.answer === "string" ? q.answer : q.answer.text)}</p>
        </div>`).join("")}</section>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; line-height: 1.8; font-size: 14px; background: #fff; }
.page { max-width: 780px; margin: 0 auto; padding: 0; }

.title-block { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; }
h1 { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: #1a1a2e; margin-bottom: 10px; }
.subtitle { font-size: 13px; color: #64748b; }

.abstract { margin-bottom: 24px; padding: 16px 20px; background: #f8f9fa; border-left: 3px solid #1a1a2e; }
.abstract p { font-size: 14px; color: #334155; }

.hero { margin: 20px 0; }
.hero img { display: block; width: 100%; max-height: 300px; object-fit: cover; border-radius: 4px; }
.hero .cap { font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic; }

.section { margin-top: 24px; page-break-inside: avoid; }
h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
h3 { font-size: 16px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
p { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 8px; }
ul { margin: 8px 0 12px 20px; }
li { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 4px; }
li strong { color: #1a1a2e; }

.takeaways { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 16px; }
.takeaway { font-size: 13px; font-weight: 500; padding: 6px 14px; background: #f1f5f9; border-radius: 4px; color: #334155; }
.question-item { margin-bottom: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; page-break-inside: avoid; }
.options-list { list-style: none; margin: 8px 0; padding-left: 0; }
.options-list li { margin-bottom: 4px; font-size: 13px; }
.answer { margin-top: 8px; color: #059669; font-size: 13px; }

.foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; letter-spacing: 0.03em; }

@media print { body { background: #fff; } .page { max-width: none; } }
</style></head><body><div class="page">

<div class="title-block">
  <h1>${e(data.title)}</h1>
  <p class="subtitle">Summary Notes · Generated by Vidya</p>
</div>

<div class="abstract">
  <p>${e(data.introduction)}</p>
</div>

${resolvedImageUrl ? `<div class="hero"><img src="${a(resolvedImageUrl)}" alt="${a(image?.title || data.title)}"><p class="cap">${e(image?.description || "Visual aid for the topic")}</p></div>` : ""}

<section class="section">
  <h2>Important Terms</h2>
  ${data.concepts.map((item) => `<h3>${e(item.title)}</h3>${bullets(item.explanation.slice(0, 3).map(getPT))}`).join("")}
</section>

${sectionHtml}

${examplesHtml}

${questionsHtml}

<section class="section">
  <h2>What to Remember Before a Test</h2>
  <h3>Key Takeaways</h3>
  <div class="takeaways">${(data.coreConcepts || []).map((item) => `<span class="takeaway">${e(getPT(item))}</span>`).join("")}</div>
  <h3>Revision Plan</h3>
  ${bullets(quickRevision)}
</section>

<p class="foot">Generated by Vidya · Vidya</p>
</div><script>setTimeout(function(){window.print();}, 800);</script></body></html>`;
}

function line(text: string) {
  const [lead, rest] = splitLead(text);
  return rest ? `<strong>${e(lead)}:</strong> ${e(rest)}` : `<strong>${e(lead)}</strong>`;
}

function splitLead(text: string) {
  const at = text.indexOf(":");
  return at > 0 && at < 32 ? [text.slice(0, at).trim(), text.slice(at + 1).trim()] : [text.trim(), ""];
}

function e(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function a(text: string) {
  return e(text);
}
