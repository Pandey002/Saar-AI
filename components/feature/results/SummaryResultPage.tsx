"use client";

import { useState } from "react";
import { Download, Sparkles } from "lucide-react";
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
import { extractSources } from "@/lib/utils/citations";
import type { ConceptDependencyGraphResult, SummaryResult, TopicImageData, CitedPoint } from "@/types";

interface SummaryResultPageProps {
  data: SummaryResult;
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
}

export function SummaryResultPage({
  data,
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
}: SummaryResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const realLifeExamples = showRealLifeExamples ? extractRealLifeExamples(data.sections) : [];
  const contentSections = filterOutRealLifeExamples(data.sections);
  const displayTopic = sourceTopic || data.title;
  const sources = extractSources(data);

  const getPointText = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);

  const quickRevision = [
    `Start with the main idea of ${data.title}.`,
    `Revise these keywords: ${data.coreConcepts.slice(0, 4).map(getPointText).join(", ")}.`,
    `Use one short example if the answer needs explanation.`,
    "Keep your answer direct: definition, key point, example, conclusion.",
  ];
  const listenText = [
    data.title,
    data.introduction,
    ...data.concepts.map((concept) => `${concept.title}. ${concept.explanation.map(getPointText).join(" ")}`),
    ...contentSections.map((section) => `${section.heading}. ${section.paragraph} ${section.points.map(getPointText).join(". ")}`),
    ...realLifeExamples.map((example) => `${example.title || "Example"}. ${example.body}`),
    "What to remember before a test.",
    ...data.coreConcepts.map(getPointText),
    ...quickRevision,
  ].join(" ");

  function downloadPdf() {
    setIsPreparingPdf(true);
    try {
      const win = window.open("", "_blank", "width=1200,height=900");
      if (!win) {
        window.alert("Please allow pop-ups so Saar AI can open the PDF preview.");
        return;
      }
      win.document.write(buildSummaryPdf(data, displayTopic, topicImage, contentSections, realLifeExamples, quickRevision));
      win.document.close();
    } finally {
      setIsPreparingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      <article className="study-prose overflow-hidden rounded-[36px] border border-line bg-surface shadow-sm">
        <section className="border-b border-line bg-surface px-6 py-8 sm:px-10 sm:py-10">
          <div className="summary-header sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md sm:px-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/10 text-[10px] font-bold text-emerald-700">
                1
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Summary</span>
            </div>
            <h1 className="mt-1 font-serif text-[28px] font-bold tracking-tight text-ink sm:text-[34px]">
              {data.title}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
              {onAskDoubt && (
                <Button onClick={onAskDoubt} disabled={isSavingFlashcards} className="rounded-2xl bg-primary px-5 py-2.5 text-white shadow-sm transition hover:bg-emerald-700">
                  <Sparkles className="mr-2 h-4 w-4 text-white/80" />
                  Ask Adhyapak
                </Button>
              )}
              <Button onClick={onSaveAsFlashcards} disabled={isSavingFlashcards} className="rounded-2xl bg-primary px-5 py-2.5 text-white shadow-sm transition hover:bg-emerald-700">
                {isSavingFlashcards ? "Saving..." : "+ Flashcards"}
              </Button>
              <ListenButton text={listenText} />
              <Button onClick={downloadPdf} disabled={isPreparingPdf} className="rounded-2xl px-5 py-2.5 shadow-[0_8px_20px_rgba(6,182,212,0.15)] transition hover:shadow-[0_12px_25px_rgba(16,42,67,0.2)]">
                <Download className="mr-2 h-4 w-4" />
                {isPreparingPdf ? "PDF" : "Download"}
              </Button>
          </div>
          </div>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">
            {data.introduction}
          </p>
          
          {flashcardMessage ? (
            <p className="mb-6 text-sm font-medium text-emerald-700">{flashcardMessage}</p>
          ) : null}

          <div className="mt-8 rounded-[24px] border border-line bg-[#F6F3E6] p-6 shadow-sm sm:p-8">
            <h3 className="mb-5 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Key Takeaways</h3>
            <ul className="space-y-4">
              {data.coreConcepts.map((item, idx) => (
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

        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">



          <section className="space-y-4">
            <h2 className="font-serif text-[38px] tracking-[-0.04em] text-ink">Important terms to remember</h2>
            <div className="rounded-[28px] border border-line bg-[#F6F3E6] p-6 shadow-sm">
              <div className="space-y-5">
              {data.concepts.map((concept, cIdx) => (
                <div key={`${concept.title}-${cIdx}`} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                    <MathText text={concept.title} />
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {concept.explanation.map((item, idx) => (
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
          </section>

          {contentSections.map((section, sIdx) => (
            <section key={section.heading} className="space-y-4 border-t border-slate-100 pt-8">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">
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

              <div className="space-y-6">
                {section.paragraph && (
                  <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-6">
                    <ul className="space-y-3">
                      {toStandaloneBulletPoints(section.paragraph, 4).map((item, idx) => (
                        <PointBullet key={`para-${idx}`} text={item} />
                      ))}
                    </ul>
                  </div>
                )}
                
                {section.points.length > 0 && (
                  <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-6">
                    <ul className="space-y-3">
                      {section.points.map((item, idx) => (
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

                {section.subsections.map((sub, subIdx) => (
                  <div key={sub.heading} className="rounded-[24px] border border-line bg-[#F6F3E6] p-6">
                    <h4 className="text-[20px] font-bold text-slate-900">{sub.heading}</h4>
                    <ul className="mt-4 space-y-3">
                      {sub.points.map((pt, ptIdx) => (
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
            <section className="space-y-4 border-t border-line pt-8">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-ink">Examples that make the topic easier</h2>
              <div className="space-y-5">
                {realLifeExamples.map((example, index) => (
                  <div key={`${example.title}-${index}`} className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                    <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                      <MathText text={example.title || `Example ${index + 1}`} />
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {toStandaloneBulletPoints(example.body, 3).map((item, idx) => (
                        <PointBullet key={`${example.title}-${idx}`} text={item} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[30px] border border-line bg-[#F6F3E6] p-6">
            <h2 className="mt-4 font-serif text-[38px] tracking-[-0.04em] text-ink">What to remember before a test</h2>
            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] bg-[#F6F3E6] p-5">
                <p className="text-[15px] font-semibold text-slate-900">Key Takeaways</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {data.coreConcepts.map((item, idx) => {
                    const txt = getPointText(item);
                    return (
                      <span key={`key-${idx}`} className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2 text-[15px] font-medium text-slate-700">
                        {txt}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-[24px] bg-[#F6F3E6] p-5">
                <p className="text-[15px] font-semibold text-slate-900">Revision Plan</p>
                <ul className="mt-4 space-y-3">
                  {quickRevision.map((item, idx) => (
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

      {data.examQuestions && data.examQuestions.length > 0 && (
        <ExamQuestionsSection
          questions={data.examQuestions}
          sources={sources}
          onAddToAssignment={(q) => onAddQuestionToAssignment?.(q)}
          onSolve={(q) => onSolveQuestion?.(q)}
        />
      )}

      <SourcesSection sources={sources} />
      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}

function buildSummaryPdf(data: SummaryResult, topic: string, image: TopicImageData | null, sections: SummaryResult["sections"], examples: { title?: string; body: string }[], quickRevision: string[]) {
  const getPT = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;
  const card = (title: string, body: string, tag = "") => `<div class="card">${tag ? `<p class="eyebrow">${e(tag)}</p>` : ""}${title ? `<h3>${e(title)}</h3>` : ""}${body.trim().startsWith("<") ? body : `<p>${body}</p>`}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#142033;font-family:"Libre Baskerville",Georgia,"Times New Roman",serif}.page{max-width:900px;margin:0 auto;background:#fff;padding:36px}.eyebrow{font:700 10px/1.2 "Libre Baskerville",serif;letter-spacing:.16em;text-transform:uppercase;color:#2d5bd1;margin:0 0 12px}h1,h2,h3{margin:0;color:#0f172a;font-family:"Libre Baskerville",serif}h1{font-size:36px;line-height:1;margin-top:0}h2{font-size:24px;line-height:1.2;margin:0 0 14px}h3{font-size:18px;line-height:1.3;margin:0 0 10px}p,li{font:15px/1.9 "Libre Baskerville",serif;color:#334155}.quote,.card{border:1px solid #e2e8f0;border-radius:18px;background:#f8fbff;padding:18px 20px}.quote{margin-top:18px}.hero{margin-top:22px;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden}.hero img{display:block;width:100%;max-height:320px;object-fit:cover}.hero .cap{padding:14px 18px 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.section{margin-top:28px;page-break-inside:avoid}.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.tag{border:1px solid #dbe3f1;border-radius:999px;padding:10px 14px;background:#fff;font:600 13px/1.3 "Libre Baskerville",serif;color:#334155}ul{margin:10px 0 0;padding-left:20px}.foot{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;color:#cbd5e1;font:600 12px/1.6 "Libre Baskerville",serif;text-align:center;letter-spacing:0.05em}@media print{body{background:#fff}.page{max-width:none;padding:0}}</style></head><body><div class="page"><h1>${e(data.title)}</h1><div class="quote">${bullets(toStandaloneBulletPoints(data.introduction,3))}</div>${image?.imageUrl ? `<div class="hero"><img src="${a(image.imageUrl)}" alt="${a(image.title || data.title)}"><div class="cap"><h2>Visual Understanding</h2><p>${e(image.description || "This image gives a quick mental picture of the topic.")}</p></div></div>` : ""}<section class="section"><h2>Important terms to remember</h2><div class="grid">${data.concepts.map((item) => card(item.title, bullets(item.explanation.slice(0,3).map(getPT)))).join("")}</div></section><section class="section"><h2>Short notes for quick revision</h2><div class="grid">${sections.map((section) => card(section.heading, `${section.paragraph ? bullets(toStandaloneBulletPoints(section.paragraph,4)) : ""}${section.points.length ? bullets(section.points.slice(0,4).map(getPT)) : ""}`)).join("")}</div></section>${examples.length ? `<section class="section"><h2>Examples that make the topic easier</h2><div class="grid">${examples.map((item, index) => card(item.title || "Simple example", bullets(toStandaloneBulletPoints(item.body,3)), `Example ${index + 1}`)).join("")}</div></section>` : ""}<section class="section"><h2>What to remember before a test</h2><div class="tags">${data.coreConcepts.map((item) => `<span class="tag">${e(getPT(item))}</span>`).join("")}</div>${bullets(quickRevision)}</section><p class="foot">Generated by Saar AI</p></div><script>setTimeout(function(){window.print();}, 800);</script></body></html>`;
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
