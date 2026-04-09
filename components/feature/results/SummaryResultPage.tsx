"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { ListenButton } from "@/components/feature/results/ListenButton";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import { toStandaloneBulletPoints } from "@/lib/utils";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";
import type { SummaryResult, TopicImageData } from "@/types";

interface SummaryResultPageProps {
  data: SummaryResult;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
  onStudyGaps: (topic: string) => void;
  showRealLifeExamples: boolean;
  onSaveAsFlashcards: () => void;
  isSavingFlashcards: boolean;
  flashcardMessage: string;
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
}: SummaryResultPageProps) {
  const [topicImage, setTopicImage] = useState<TopicImageData | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const realLifeExamples = showRealLifeExamples ? extractRealLifeExamples(data.sections) : [];
  const contentSections = filterOutRealLifeExamples(data.sections);
  const displayTopic = sourceTopic || data.title;
  const quickRevision = [
    `Start with the main idea of ${data.title}.`,
    `Revise these keywords: ${data.coreConcepts.slice(0, 4).join(", ")}.`,
    `Use one short example if the answer needs explanation.`,
    "Keep your answer direct: definition, key point, example, conclusion.",
  ];
  const listenText = [
    data.title,
    data.introduction,
    ...data.concepts.map((concept) => `${concept.title}. ${concept.explanation}`),
    ...contentSections.map((section) => `${section.heading}. ${section.paragraph} ${section.points.join(". ")}`),
    ...realLifeExamples.map((example) => `${example.title || "Example"}. ${example.body}`),
    "What to remember before a test.",
    ...data.coreConcepts,
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
      <article className="study-prose overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <section className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-6 py-8 sm:px-10 sm:py-10">
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
          <h1 className="mt-6 font-serif text-[46px] leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-[62px]">
            {data.title}
          </h1>
          <div className="mt-6 rounded-[24px] border border-slate-100 bg-[#f7fafe] px-5 py-5">
            <ul className="space-y-3">
              {toStandaloneBulletPoints(data.introduction, 3).map((item) => (
                <SummaryBullet key={item} text={item} />
              ))}
            </ul>
          </div>
        </section>

        <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
          <section className="space-y-4">
            <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">What this topic means in simple words</h2>
            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <ul className="space-y-3">
                {toStandaloneBulletPoints(data.introduction, 4).map((item) => (
                  <SummaryBullet key={item} text={item} />
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-[34px] tracking-[-0.04em] text-slate-950">Visual Understanding</h2>
            <TopicImagePanel
              query={displayTopic}
              title={data.visualBlock?.title || "Visualized Study Diagram"}
              subtitle={data.visualBlock?.description || "Use this image to connect the topic with a clear mental picture."}
              onImageDataChange={setTopicImage}
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Important terms to remember</h2>
            <div className="rounded-[28px] border border-slate-200 bg-[#fbfdff] p-6">
              <div className="space-y-5">
              {data.concepts.map((concept) => (
                <div key={`${concept.title}-${concept.explanation}`} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">{concept.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {toStandaloneBulletPoints(concept.explanation, 3).map((item) => (
                      <SummaryBullet key={`${concept.title}-${item}`} text={item} />
                    ))}
                  </ul>
                </div>
              ))}
              </div>
            </div>
          </section>

          {contentSections.map((section) => (
            <section key={section.heading} className="space-y-4 border-t border-slate-100 pt-8">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">{section.heading}</h2>
              {section.paragraph ? (
                <ul className="space-y-3">
                  {toStandaloneBulletPoints(section.paragraph, 4).map((item) => (
                    <SummaryBullet key={`${section.heading}-${item}`} text={item} />
                  ))}
                </ul>
              ) : null}
              {section.points.length > 0 ? (
                <div className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-5">
                  <ul className="space-y-3">
                  {section.points.slice(0, 5).map((point) => (
                    <SummaryBullet key={point} text={point} />
                  ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ))}

          {realLifeExamples.length > 0 ? (
            <section className="space-y-4 border-t border-slate-100 pt-8">
              <h2 className="font-serif text-[38px] tracking-[-0.04em] text-slate-950">Examples that make the topic easier</h2>
              <div className="space-y-5">
                {realLifeExamples.map((example, index) => (
                  <div key={`${example.title}-${example.body}-${index}`} className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-5">
                    <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">{example.title || `Example ${index + 1}`}</h3>
                    <ul className="mt-3 space-y-2">
                      {toStandaloneBulletPoints(example.body, 3).map((item) => (
                        <SummaryBullet key={`${example.title}-${item}`} text={item} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[30px] border border-slate-200 bg-[#f8fbff] p-6">
            <h2 className="mt-4 font-serif text-[38px] tracking-[-0.04em] text-slate-950">What to remember before a test</h2>
            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-[15px] font-semibold text-slate-900">Key Takeaways</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {data.coreConcepts.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2 text-[15px] font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-[15px] font-semibold text-slate-900">Revision Plan</p>
                <ul className="mt-4 space-y-3">
                  {quickRevision.map((item) => (
                    <SummaryBullet key={item} text={item} />
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}

function SummaryBullet({ text, className = "" }: { text: string; className?: string }) {
  const [lead, rest] = splitLead(text);
  return <li className={`flex gap-3 text-[18px] leading-9 text-slate-700 ${className}`}><span className="mt-3.5 h-2.5 w-2.5 rounded-full bg-primary" /><span><strong className="font-bold text-slate-950">{renderHighlightedText(lead)}</strong>{rest ? <>{": "}{renderHighlightedText(rest)}</> : ""}</span></li>;
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

function buildSummaryPdf(data: SummaryResult, topic: string, image: TopicImageData | null, sections: SummaryResult["sections"], examples: { title?: string; body: string }[], quickRevision: string[]) {
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;
  const card = (title: string, body: string, tag = "") => `<div class="card">${tag ? `<p class="eyebrow">${e(tag)}</p>` : ""}${title ? `<h3>${e(title)}</h3>` : ""}${body.trim().startsWith("<") ? body : `<p>${body}</p>`}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#142033;font-family:"Libre Baskerville",Georgia,"Times New Roman",serif}.page{max-width:900px;margin:0 auto;background:#fff;padding:36px}.eyebrow{font:700 10px/1.2 "Libre Baskerville",serif;letter-spacing:.16em;text-transform:uppercase;color:#2d5bd1;margin:0 0 12px}h1,h2,h3{margin:0;color:#0f172a;font-family:"Libre Baskerville",serif}h1{font-size:36px;line-height:1;margin-top:0}h2{font-size:24px;line-height:1.2;margin:0 0 14px}h3{font-size:18px;line-height:1.3;margin:0 0 10px}p,li{font:15px/1.9 "Libre Baskerville",serif;color:#334155}.quote,.card{border:1px solid #e2e8f0;border-radius:18px;background:#f8fbff;padding:18px 20px}.quote{margin-top:18px}.hero{margin-top:22px;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden}.hero img{display:block;width:100%;max-height:320px;object-fit:cover}.hero .cap{padding:14px 18px 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.section{margin-top:28px;page-break-inside:avoid}.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.tag{border:1px solid #dbe3f1;border-radius:999px;padding:10px 14px;background:#fff;font:600 13px/1.3 "Libre Baskerville",serif;color:#334155}ul{margin:10px 0 0;padding-left:20px}.foot{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b;font:12px/1.6 "Libre Baskerville",serif}@media print{body{background:#fff}.page{max-width:none;padding:0}}</style></head><body><div class="page"><h1>${e(data.title)}</h1><div class="quote">${bullets(toStandaloneBulletPoints(data.introduction,3))}</div>${image?.imageUrl ? `<div class="hero"><img src="${a(image.imageUrl)}" alt="${a(image.title || data.title)}"><div class="cap"><h2>Visual Understanding</h2><p>${e(image.description || "This image gives a quick mental picture of the topic.")}</p></div></div>` : ""}<section class="section"><h2>Important terms to remember</h2><div class="grid">${data.concepts.map((item) => card(item.title, bullets(toStandaloneBulletPoints(item.explanation,3)))).join("")}</div></section><section class="section"><h2>Short notes for quick revision</h2><div class="grid">${sections.map((section) => card(section.heading, `${section.paragraph ? bullets(toStandaloneBulletPoints(section.paragraph,4)) : ""}${section.points.length ? bullets(section.points.slice(0,4)) : ""}`)).join("")}</div></section>${examples.length ? `<section class="section"><h2>Examples that make the topic easier</h2><div class="grid">${examples.map((item, index) => card(item.title || "Simple example", bullets(toStandaloneBulletPoints(item.body,3)), `Example ${index + 1}`)).join("")}</div></section>` : ""}<section class="section"><h2>What to remember before a test</h2><div class="tags">${data.coreConcepts.map((item) => `<span class="tag">${e(item)}</span>`).join("")}</div>${bullets(quickRevision)}</section><p class="foot">Generated by Saar AI. When the print dialog opens, choose "Save as PDF" to download this summary.</p></div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
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
