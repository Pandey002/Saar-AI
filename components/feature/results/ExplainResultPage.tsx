"use client";

import { useMemo, useState } from "react";
import { Download, Sparkles, Lock } from "lucide-react";
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
import { FrameworkCardsSkeleton, ExamQuestionsSkeleton } from "@/components/feature/results/ResultSkeletons";
import { CitationLink, GeneralKnowledgeTag, SourcesSection, PointBullet, splitLead } from "@/components/feature/results/CitationUI";
import { extractSources } from "@/lib/utils/citations";
import { canAccessTool } from "@/lib/tiers";
import type { ConceptDependencyGraphResult, ExplanationResult, StudySection, TopicImageData, CitedPoint, LanguageMode, UserTier, ExamQuestion } from "@/types";

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
  tier: UserTier;
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
  tier,
}: ExplainResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const displayTopic = sourceTopic || data.title;
  const sources = useMemo(() => extractSources(data), [data]);
  const examples = useMemo(
    () => (showRealLifeExamples ? extractRealLifeExamples(data?.sections || []) : []),
    [data?.sections, showRealLifeExamples]
  );
  
  const getPointText = (pt: string | CitedPoint) => (typeof pt === "string" ? pt : pt.text);

  const sections = useMemo(() => filterOutRealLifeExamples(data?.sections || []), [data?.sections]);
  const readingTime = Math.max(8, Math.round(wordCount(`${data?.introduction || ""} ${sections.map(sectionText).join(" ")}`) / 180));
  const examPrep = useMemo(() => buildExamPrep(data, sections), [data, sections]);
  const listenText = useMemo(
    () =>
      [
        data.title,
        data.introduction,
        data.analogyCard ? `${data.analogyCard.title}. ${(data.analogyCard.explanation || []).map(getPointText).join(" ")} ${getPointText(data.analogyCard.note || "")}` : "",
        ...(data.coreConcepts || []).map(getPointText),
        ...(data.frameworkCards || []).map((card) => `${card.title}. ${card.description}`),
        ...sections.map(
          (section) =>
            `${section.heading}. ${section.paragraph} ${(section.points || []).map(getPointText).join(". ")} ${(section.subsections || [])
              .map((sub) => `${sub.heading}. ${(sub.points || []).map(getPointText).join(". ")}`)
              .join(" ")}`
        ),
        ...examples.map((example) => `${example.title || "Example"}. ${example.body}`),
        "Key takeaways.",
        ...(data.keyTakeaways || []).map(getPointText),
        "Exam preparation.",
        ...(examPrep.mustLearn || []).map(getPointText),
        ...(examPrep.likelyQuestions || []).map(getPointText),
        ...(examPrep.quickRevision || []).map(getPointText),
        conclusion(data, sections),
      ].join(" "),
    [data, examPrep.likelyQuestions, examPrep.mustLearn, examPrep.quickRevision, examples, sections]
  );

  async function downloadPdf() {
    if (!canAccessTool(tier, "canDownloadPdf")) {
      window.alert("PDF Download is a premium feature. Please upgrade to Student plan or higher.");
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
      win.document.write(buildPdf(data, displayTopic, resolvedImageUrl, topicImage, sections, examples, readingTime, data.examQuestions || []));
      win.document.close();
    } finally {
      setIsPreparingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <article className="study-prose overflow-hidden rounded-[28px] border border-line bg-surface shadow-sm">
          <section id="abstract" className="border-b border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.04em] text-ink sm:text-[46px] lg:text-[52px]">
                {data?.title || displayTopic}
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
                <Button
                  variant="secondary"
                  className="group relative h-11 items-center gap-2 rounded-xl border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95"
                  onClick={downloadPdf}
                  disabled={isPreparingPdf}
                >
                  <div className="flex items-center gap-2">
                    {isPreparingPdf ? (
                       <span className="flex h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 transition group-hover:-translate-y-0.5" />
                        {!canAccessTool(tier, "canDownloadPdf") && <Lock className="h-3 w-3 text-slate-400" />}
                      </>
                    )}
                    {isPreparingPdf ? "Preparing..." : "Download PDF"}
                  </div>
                </Button>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-[#F6F3E6] px-5 py-4 shadow-inner">
              <ul className="space-y-3">
                {(data?.coreConcepts || []).map((item, idx) => {
                  const itemText = typeof item === "string" ? item : item.text;
                  return (
                    <PointBullet key={`core-${idx}`} text={itemText} referenceId={`core-ref-${idx}`} sources={sources} renderLeadText />
                  );
                })}
              </ul>
            </div>
          </section>

          <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">


            <section className="space-y-4">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-ink">What this topic means in simple words</h2>
              <div className="rounded-2xl border border-line/60 bg-[#F6F3E6] p-5 shadow-sm">
                <ul className="mt-5 space-y-3">
                  {toStandaloneBulletPoints(data.introduction, 5).map((item, idx) => <PointBullet key={`simple-${idx}`} text={item} />)}
                </ul>
              </div>
            </section>

            {data.analogyCard ? (
              <section className="space-y-4">
                <h2 className="font-serif text-[30px] tracking-[-0.04em] text-navy">
                  <MathText text={data.analogyCard.title} />
                </h2>
                <div className="rounded-2xl border border-line/60 bg-[#F6F3E6] p-5">
                  <ul className="space-y-3">
                    {(data.analogyCard.explanation || []).map((item, idx) => (
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
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-ink">Core ideas to focus on first</h2>
              <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5 md:p-6">
                <ul className="space-y-3">
                  {(data?.coreConcepts || []).map((concept, idx) => <PointBullet key={`core-idea-${idx}`} text={concept} className="rounded-xl bg-surface px-4 py-3 shadow-sm" />)}
                </ul>
              </div>
            </section>

            {data.frameworkCards && data.frameworkCards.length > 0 ? (
              <section id="framework" className="space-y-4 border-t border-line/50 pt-8">
                <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">A clear framework for understanding the topic</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {data.frameworkCards.map((card) => (
                    <div key={`${card.title}-${card.description}`} className="rounded-2xl border border-line bg-[#F6F3E6] p-4 md:p-5">
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
            ) : (
              <FrameworkCardsSkeleton />
            )}

            {sections.map((section, sIdx) => (
              <section key={`${section.heading}-${sIdx}`} id={sectionId(section.heading, sIdx)} className="space-y-4 border-t border-slate-100 pt-7 md:pt-8">
                <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">
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
                <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5 md:p-6 shadow-sm">
                  {section.paragraph && (
                    <div className="mb-5 rounded-[16px] border border-line bg-[#F6F3E6] p-4 md:p-5">
                      <ul className="space-y-3">
                        {toStandaloneBulletPoints(section.paragraph, 4).map((item, idx) => (
                          <PointBullet key={`para-${idx}`} text={item} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {(section.points || []).length > 0 && (
                    <ul className="space-y-3">
                      {(section.points || []).map((item, idx) => (
                        <PointBullet key={`pt-${idx}`} text={item} referenceId={`sec-${sIdx}-pt-${idx}`} sources={sources} />
                      ))}
                    </ul>
                  )}
                  {(section.subsections || []).map((sub, subIdx) => (
                    <div key={sub.heading} className="mt-6 border-t border-line/40 pt-5">
                      <h4 className="text-[18px] font-bold text-slate-900">{sub.heading}</h4>
                      <div className="mt-4 space-y-3">
                        {(sub.points || []).map((pt, ptIdx) => (
                          <PointBullet key={`sub-${subIdx}-pt-${ptIdx}`} text={pt} referenceId={`sec-${sIdx}-sub-${subIdx}-pt-${ptIdx}`} sources={sources} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {examples.length > 0 ? (
              <section id="examples" className="space-y-4 border-t border-slate-100 pt-7 md:pt-8">
                <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">How this concept appears in real life</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {examples.map((example, index) => (
                    <div key={`${example.title}-${index}`} className="rounded-[20px] border border-line bg-[#F6F3E6] p-4 md:p-5 shadow-sm">
                      <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                        <MathText text={example.title || `Example ${index + 1}`} />
                      </h3>
                      <ul className="mt-3 space-y-2">{toStandaloneBulletPoints(example.body, 3).map((item, idx) => <PointBullet key={`${example.title}-${idx}`} text={item} />)}</ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-4 border-t border-slate-100 pt-7 md:pt-8">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">Key Takeaways</h2>
              <div className="flex flex-wrap gap-3">
                {(data?.keyTakeaways || []).map((item, idx) => {
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

            <section className="rounded-[24px] border border-line bg-[#F6F3E6] p-5 md:p-6">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">Be ready for class tests and mid-sem questions</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-line bg-[#F6F3E6] p-4 md:p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Must Learn</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.mustLearn.map((item, idx) => <PointBullet key={`must-${idx}`} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-line bg-[#F6F3E6] p-4 md:p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Likely Questions</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.likelyQuestions.map((item, idx) => <PointBullet key={`likely-${idx}`} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-line bg-[#F6F3E6] p-4 md:p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Quick Revision</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.quickRevision.map((item, idx) => <PointBullet key={`rev-${idx}`} text={item} />)}
                  </ul>
                </div>
              </div>
            </section>

            <section id="conclusion" className="rounded-[24px] border border-slate-200 bg-[#f8fbff] p-5 md:p-6">
              <h2 className="font-serif text-[30px] tracking-[-0.04em] text-slate-950">What you should walk away with</h2>
              <ul className="mt-4 space-y-3">
                {toStandaloneBulletPoints(conclusion(data, sections), 3).map((item: string, idx: number) => <PointBullet key={`conc-${idx}`} text={item} />)}
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

        <div className="space-y-5 px-5 sm:px-8">
          <h2 className="font-serif text-[28px] tracking-[-0.04em] text-slate-950">Continue your study path</h2>
          <FollowUpChips topics={data.relatedTopics || []} onSelect={onFollowUp} />
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
  return `${section.heading} ${section.paragraph} ${(section.points || []).map(getTXT).join(" ")} ${(section.subsections || []).map((sub) => `${sub.heading} ${(sub.points || []).map(getTXT).join(" ")}`).join(" ")}`;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function conclusion(data: ExplanationResult, sections: StudySection[]) {
  const getTXT = (pt: string | CitedPoint) => typeof pt === 'string' ? pt : pt.text;
  const title = data?.title || "Topic";
  const firstHeading = sections[0]?.heading.toLowerCase() || "its core principles";
  const takeaways = (data?.keyTakeaways || []).slice(0, 3).map(getTXT).join(", ");
  return `In summary, ${title.toLowerCase()} becomes much easier when you connect the main idea to ${firstHeading} and keep these anchors in mind: ${takeaways || "the key points identified"}. If you can explain those ideas in simple language and connect them to a real example, you have understood the topic well.`;
}

function buildExamPrep(data: ExplanationResult, sections: StudySection[]) {
  const mustLearn = [
    ...(data?.keyTakeaways || []).slice(0, 3),
    ...sections.flatMap((section) => (section.points || []).slice(0, 1)).slice(0, 3),
  ].slice(0, 5);

  const likelyQuestions = [
    `Define ${data?.title || "the topic"} in simple words and explain its main idea.`,
    ...sections.slice(0, 2).map((section) => `Explain ${section.heading.toLowerCase()} with an example.`),
    `Write a short note on ${getPointText(data?.keyTakeaways?.[0] || data?.title || "the subject")}.`,
  ].slice(0, 4);

  function getPointText(item: string | CitedPoint) {
    return typeof item === 'string' ? item : item.text;
  }

  const quickRevision = [
    `Start with the definition, then connect it to ${sections[0]?.heading.toLowerCase() || "the first core concept"}.`,
    `Use one real-life example to show that you understand the topic clearly.`,
    `Revise the keywords: ${(data?.coreConcepts || []).slice(0, 4).map(getPointText).join(", ")}.`,
    `If asked a long answer, move from concept -> explanation -> example -> conclusion.`,
  ];

  return { mustLearn, likelyQuestions, quickRevision };
}

function buildPdf(data: ExplanationResult, topic: string, resolvedImageUrl: string | null, image: TopicImageData | null, sections: StudySection[], examples: { title?: string; body: string }[], readingTime: number, examQuestions: ExamQuestion[]) {
  const examPrep = buildExamPrep(data, sections);
  const getPT = (p: string | CitedPoint) => (typeof p === "string" ? p : p.text);

  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;

  const sectionHtml = sections.map((section) => {
    let html = `<section class="section"><h2>${e(section.heading)}</h2>`;
    if (section.paragraph) {
      html += `<p>${e(section.paragraph)}</p>`;
    }
    if (section.points.length > 0) {
      html += bullets(section.points.map(getPT));
    }
    for (const sub of section.subsections) {
      html += `<h3>${e(sub.heading)}</h3>`;
      if (sub.points.length > 0) {
        html += bullets(sub.points.map(getPT));
      }
    }
    html += `</section>`;
    return html;
  }).join("");

  const examplesHtml = examples.length > 0
    ? `<section class="section"><h2>How This Concept Appears in Real Life</h2>${examples.map((item, index) => `<h3>${e(item.title || `Example ${index + 1}`)}</h3><p>${e(item.body)}</p>`).join("")}</section>`
    : "";

  const formulaHtml = data.formulaBlock?.expression || data.formulaBlock?.latex
    ? `<section class="section formula-section"><h2>Key Formula</h2><div class="formula">${e(data.formulaBlock.latex || data.formulaBlock.expression)}</div>${data.formulaBlock.caption ? `<p class="formula-caption">${e(data.formulaBlock.caption)}</p>` : ""}${data.formulaBlock.variables.length > 0 ? `<p class="vars"><strong>Where:</strong> ${data.formulaBlock.variables.map((v: any) => `${e(v.label)} = ${e(v.description)}`).join(", ")}</p>` : ""}</section>`
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

/* Title block */
.title-block { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; }
h1 { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; color: #1a1a2e; margin-bottom: 10px; }
.subtitle { font-size: 13px; color: #64748b; }

/* Abstract */
.abstract { margin-bottom: 24px; padding: 16px 20px; background: #f8f9fa; border-left: 3px solid #1a1a2e; }
.abstract p { font-size: 14px; color: #334155; }

/* Hero image */
.hero { margin: 20px 0; }
.hero img { display: block; width: 100%; max-height: 300px; object-fit: cover; border-radius: 4px; }
.hero .cap { font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic; }

/* Sections */
.section { margin-top: 24px; page-break-inside: avoid; }
h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
h3 { font-size: 16px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
p { font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 8px; }
ul { margin: 8px 0 12px 20px; }
li { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 4px; }
li strong { color: #1a1a2e; }

/* Formula */
.formula-section { background: #f8f9fa; padding: 16px 20px; border-radius: 4px; border: 1px solid #e2e8f0; }
.formula { font-family: 'Courier New', monospace; font-size: 18px; font-weight: 600; text-align: center; padding: 12px 0; color: #1a1a2e; }
.formula-caption { font-size: 13px; color: #64748b; text-align: center; }
.vars { font-size: 13px; color: #475569; margin-top: 8px; }

/* Takeaways */
.takeaways { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 16px; }
.takeaway { font-size: 13px; font-weight: 500; padding: 6px 14px; background: #f1f5f9; border-radius: 4px; color: #334155; }

/* Exam prep table */
.prep-table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 13px; }
.prep-table th { text-align: left; padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 600; color: #1a1a2e; }
.prep-table td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
.question-item { margin-bottom: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; page-break-inside: avoid; }
.options-list { list-style: none; margin: 8px 0; padding-left: 0; }
.options-list li { margin-bottom: 4px; font-size: 13px; }
.answer { margin-top: 8px; color: #059669; font-size: 13px; }

/* Footer */
.foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-align: center; letter-spacing: 0.03em; }

@media print { body { background: #fff; } .page { max-width: none; } }
</style></head><body><div class="page">

<div class="title-block">
  <h1>${e(data.title)}</h1>
  <p class="subtitle">Study Notes · ${readingTime} min read · Generated by Vidya</p>
</div>

<div class="abstract">
  <p>${e(data.introduction)}</p>
</div>

${resolvedImageUrl ? `<div class="hero"><img src="${a(resolvedImageUrl)}" alt="${a(image?.title || data.title)}"><p class="cap">${e(image?.description || "Visual aid for the topic")}</p></div>` : ""}

<section class="section">
  <h2>Core Concepts</h2>
  ${bullets(data.coreConcepts.map(getPT))}
</section>

${data.analogyCard ? `<section class="section"><h2>${e(data.analogyCard.title)}</h2>${bullets(data.analogyCard.explanation.map(getPT))}${data.analogyCard.note ? `<p><em>${e(getPT(data.analogyCard.note))}</em></p>` : ""}</section>` : ""}

${formulaHtml}

${data.frameworkCards.length > 0 ? `<section class="section"><h2>Conceptual Framework</h2>${data.frameworkCards.map((card: any) => `<h3>${e(card.title)}</h3><p>${e(Array.isArray(card.description) ? card.description.map(getPT).join(" ") : card.description)}</p>`).join("")}</section>` : ""}

${sectionHtml}

${examplesHtml}

${questionsHtml}

<section class="section">
  <h2>Key Takeaways</h2>
  <div class="takeaways">${data.keyTakeaways.map((item) => `<span class="takeaway">${e(getPT(item))}</span>`).join("")}</div>
</section>

<section class="section">
  <h2>Exam Preparation</h2>
  <table class="prep-table">
    <tr><th>Must Learn</th><th>Likely Questions</th><th>Quick Revision</th></tr>
    <tr>
      <td>${examPrep.mustLearn.map(getPT).map(e).map(t => `• ${t}`).join("<br>")}</td>
      <td>${examPrep.likelyQuestions.map(getPT).map(e).map(t => `• ${t}`).join("<br>")}</td>
      <td>${examPrep.quickRevision.map(getPT).map(e).map(t => `• ${t}`).join("<br>")}</td>
    </tr>
  </table>
</section>

<section class="section">
  <h2>Conclusion</h2>
  <p>${e(conclusion(data, sections))}</p>
</section>

<p class="foot">Generated by Vidya · Vidya</p>
</div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
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
