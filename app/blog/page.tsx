import Link from "next/link";
import { GraduationCap, ArrowRight, Calendar, User, Clock } from "lucide-react";
import posts from "@/data/blog/posts.json";

export const metadata = {
  title: "Blog | Study Tips & AI Insights for JEE/NEET Students",
  description: "Expert advice on mastering competitive exams using AI, active recall, and smart study habits.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F2] selection:bg-primary/20 font-sans text-slate-900">
      {/* ─── HEADER ─── */}
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
            <Link href="/learn" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">Topic Hub</Link>
          </nav>

          <Link href="/" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary transition-all active:scale-95 shadow-lg shadow-slate-200">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest border border-primary/20">
              The Vidya Journal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Study Smarter, <br className="hidden md:block" /> Not Harder.
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed font-medium">
              Insights from top educators on using AI to master JEE, NEET, and Board exams.
            </p>
          </div>

          {/* Featured Post (Latest) */}
          <div className="relative group">
            <Link href={`/blog/${posts[0].slug}`} className="block">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-[40px] p-8 border border-sand shadow-sm group-hover:shadow-xl transition-all group-hover:-translate-y-1 duration-500">
                <div className="aspect-[16/10] bg-slate-100 rounded-[32px] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-emerald-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg opacity-20 uppercase tracking-[0.4em]">Featured Insight</span>
                  </div>
                </div>
                <div className="space-y-6 lg:p-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-primary uppercase tracking-widest">
                    <span>{posts[0].category}</span>
                    <span className="w-1 h-1 rounded-full bg-sand" />
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 min read</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                    {posts[0].title}
                  </h2>
                  <p className="text-slate-500 line-clamp-3 leading-relaxed text-lg font-medium">
                    {posts[0].description}
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold border border-sand">
                      {posts[0].author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{posts[0].author}</p>
                      <p className="text-xs text-slate-400 font-medium">{posts[0].date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.slice(1).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <div className="bg-white rounded-[32px] p-6 border border-sand shadow-sm hover:shadow-lg transition-all h-full flex flex-col group-hover:-translate-y-1">
                  <div className="aspect-video bg-slate-50 rounded-[24px] mb-6 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-primary/5" />
                  </div>
                  <div className="space-y-4 flex-grow">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="text-primary">{post.category}</span>
                      <span className="w-1 h-1 rounded-full bg-sand" />
                      <span>{post.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-sand flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">By {post.author}</span>
                    <span className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read More <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand bg-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg mb-4">
            <GraduationCap className="w-5 h-5" />
            Vidya
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            Empowering students with AI-driven focus.
          </p>
        </div>
      </footer>
    </div>
  );
}
