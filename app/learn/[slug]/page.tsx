import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createChatCompletion } from "@/lib/ai/client";
import { GraduationCap, ArrowLeft, BookOpen, Lightbulb, CheckCircle2, ChevronRight, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import topics from "@/data/seo/topics.json";
import { SocialShare } from "@/components/seo/SocialShare";
import { TopicQuiz } from "@/components/seo/TopicQuiz";

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
    
    // Using "force-cache" for SEO pages so they are pre-rendered and persistent
    const result = await createChatCompletion(prompt, 3500, "force-cache");
    aiData = JSON.parse(result.content);
  } catch (error) {
    console.error("AI Generation failed for topic:", slug, error);
    aiData = {
      summary: `## ${topic.title}\n\n${topic.description}\n\nOur AI is currently refining the deep-dive content for this topic. Please check back shortly for full interactive summaries, recall points, and quizzes.`,
      keyTakeaways: ["Core conceptual understanding", "Practical applications", "Exam-specific insights"],
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
            <TopicQuiz quiz={aiData.quiz} topicTitle={topic.title} />

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
