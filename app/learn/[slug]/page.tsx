import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createChatCompletion } from "@/lib/ai/client";
import { GraduationCap, ArrowLeft, BookOpen, Lightbulb, CheckCircle2, ChevronRight, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import topics from "@/data/seo/topics.json";
import { SocialShare } from "@/components/seo/SocialShare";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return topics.map((topic) => ({
    slug: topic.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = topics.find((t) => t.slug === slug);

  if (!topic) return { title: "Topic Not Found" };

  return {
    title: `${topic.title} Explained | Vidya AI Study Guide`,
    description: topic.description,
    keywords: topic.keywords,
    openGraph: {
      title: topic.title,
      description: topic.description,
      type: "article",
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = topics.find((t) => t.slug === slug);

  if (!topic) notFound();

  let aiData: any = null;
  try {
    const prompt = `Act as an expert educator. Provide a structured, high-quality summary for the topic: "${topic.title}". 
    Focus on key concepts, why it's important for students, and common misconceptions.
    Return the response in a clean JSON format with these fields: 
    "summary" (markdown string), 
    "keyTakeaways" (array of strings), 
    "faq" (array of {q, a}),
    "quiz" (array of {question, options, answerIndex, explanation}).`;
    
    const result = await createChatCompletion(prompt);
    aiData = JSON.parse(result.content);
  } catch (error) {
    console.error("AI Generation failed for topic:", slug, error);
    aiData = {
      summary: "Our AI is currently generating a deep-dive for this topic. Please check back in a moment.",
      keyTakeaways: [],
      faq: [],
      quiz: []
    };
  }

  const relatedTopics = topics.filter(t => t.category === topic.category && t.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F9F7F2] selection:bg-primary/20 font-sans text-slate-900">
      {/* ─── PREMIUM HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Vidya</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/info" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Methodology</Link>
            <Link href="/tools/climate-agriculture" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Agri-Tech</Link>
          </nav>

          <Link href="/" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary transition-all active:scale-95 shadow-lg shadow-slate-200">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
          
          {/* ─── MAIN CONTENT ─── */}
          <article className="space-y-16">
            
            {/* Hero Section */}
            <header className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 text-emerald-700 text-[11px] font-bold uppercase tracking-widest border border-emerald-200/50">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Expert Verified • {topic.category}
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                {topic.title}
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-medium">
                {topic.description}
              </p>
            </header>

            {/* AI Summary Section */}
            <section className="relative">
              <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent opacity-20 hidden md:block" />
              <div className="prose prose-lg prose-slate max-w-none 
                prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
                prose-p:text-slate-600 prose-p:leading-[1.8]
                prose-strong:text-primary prose-strong:font-bold
                prose-code:bg-slate-100 prose-code:p-1 prose-code:rounded prose-code:text-primary">
                <div dangerouslySetInnerHTML={{ __html: aiData.summary.replace(/\n/g, '<br/>') }} />
              </div>
            </section>

            {/* Interactive Key Takeaways */}
            {aiData.keyTakeaways.length > 0 && (
              <section className="bg-white rounded-[32px] p-10 border border-sand shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  Quick Recall Points
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {aiData.keyTakeaways.map((point: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 group hover:bg-emerald-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-white border border-sand flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        {i + 1}
                      </div>
                      <span className="text-[15px] font-medium text-slate-600 group-hover:text-slate-900 leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── INTERACTIVE QUICK QUIZ ─── */}
            {aiData.quiz && aiData.quiz.length > 0 && (
              <section className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                
                <div className="relative z-10 space-y-10">
                  <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">Active Recall Challenge</h2>
                    <p className="text-slate-400 font-medium italic">Test your understanding before you leave.</p>
                  </div>

                  <div className="space-y-8 max-w-2xl mx-auto">
                    {aiData.quiz.slice(0, 1).map((q: any, i: number) => (
                      <div key={i} className="space-y-6">
                        <p className="text-xl font-bold text-center leading-relaxed">
                          {q.question}
                        </p>
                        <div className="grid gap-3">
                          {q.options.map((opt: string, idx: number) => (
                            <button key={idx} className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-medium text-slate-300 hover:text-white flex items-center justify-between group/opt">
                              {opt}
                              <div className="w-5 h-5 rounded-full border border-white/20 group-hover/opt:border-primary transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Want more questions?</p>
                    <Link 
                      href={`/?topic=${encodeURIComponent(topic.title)}&mode=assignment`}
                      className="inline-flex items-center gap-2 bg-primary px-8 py-4 rounded-2xl font-bold text-white hover:bg-emerald-400 transition-all shadow-xl shadow-primary/20"
                    >
                      Start Full Practice Exam <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* FAQ Section */}
            {aiData.faq.length > 0 && (
              <section className="space-y-8 pt-10">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  Deep Dive FAQ
                </h2>
                <div className="grid gap-4">
                  {aiData.faq.map((item: any, i: number) => (
                    <details key={i} className="group border border-sand rounded-2xl bg-white overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <summary className="p-6 font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center group-open:bg-slate-50 transition-colors">
                        {item.q}
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-open:rotate-180 transition-transform">
                          <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                        </div>
                      </summary>
                      <div className="p-6 border-t border-sand text-slate-600 leading-[1.7] bg-white">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* ─── SIDEBAR ─── */}
          <aside className="space-y-10">
            
            {/* CTA Sidebar Card */}
            <div className="bg-primary rounded-[32px] p-8 text-white shadow-2xl shadow-primary/30 sticky top-28">
              <h3 className="text-xl font-bold mb-4 leading-tight">Master this with Vidya AI</h3>
              <p className="text-emerald-50 text-sm leading-relaxed mb-8 font-medium">
                Our Socratic tutor "Adhyapak" won't just give you the answer. It will guide you to it.
              </p>
              <Link 
                href={`/?topic=${encodeURIComponent(topic.title)}`}
                className="w-full bg-white text-primary py-4 rounded-2xl font-bold text-sm block text-center hover:bg-emerald-50 transition-all active:scale-95"
              >
                Start Learning Session
              </Link>
              
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-emerald-200">
                  <Zap className="w-4 h-4" /> Available Modes
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-bold text-center">Summary</div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-bold text-center">Explain</div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-bold text-center">Recall</div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-bold text-center">Mock Test</div>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <SocialShare title={topic.title} slug={slug} />

            {/* Related Topics */}
            {relatedTopics.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Related in {topic.category}</h4>
                <div className="grid gap-3">
                  {relatedTopics.map((rel: any) => (
                    <Link 
                      key={rel.slug} 
                      href={`/learn/${rel.slug}`}
                      className="group p-4 rounded-2xl border border-sand bg-white hover:border-primary transition-all shadow-sm"
                    >
                      <p className="text-xs font-bold text-slate-400 mb-1">{rel.category}</p>
                      <h5 className="font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center justify-between">
                        {rel.title}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </h5>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand bg-white py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg mb-4">
            <GraduationCap className="w-5 h-5" />
            Vidya
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            The Academic Sanctuary for Deep Learning
          </p>
        </div>
      </footer>

      {/* FAQ Schema */}
      {aiData.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": aiData.faq.map((f: any) => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": f.a
                }
              }))
            })
          }}
        />
      )}
    </div>
  );
}
