"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { ListenButton } from "@/components/feature/results/ListenButton";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import { toStandaloneBulletPoints } from "@/lib/utils";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";
import type { ExplanationResult, StudySection, TopicImageData } from "@/types";

interface ExplainResultPageProps {
  data: ExplanationResult;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
  onStudyGaps: (topic: string) => void;
  showRealLifeExamples: boolean;
  onSaveAsFlashcards: () => void;
  isSavingFlashcards: boolean;
  flashcardMessage: string;
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
}: ExplainResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const displayTopic = sourceTopic || data.title;
  const examples = showRealLifeExamples ? extractRealLifeExamples(data.sections) : [];
  const sections = filterOutRealLifeExamples(data.sections);
  const readingTime = Math.max(8, Math.round(wordCount(`${data.introduction} ${sections.map(sectionText).join(" ")}`) / 180));
  const examPrep = useMemo(() => buildExamPrep(data, sections), [data, sections]);
  const listenText = useMemo(
    () =>
      [
        data.title,
        data.introduction,
        data.analogyCard ? `${data.analogyCard.title}. ${data.analogyCard.explanation} ${data.analogyCard.note}` : "",
        ...data.coreConcepts,
        ...data.frameworkCards.map((card) => `${card.title}. ${card.description}`),
        ...sections.map(
          (section) =>
            `${section.heading}. ${section.paragraph} ${section.points.join(". ")} ${section.subsections
              .map((sub) => `${sub.heading}. ${sub.points.join(". ")}`)
              .join(" ")}`
        ),
        ...examples.map((example) => `${example.title || "Example"}. ${example.body}`),
        "Key takeaways.",
        ...data.keyTakeaways,
        "Exam preparation.",
        ...examPrep.mustLearn,
        ...examPrep.likelyQuestions,
        ...examPrep.quickRevision,
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
        <article className="study-prose overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          <section id="abstract" className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-wrap justify-end gap-3">
              <Button onClick={onSaveAsFlashcards} disabled={isSavingFlashcards} variant="secondary" className="rounded-2xl px-6 py-3">
                {isSavingFlashcards ? "Saving..." : "+ Save as Flashcards"}
              </Button>
              <ListenButton text={listenText} />
              <Button onClick={downloadPdf} disabled={isPreparingPdf} className="rounded-2xl px-6 py-3">
                <Download className="mr-2 h-4 w-4" />
                {isPreparingPdf ? "Preparing PDF..." : "Download PDF"}
              </Button>
            </div>
            {flashcardMessage ? (
              <p className="mt-4 text-right text-sm font-medium text-emerald-700">{flashcardMessage}</p>
            ) : null}
            <h1 className="mt-6 font-serif text-[46px] leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-[62px]">{data.title}</h1>
            <div className="mt-6 rounded-[24px] border border-slate-100 bg-[#f7fafe] px-5 py-5">
              <ul className="space-y-3">
                {toStandaloneBulletPoints(data.introduction, 4).map((item) => (
                  <Bullet key={item} text={item} />
                ))}
              </ul>
            </div>
          </section>

          <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
            <section id="visual" className="space-y-4">
              <h2 className="font-serif text-[34px] tracking-[-0.04em] text-slate-950">Visual Understanding</h2>
              <TopicImagePanel query={displayTopic} title={data.title} subtitle="Use this visual as an anchor while you study the detailed explanation." onImageDataChange={setTopicImage} />
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">What this topic means in simple words</h2>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <ul className="mt-5 space-y-3">
                  {toStandaloneBulletPoints(data.introduction, 5).map((item) => <Bullet key={`intro-${item}`} text={item} />)}
                </ul>
              </div>
            </section>

            {data.analogyCard ? (
              <section className="space-y-4">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">{data.analogyCard.title}</h2>
                <div className="rounded-[24px] border border-slate-200 bg-[#f3f7ff] p-6">
                  <ul className="space-y-3">
                    {toStandaloneBulletPoints(data.analogyCard.explanation, 4).map((item) => <Bullet key={`analogy-${item}`} text={item} />)}
                    {data.analogyCard.note ? <Bullet text={data.analogyCard.note} /> : null}
                  </ul>
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Core ideas to focus on first</h2>
              <div className="rounded-[28px] border border-slate-200 bg-[#fbfdff] p-6">
                <ul className="space-y-3">
                  {data.coreConcepts.map((concept) => <Bullet key={concept} text={concept} className="rounded-2xl bg-white px-4 py-3" />)}
                </ul>
              </div>
            </section>

            {data.frameworkCards.length > 0 ? (
              <section id="framework" className="space-y-4">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">A clear framework for understanding the topic</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {data.frameworkCards.map((card) => (
                    <div key={`${card.title}-${card.description}`} className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
                      <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{card.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {toStandaloneBulletPoints(card.description, 3).map((item) => <Bullet key={`${card.title}-${item}`} text={item} />)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {sections.map((section, index) => (
              <section key={`${section.heading}-${index}`} id={sectionId(section.heading, index)} className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">{section.heading}</h2>
                {section.paragraph ? <ul className="space-y-3">{toStandaloneBulletPoints(section.paragraph, 4).map((item) => <Bullet key={`${section.heading}-${item}`} text={item} />)}</ul> : null}
                {section.points.length > 0 ? <div className="rounded-[24px] border border-slate-200 bg-[#f8fbff] p-5"><ul className="space-y-3">{section.points.map((point) => <Bullet key={point} text={point} />)}</ul></div> : null}
                {section.subsections.length > 0 ? (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {section.subsections.map((sub) => (
                      <div key={`${section.heading}-${sub.heading}`} className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
                        <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{sub.heading}</h3>
                        <ul className="mt-4 space-y-3">{sub.points.map((point) => <Bullet key={`${sub.heading}-${point}`} text={point} />)}</ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            {examples.length > 0 ? (
              <section id="examples" className="space-y-4 border-t border-slate-100 pt-8">
                <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">How this concept appears in real life</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {examples.map((example, index) => (
                    <div key={`${example.title}-${index}`} className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
                      <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">{example.title || `Example ${index + 1}`}</h3>
                      <ul className="mt-3 space-y-2">{toStandaloneBulletPoints(example.body, 3).map((item) => <Bullet key={`${example.title}-${item}`} text={item} />)}</ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section id="takeaways" className="rounded-[30px] border border-slate-200 bg-[#fcfdff] p-6">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Key Takeaways</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {data.keyTakeaways.map((item) => <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[15px] font-medium text-slate-700">{item}</span>)}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#eef5ff_0%,#f8fbff_100%)] p-6">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Be ready for class tests and mid-sem questions</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] bg-white p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Must Learn</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.mustLearn.map((item) => <Bullet key={item} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-white p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Likely Questions</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.likelyQuestions.map((item) => <Bullet key={item} text={item} />)}
                  </ul>
                </div>
                <div className="rounded-[24px] bg-white p-5">
                  <p className="text-[15px] font-semibold text-slate-900">Quick Revision</p>
                  <ul className="mt-4 space-y-3">
                    {examPrep.quickRevision.map((item) => <Bullet key={item} text={item} />)}
                  </ul>
                </div>
              </div>
            </section>

            <section id="conclusion" className="rounded-[30px] border border-slate-200 bg-[#f8fbff] p-6">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">What you should walk away with</h2>
              <ul className="mt-4 space-y-3">
                {toStandaloneBulletPoints(conclusion(data, sections), 3).map((item) => <Bullet key={item} text={item} />)}
              </ul>
            </section>
          </div>
        </article>
        <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
      </div>
    </div>
  );
}

function Bullet({ text, className = "" }: { text: string; className?: string }) {
  const [lead, rest] = splitLead(text);
  return <li className={`flex gap-3 text-[18px] leading-9 text-slate-700 ${className}`}><span className="mt-3.5 h-2.5 w-2.5 rounded-full bg-primary" /><span><strong className="font-bold text-slate-950">{renderHighlightedText(lead)}</strong>{rest ? <>{": "}{renderHighlightedText(rest)}</> : ""}</span></li>;
}

function splitLead(text: string) {
  const at = text.indexOf(":");
  return at > 0 && at < 32 ? [text.slice(0, at).trim(), text.slice(at + 1).trim()] : [text.trim(), ""];
}

function sectionId(heading: string, index: number) {
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `chapter-${index + 1}`;
}

function sectionText(section: StudySection) {
  return `${section.heading} ${section.paragraph} ${section.points.join(" ")} ${section.subsections.map((sub) => `${sub.heading} ${sub.points.join(" ")}`).join(" ")}`;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function conclusion(data: ExplanationResult, sections: StudySection[]) {
  return `In summary, ${data.title.toLowerCase()} becomes much easier when you connect the main idea to ${sections[0]?.heading.toLowerCase() || "its core principles"} and keep these anchors in mind: ${data.keyTakeaways.slice(0, 3).join(", ")}. If you can explain those ideas in simple language and connect them to a real example, you have understood the topic well.`;
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

function buildExamPrep(data: ExplanationResult, sections: StudySection[]) {
  const mustLearn = [
    ...data.keyTakeaways.slice(0, 3),
    ...sections.flatMap((section) => section.points.slice(0, 1)).slice(0, 3),
  ].slice(0, 5);

  const likelyQuestions = [
    `Define ${data.title} in simple words and explain its main idea.`,
    ...sections.slice(0, 2).map((section) => `Explain ${section.heading.toLowerCase()} with an example.`),
    `Write a short note on ${data.keyTakeaways[0] || data.title}.`,
  ].slice(0, 4);

  const quickRevision = [
    `Start with the definition, then connect it to ${sections[0]?.heading.toLowerCase() || "the first core concept"}.`,
    `Use one real-life example to show that you understand the topic clearly.`,
    `Revise the keywords: ${data.coreConcepts.slice(0, 4).join(", ")}.`,
    `If asked a long answer, move from concept -> explanation -> example -> conclusion.`,
  ];

  return { mustLearn, likelyQuestions, quickRevision };
}

function buildPdf(data: ExplanationResult, topic: string, image: TopicImageData | null, sections: StudySection[], examples: { title?: string; body: string }[], readingTime: number) {
  const examPrep = buildExamPrep(data, sections);
  const card = (title: string, body: string) => `<div class="card">${title ? `<h3>${e(title)}</h3>` : ""}${body.trim().startsWith("<") ? body : `<p>${body}</p>`}</div>`;
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#142033;font-family:"Libre Baskerville",Georgia,"Times New Roman",serif}.page{max-width:900px;margin:0 auto;background:#fff;padding:36px}h1,h2,h3{margin:0;color:#0f172a;font-family:"Libre Baskerville",serif}h1{font-size:36px;line-height:1;margin-top:0}h2{font-size:24px;line-height:1.2;margin:0 0 14px}h3{font-size:18px;line-height:1.3;margin:0 0 10px}p,li{font:15px/1.9 "Libre Baskerville",serif;color:#334155}.quote,.panel,.card{border:1px solid #e2e8f0;border-radius:18px;background:#f8fbff;padding:18px 20px}.quote{margin-top:18px}.hero{margin-top:22px;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden}.hero img{display:block;width:100%;max-height:340px;object-fit:cover}.hero .cap{padding:14px 18px 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.section{margin-top:28px;page-break-inside:avoid}.sub{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.takeaways{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.takeaway{border:1px solid #dbe3f1;border-radius:999px;padding:10px 14px;background:#fff;font:600 13px/1.3 "Libre Baskerville",serif;color:#334155}ul{margin:10px 0 0;padding-left:20px}.foot{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b;font:12px/1.6 "Libre Baskerville",serif}@media print{body{background:#fff}.page{max-width:none;padding:0}}</style></head><body><div class="page"><h1>${e(data.title)}</h1><div class="quote">${bullets(toStandaloneBulletPoints(data.introduction, 4))}</div>${image?.imageUrl ? `<div class="hero"><img src="${a(image.imageUrl)}" alt="${a(image.title || data.title)}"><div class="cap"><h2>Visual Understanding</h2><p>${e(image.description || "This visual supports the explanation and helps the learner build a mental picture of the topic.")}</p></div></div>` : ""}${data.analogyCard ? `<section class="section"><h2>${e(data.analogyCard.title)}</h2><div class="panel">${bullets(toStandaloneBulletPoints(`${data.analogyCard.explanation} ${data.analogyCard.note || ""}`, 4))}</div></section>` : ""}<section class="section"><h2>Core ideas to focus on first</h2><div class="grid">${data.coreConcepts.map((item) => card("", bullets([item]))).join("")}</div></section>${data.frameworkCards.length ? `<section class="section"><h2>A clear framework for understanding the topic</h2><div class="grid">${data.frameworkCards.map((item) => card(item.title, bullets(toStandaloneBulletPoints(item.description, 3)))).join("")}</div></section>` : ""}${sections.map((section) => `<section class="section"><h2>${e(section.heading)}</h2>${section.paragraph ? bullets(toStandaloneBulletPoints(section.paragraph, 4)) : ""}${section.points.length ? `<div class="panel">${bullets(section.points)}</div>` : ""}${section.subsections.length ? `<div class="sub">${section.subsections.map((sub) => card(sub.heading, bullets(sub.points))).join("")}</div>` : ""}</section>`).join("")}${examples.length ? `<section class="section"><h2>How this concept appears in real life</h2><div class="sub">${examples.map((item, index) => card(item.title || `Example ${index + 1}`, bullets(toStandaloneBulletPoints(item.body, 3)))).join("")}</div></section>` : ""}<section class="section"><h2>Key Takeaways</h2><div class="takeaways">${data.keyTakeaways.map((item) => `<span class="takeaway">${e(item)}</span>`).join("")}</div></section><section class="section"><h2>Be ready for class tests and mid-sem questions</h2><div class="sub">${card("Must Learn", bullets(examPrep.mustLearn))}${card("Likely Questions", bullets(examPrep.likelyQuestions))}${card("Quick Revision", bullets(examPrep.quickRevision))}</div></section><section class="section"><h2>What you should walk away with</h2>${bullets(toStandaloneBulletPoints(conclusion(data, sections), 3))}</section><p class="foot">Generated by Saar AI. When the print dialog opens, choose "Save as PDF" to download this report.</p></div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
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
