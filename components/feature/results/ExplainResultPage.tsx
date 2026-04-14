"use client";

import { useMemo, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { FormulaBlock } from "@/components/feature/results/FormulaBlock";
import { LearningPathPanel } from "@/components/feature/results/LearningPathPanel";
import { ListenButton } from "@/components/feature/results/ListenButton";
import { MathText } from "@/components/feature/results/MathText";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import { toStandaloneBulletPoints } from "@/lib/utils";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";
import { ExamQuestionsSection } from "@/components/feature/results/ExamQuestionsSection";
import { CitationLink, GeneralKnowledgeTag, SourcesSection, PointBullet, splitLead } from "@/components/feature/results/CitationUI";
import { extractSources } from "@/lib/utils/citations";
import type { ConceptDependencyGraphResult, ExplanationResult, StudySection, TopicImageData, CitedPoint, LanguageMode } from "@/types";

interface ExplainResultPageProps {
  data: ExplanationResult;
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
  language: LanguageMode;
}

export function ExplainResultPage({
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
  language,
}: ExplainResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const displayTopic = sourceTopic || data.title;
  const sources = useMemo(() => extractSources(data), [data]);
  const examples = useMemo(
    () => (showRealLifeExamples ? extractRealLifeExamples(data.sections) : []),
    [data.sections, showRealLifeExamples]
  );
  
  const getPointText = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);

  const sections = useMemo(() => filterOutRealLifeExamples(data.sections), [data.sections]);
  const readingTime = Math.max(8, Math.round(wordCount(`${data.introduction} ${sections.map(sectionText).join(" ")}`) / 180));
  const examPrep = useMemo(() => buildExamPrep(data, sections), [data, sections]);
  const listenText = useMemo(
    () =>
      [
        data.title,
        data.introduction,
        data.analogyCard ? `${data.analogyCard.title}. ${data.analogyCard.explanation.map(getPointText).join(" ")} ${getPointText(data.analogyCard.note || "")}` : "",
        ...data.coreConcepts.map(getPointText),
        ...data.frameworkCards.map((card) => `${card.title}. ${card.description}`),
        ...sections.map(
          (section) =>
            `${section.heading}. ${section.paragraph} ${section.points.map(getPointText).join(". ")} ${section.subsections
              .map((sub) => `${sub.heading}. ${sub.points.map(getPointText).join(". ")}`)
              .join(" ")}`
        ),
        ...examples.map((example) => `${example.title || "Example"}. ${example.body}`),
        "Key takeaways.",
        ...data.keyTakeaways.map(getPointText),
        "Exam preparation.",
        ...examPrep.mustLearn.map(getPointText),
        ...examPrep.likelyQuestions.map(getPointText),
        ...examPrep.quickRevision.map(getPointText),
        conclusion(data, sections),
      ].join(" "),
    [data, examPrep.likelyQuestions, examPrep.mustLearn, examPrep.quickRevision, examples, sections]
  );

  function downloadPdf() {
    setIsPreparingPdf(true);
    try {
      const win = window.open("", "_blank", "width=1200,height=900");
      if (!win) {
        window.alert("Please allow pop-ups so Saar AI can open the PDF preview.");
        return;
      }
      win.document.write(buildPdf(data, displayTopic, topicImage, sections, examples, readingTime));
      win.document.close();
    } finally {
      setIsPreparingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <article className="study-prose overflow-hidden rounded-[36px] border border-line bg-surface shadow-sm">
          <section id="abstract" className="border-b border-line bg-surface px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="font-serif text-[42px] leading-[1.1] tracking-[-0.04em] text-ink sm:text-[56px] lg:text-[62px]">
                {data.title}
              </h1>
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
                <Button onClick={downloadPdf} disabled={isPreparingPdf} className="rounded-2xl px-5 py-2.5 bg-primary text-white shadow-[0_8px_20px_rgba(6,182,212,0.15)] hover:shadow-[0_12px_25px_rgba(16,42,67,0.2)]">
                  <Download className="mr-2 h-4 w-4" />
                  {isPreparingPdf ? "PDF" : "Download"}
                </Button>
              </div>
            </div>
            <div className="mt-6 rounded-[24px] border border-line bg-[#F6F3E6] px-5 py-5 shadow-inner">
              <ul className="space-y-3">
                {data.coreConcepts.map((item, idx) => {
                  const itemText = typeof item === "string" ? item : item.text;
                  return (
                    <PointBullet key={`core-${idx}`} text={itemText} referenceId={`core-ref-${idx}`} sources={sources} renderLeadText />
                  );
                })}
              </ul>
            </div>
          </section>

          <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">


            <section className="space-y-4">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-ink">What this topic means in simple words</h2>
              <div className="rounded-[24px] border border-line/60 bg-[#F6F3E6] p-6 shadow-sm">
                <ul className="mt-5 space-y-3">
                  {toStandaloneBulletPoints(data.introduction, 5).map((item, idx) => <PointBullet key={`simple-${idx}`} text={item} />)}
                </ul>
              </div>
            </section>

            {data.analogyCard ? (
              <section className="space-y-4">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-navy">
                  <MathText text={data.analogyCard.title} />
                </h2>
                <div className="rounded-[24px] border border-line/60 bg-[#F6F3E6] p-6">
                  <ul className="space-y-3">
                    {data.analogyCard.explanation.map((item, idx) => (
                      <PointBullet key={`analogy-${idx}`} text={item} referenceId={`analogy-pt-${idx}`} sources={sources} />
                    ))}
                    {data.analogyCard.note ? <PointBullet text={data.analogyCard.note} /> : null}
                  </ul>
                </div>
              </section>
            ) : null}

            {data.formulaBlock?.expression || data.formulaBlock?.latex ? (
              <FormulaBlock data={data.formulaBlock} />
            ) : null}

            <section className="space-y-4">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-ink">Core ideas to focus on first</h2>
              <div className="rounded-[28px] border border-line bg-[#F6F3E6] p-6">
                <ul className="space-y-3">
                  {data.coreConcepts.map((concept, idx) => <PointBullet key={`core-idea-${idx}`} text={concept} className="rounded-2xl bg-surface px-4 py-3 shadow-sm" />)}
                </ul>
              </div>
            </section>

            {data.frameworkCards.length > 0 ? (
              <section id="framework" className="space-y-4">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">A clear framework for understanding the topic</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {data.frameworkCards.map((card) => (
                    <div key={`${card.title}-${card.description}`} className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                      <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                        <MathText text={card.title} />
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {toStandaloneBulletPoints(card.description, 3).map((item, idx) => <PointBullet key={`${card.title}-${idx}`} text={item} />)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {sections.map((section, sIdx) => (
              <section key={`${section.heading}-${sIdx}`} id={sectionId(section.heading, sIdx)} className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">
                  <MathText text={section.heading} />
                </h2>
                {(sections.length <= 3 
                    ? true // Show for all if 3 or less
                    : (sIdx === 0 || sIdx === Math.floor(sections.length / 2) || sIdx === sections.length - 1)
                  ) && (
                  <TopicImagePanel
                    query={`${displayTopic} ${section.heading}`}
                    title={section.heading}
                    scrapbook
                  />
                )}
                <div className="rounded-[28px] border border-line bg-[#F6F3E6] p-6 shadow-sm">
                  {section.paragraph && (
                    <div className="mb-6 rounded-2xl border border-line bg-[#F6F3E6] p-5">
                      <ul className="space-y-3">
                        {toStandaloneBulletPoints(section.paragraph, 4).map((item, idx) => (
                          <PointBullet key={`para-${idx}`} text={item} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.points.length > 0 && (
                    <ul className="space-y-3">
                      {section.points.map((item, idx) => (
                        <PointBullet key={`pt-${idx}`} text={item} referenceId={`sec-${sIdx}-pt-${idx}`} sources={sources} />
                      ))}
                    </ul>
                  )}
                  {section.subsections.map((sub, subIdx) => (
                    <div key={sub.heading} className="mt-8 border-t border-slate-50 pt-6">
                      <h4 className="text-[20px] font-bold text-slate-900">{sub.heading}</h4>
                      <div className="mt-4 space-y-3">
                        {sub.points.map((pt, ptIdx) => (
                          <PointBullet key={`sub-${subIdx}-pt-${ptIdx}`} text={pt} referenceId={`sec-${sIdx}-sub-${subIdx}-pt-${ptIdx}`} sources={sources} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {examples.length > 0 ? (
              <section id="examples" className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">How this concept appears in real life</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {examples.map((example, index) => (
                    <div key={`${example.title}-${index}`} className="rounded-[24px] border border-line bg-[#F6F3E6] p-5 shadow-sm">
                      <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                        <MathText text={example.title || `Example ${index + 1}`} />
                      </h3>
                      <ul className="mt-3 space-y-2">{toStandaloneBulletPoints(example.body, 3).map((item, idx) => <PointBullet key={`${example.title}-${idx}`} text={item} />)}</ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Key Takeaways</h2>
              <div className="flex flex-wrap gap-3">
                {data.keyTakeaways.map((item, idx) => {
                  const rawText = getPointText(item);
                  const cite = sources.find(s => typeof item !== 'string' && s.excerpt === item.citation);
                  const isGK = typeof item !== 'string' && item.citation === "general knowledge";
                  return (
                    <span key={`takeaway-${idx}`} id={`takeaway-ref-${idx}`} className={`rounded-xl border border-line bg-[#F6F3E6] px-4 py-3 text-[14px] font-medium text-slate-700 shadow-sm ${isGK ? "opacity-60" : ""}`}>
                      <MathText text={rawText} />
                      {cite && <CitationLink id={cite.id} referenceId={`takeaway-ref-${idx}`} />}
                      {isGK && <GeneralKnowledgeTag />}
                    </span>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[30px] border border-line bg-[#F6F3E6] p-6">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Be ready for class tests and mid-sem questions</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Must Learn</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.mustLearn.map((item, idx) => <PointBullet key={`must-${idx}`} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Likely Questions</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.likelyQuestions.map((item, idx) => <PointBullet key={`likely-${idx}`} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Quick Revision</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.quickRevision.map((item, idx) => <PointBullet key={`rev-${idx}`} text={item} />)}
                  </ul>
                </div>
              </div>
            </section>

            <section id="conclusion" className="rounded-[30px] border border-slate-200 bg-[#f8fbff] p-6">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">What you should walk away with</h2>
              <ul className="mt-4 space-y-3">
                {toStandaloneBulletPoints(conclusion(data, sections), 3).map((item, idx) => <PointBullet key={`conc-${idx}`} text={item} />)}
              </ul>
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

        <div className="space-y-6 px-6 sm:px-10">
          <h2 className="font-serif text-[34px] tracking-[-0.04em] text-slate-950">Continue your study path</h2>
          <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
        </div>
      </div>
    </div>
  );
}

function sectionId(heading: string, index: number) {
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `chapter-${index + 1}`;
}

function sectionText(section: StudySection) {
  const getTXT = (pt: string | CitedPoint) => typeof pt === 'string' ? pt : pt.text;
  return `${section.heading} ${section.paragraph} ${section.points.map(getTXT).join(" ")} ${section.subsections.map((sub) => `${sub.heading} ${sub.points.map(getTXT).join(" ")}`).join(" ")}`;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function conclusion(data: ExplanationResult, sections: StudySection[]) {
  const getTXT = (pt: string | CitedPoint) => typeof pt === 'string' ? pt : pt.text;
  return `In summary, ${data.title.toLowerCase()} becomes much easier when you connect the main idea to ${sections[0]?.heading.toLowerCase() || "its core principles"} and keep these anchors in mind: ${data.keyTakeaways.slice(0, 3).map(getTXT).join(", ")}. If you can explain those ideas in simple language and connect them to a real example, you have understood the topic well.`;
}

function buildExamPrep(data: ExplanationResult, sections: StudySection[]) {
  const mustLearn = [
    ...data.keyTakeaways.slice(0, 3),
    ...sections.flatMap((section) => section.points.slice(0, 1)).slice(0, 3),
  ].slice(0, 5);

  const likelyQuestions = [
    `Define ${data.title} in simple words and explain its main idea.`,
    ...sections.slice(0, 2).map((section) => `Explain ${section.heading.toLowerCase()} with an example.`),
    `Write a short note on ${getPointText(data.keyTakeaways[0] || data.title)}.`,
  ].slice(0, 4);

  function getPointText(item: string | CitedPoint) {
    return typeof item === 'string' ? item : item.text;
  }

  const quickRevision = [
    `Start with the definition, then connect it to ${sections[0]?.heading.toLowerCase() || "the first core concept"}.`,
    `Use one real-life example to show that you understand the topic clearly.`,
    `Revise the keywords: ${data.coreConcepts.slice(0, 4).map(getPointText).join(", ")}.`,
    `If asked a long answer, move from concept -> explanation -> example -> conclusion.`,
  ];

  return { mustLearn, likelyQuestions, quickRevision };
}

function buildPdf(data: ExplanationResult, topic: string, image: TopicImageData | null, sections: StudySection[], examples: { title?: string; body: string }[], readingTime: number) {
  const examPrep = buildExamPrep(data, sections);
  const getPT = (p: string | CitedPoint) => (typeof p === "string" ? p : p.text);

  const card = (title: string, body: string) => `<div class="card">${title ? `<h3>${e(title)}</h3>` : ""}${body.trim().startsWith("<") ? body : `<p>${body}</p>`}</div>`;
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#142033;font-family:"Libre Baskerville",Georgia,"Times New Roman",serif}.page{max-width:900px;margin:0 auto;background:#fff;padding:36px}h1,h2,h3{margin:0;color:#0f172a;font-family:"Libre Baskerville",serif}h1{font-size:36px;line-height:1;margin-top:0}h2{font-size:24px;line-height:1.2;margin:0 0 14px}h3{font-size:18px;line-height:1.3;margin:0 0 10px}p,li{font:15px/1.9 "Libre Baskerville",serif;color:#334155}.quote,.panel,.card{border:1px solid #e2e8f0;border-radius:18px;background:#f8fbff;padding:18px 20px}.quote{margin-top:18px}.hero{margin-top:22px;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden}.hero img{display:block;width:100%;max-height:340px;object-fit:cover}.hero .cap{padding:14px 18px 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.section{margin-top:28px;page-break-inside:avoid}.sub{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.takeaways{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.takeaway{border:1px solid #dbe3f1;border-radius:999px;padding:10px 14px;background:#fff;font:600 13px/1.3 "Libre Baskerville",serif;color:#334155}ul{margin:10px 0 0;padding-left:20px}.foot{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b;font:12px/1.6 "Libre Baskerville",serif}@media print{body{background:#fff}.page{max-width:none;padding:0}}</style></head><body><div class="page"><h1>${e(data.title)}</h1><div class="quote">${bullets(toStandaloneBulletPoints(data.introduction, 4))}</div>${image?.imageUrl ? `<div class="hero"><img src="${a(image.imageUrl)}" alt="${a(image.title || data.title)}"><div class="cap"><h2>Visual Understanding</h2><p>${e(image.description || "This visual supports the explanation and helps the learner build a mental picture of the topic.")}</p></div></div>` : ""}${data.analogyCard ? `<section class="section"><h2>${e(data.analogyCard.title)}</h2><div class="panel">${bullets(toStandaloneBulletPoints(`${e(getPT(data.analogyCard.explanation[0] || ""))} ${data.analogyCard.note ? e(getPT(data.analogyCard.note)) : ""}`, 4))}</div></section>` : ""}<section class="section"><h2>Core ideas to focus on first</h2><div class="grid">${data.coreConcepts.map((item) => card("", bullets([getPT(item)]))).join("")}</div></section>${data.frameworkCards.length ? `<section class="section"><h2>A clear framework for understanding the topic</h2><div class="grid">${data.frameworkCards.map((item) => card(item.title, bullets(toStandaloneBulletPoints(item.description, 3)))).join("")}</div></section>` : ""}${sections.map((section) => `<section class="section"><h2>${e(section.heading)}</h2>${section.paragraph ? bullets(toStandaloneBulletPoints(section.paragraph, 4)) : ""}${section.points.length ? `<div class="panel">${bullets(section.points.map(getPT))}</div>` : ""}${section.subsections.length ? `<div class="sub">${section.subsections.map((sub) => card(sub.heading, bullets(sub.points.map(getPT)))).join("")}</div>` : ""}</section>`).join("")}${examples.length ? `<section class="section"><h2>How this concept appears in real life</h2><div class="sub">${examples.map((item, index) => card(item.title || `Example ${index + 1}`, bullets(toStandaloneBulletPoints(item.body, 3)))).join("")}</div></section>` : ""}<section class="section"><h2>Key Takeaways</h2><div class="takeaways">${data.keyTakeaways.map((item) => `<span class="takeaway">${e(getPT(item))}</span>`).join("")}</div></section><section class="section"><h2>Be ready for class tests and mid-sem questions</h2><div class="sub">${card("Must Learn", bullets(examPrep.mustLearn.map(getPT)))}${card("Likely Questions", bullets(examPrep.likelyQuestions.map(getPT)))}${card("Quick Revision", bullets(examPrep.quickRevision.map(getPT)))}</div></section><section class="section"><h2>What you should walk away with</h2>${bullets(toStandaloneBulletPoints(conclusion(data, sections), 3))}</section><p class="foot">Generated by Saar AI. When the print dialog opens, choose "Save as PDF" to download this report.</p></div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
}

function line(text: string) {
  const [lead, rest] = splitLead(text);
  return rest ? `<strong>${e(lead)}:</strong> ${e(rest)}` : `<strong>${e(lead)}</strong>`;
}

function e(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function a(text: string) {
  return e(text);
}
