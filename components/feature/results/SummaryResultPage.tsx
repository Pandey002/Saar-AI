"use client";

import { useState } from "react";
import { BookOpenText, Download, FileText, GraduationCap, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { TeachBack } from "@/components/feature/results/TeachBack";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";
import { buildSummaryTeachBackContext } from "@/lib/utils/teachBack";
import type { SummaryResult, TopicImageData } from "@/types";

interface SummaryResultPageProps {
  data: SummaryResult;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
  onStudyGaps: (topic: string) => void;
  showRealLifeExamples: boolean;
}

export function SummaryResultPage({
  data,
  sourceTopic,
  onFollowUp,
  onStudyGaps,
  showRealLifeExamples,
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
      <article className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <section className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap gap-2">
            <SummaryChip text="Summary" strong />
            <SummaryChip text="Easy Revision" />
            <SummaryChip text="To the point" />
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-[42px] leading-[0.98] tracking-[-0.04em] text-slate-950 sm:text-[56px]">
            {data.title}
          </h1>
          <p className="mt-6 max-w-3xl rounded-[24px] border border-slate-100 bg-[#f7fafe] px-5 py-5 text-[15px] italic leading-8 text-slate-600">
            {data.introduction}
          </p>
        </section>

        <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr),minmax(280px,0.9fr)]">
            <div className="rounded-[30px] border border-slate-200 bg-[#fcfdff] p-6">
              <SummaryEyebrow icon={<BookOpenText className="h-4 w-4" />} text="Quick Understanding" />
              <h2 className="mt-4 font-serif text-[34px] tracking-[-0.04em] text-slate-950">What this topic means in simple words</h2>
              <p className="mt-4 text-[15px] leading-8 text-slate-600">{data.introduction}</p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-[#f8fbff] p-6">
              <SummaryEyebrow icon={<GraduationCap className="h-4 w-4" />} text="Core Concepts" />
              <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">Learn these first</h2>
              <ul className="mt-5 space-y-3">
                {data.concepts.map((concept) => (
                  <SummaryBullet key={`${concept.title}-${concept.explanation}`} text={`${concept.title}: ${concept.explanation}`} className="rounded-2xl bg-white px-4 py-3" />
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <SummaryEyebrow icon={<ImageIcon className="h-4 w-4" />} text="Quick Understanding Map" />
            <TopicImagePanel
              query={displayTopic}
              title={data.visualBlock?.title || "Visualized Study Diagram"}
              subtitle={data.visualBlock?.description || "Use this image to connect the topic with a clear mental picture."}
              onImageDataChange={setTopicImage}
            />
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-[#fcfdff] p-6">
            <SummaryEyebrow icon={<FileText className="h-4 w-4" />} text="Summary Notes" />
            <h2 className="mt-4 font-serif text-[34px] tracking-[-0.04em] text-slate-950">Short notes you can revise quickly</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {contentSections.map((section) => (
                <div key={section.heading} className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">{section.heading}</h3>
                  {section.paragraph ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{section.paragraph}</p>
                  ) : null}
                  {section.points.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {section.points.slice(0, 4).map((point) => (
                        <SummaryBullet key={point} text={point} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {realLifeExamples.length > 0 ? (
            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#eef5ff_0%,#f9fbff_100%)] p-6">
              <SummaryEyebrow icon={<Sparkles className="h-4 w-4" />} text="Real-life Examples" />
              <h2 className="mt-4 font-serif text-[34px] tracking-[-0.04em] text-slate-950">Simple examples that make the topic stick</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {realLifeExamples.map((example, index) => (
                  <div key={`${example.title}-${example.body}-${index}`} className="rounded-[24px] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Example {index + 1}</p>
                    <h3 className="mt-3 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">{example.title || "Simple example"}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{example.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[30px] border border-slate-200 bg-[#f8fbff] p-6">
            <SummaryEyebrow icon={<GraduationCap className="h-4 w-4" />} text="Quick Revision" />
            <h2 className="mt-4 font-serif text-[34px] tracking-[-0.04em] text-slate-950">What to remember before a test</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Key Takeaways</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {data.coreConcepts.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-[#f8fbff] px-4 py-2 text-sm font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Revision Plan</p>
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

      <TeachBack
        topicKey={`summary::${displayTopic.trim().toLowerCase()}`}
        topicTitle={data.title || sourceTopic}
        originalTopicSummary={buildSummaryTeachBackContext(data)}
        onStudyGaps={onStudyGaps}
      />

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />

      <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Export</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-slate-900">Download this summary as a clean revision PDF</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              The PDF keeps the summary short, easy to revise, and useful just before class tests or mid-sem exams.
            </p>
          </div>
          <Button onClick={downloadPdf} disabled={isPreparingPdf} className="rounded-2xl px-6 py-3">
            <Download className="mr-2 h-4 w-4" />
            {isPreparingPdf ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryEyebrow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{icon}<span>{text}</span></div>;
}

function SummaryChip({ text, strong = false }: { text: string; strong?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${strong ? "bg-[#edf4ff] text-primary" : "bg-slate-100 text-slate-500"}`}>{text}</span>;
}

function SummaryBullet({ text, className = "" }: { text: string; className?: string }) {
  const [lead, rest] = splitLead(text);
  return <li className={`flex gap-3 text-[15px] leading-7 text-slate-700 ${className}`}><span className="mt-2 h-2 w-2 rounded-full bg-primary" /><span><strong className="text-slate-900">{lead}</strong>{rest ? `: ${rest}` : ""}</span></li>;
}

function splitLead(text: string) {
  const at = text.indexOf(":");
  return at > 0 && at < 32 ? [text.slice(0, at).trim(), text.slice(at + 1).trim()] : [text.trim(), ""];
}

function buildSummaryPdf(data: SummaryResult, topic: string, image: TopicImageData | null, sections: SummaryResult["sections"], examples: { title?: string; body: string }[], quickRevision: string[]) {
  const bullets = (items: string[]) => `<ul>${items.map((item) => `<li>${line(item)}</li>`).join("")}</ul>`;
  const card = (title: string, body: string, tag = "") => `<div class="card">${tag ? `<p class="eyebrow">${e(tag)}</p>` : ""}${title ? `<h3>${e(title)}</h3>` : ""}${body.trim().startsWith("<") ? body : `<p>${body}</p>`}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${e(data.title)}</title><style>@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{margin:0;background:#eef4fb;color:#142033;font-family:Georgia,"Times New Roman",serif}.page{max-width:900px;margin:0 auto;background:#fff;padding:36px}.chips{display:flex;flex-wrap:wrap;gap:8px}.chip,.eyebrow{font:700 10px/1.2 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}.chip{background:#edf4ff;color:#2d5bd1;border-radius:999px;padding:7px 12px}.eyebrow{color:#2d5bd1;margin:0 0 12px}h1,h2,h3{margin:0;color:#0f172a}h1{font-size:36px;line-height:1;margin-top:14px}h2{font-size:24px;line-height:1.15;margin:0 0 14px}h3{font-size:18px;line-height:1.25;margin:0 0 10px}p,li{font:15px/1.8 Arial,sans-serif;color:#334155}.quote,.card{border:1px solid #e2e8f0;border-radius:18px;background:#f8fbff;padding:18px 20px}.quote{margin-top:18px;font-style:italic}.hero{margin-top:22px;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden}.hero img{display:block;width:100%;max-height:320px;object-fit:cover}.hero .cap{padding:14px 18px 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.section{margin-top:28px;page-break-inside:avoid}.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.tag{border:1px solid #dbe3f1;border-radius:999px;padding:10px 14px;background:#fff;font:600 13px/1.3 Arial,sans-serif;color:#334155}ul{margin:10px 0 0;padding-left:20px}.foot{margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;color:#64748b;font:12px/1.6 Arial,sans-serif}@media print{body{background:#fff}.page{max-width:none;padding:0}}</style></head><body><div class="page"><div class="chips"><span class="chip">Summary</span><span class="chip">Easy Revision</span><span class="chip">${e(topic)}</span></div><h1>${e(data.title)}</h1><p class="quote">${e(data.introduction)}</p>${image?.imageUrl ? `<div class="hero"><img src="${a(image.imageUrl)}" alt="${a(image.title || data.title)}"><div class="cap"><p class="eyebrow">Quick Understanding Map</p><p>${e(image.description || "This image gives a quick mental picture of the topic.")}</p></div></div>` : ""}<section class="section"><p class="eyebrow">Core Concepts</p><h2>Main ideas to learn first</h2><div class="grid">${data.concepts.map((item) => card(item.title, e(item.explanation))).join("")}</div></section><section class="section"><p class="eyebrow">Summary Notes</p><h2>Short notes for quick revision</h2><div class="grid">${sections.map((section) => card(section.heading, `${section.paragraph ? `<p>${e(section.paragraph)}</p>` : ""}${section.points.length ? bullets(section.points.slice(0,4)) : ""}`)).join("")}</div></section>${examples.length ? `<section class="section"><p class="eyebrow">Real-life Examples</p><h2>Simple examples that make the topic stick</h2><div class="grid">${examples.map((item, index) => card(item.title || "Simple example", e(item.body), `Example ${index + 1}`)).join("")}</div></section>` : ""}<section class="section"><p class="eyebrow">Quick Revision</p><h2>What to remember before a test</h2><div class="tags">${data.coreConcepts.map((item) => `<span class="tag">${e(item)}</span>`).join("")}</div>${bullets(quickRevision)}</section><p class="foot">Generated by Saar AI. When the print dialog opens, choose "Save as PDF" to download this summary.</p></div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},500)})</script></body></html>`;
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
