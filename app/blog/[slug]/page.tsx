import { notFound } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Calendar, User, Clock, Share2, BookOpen } from "lucide-react";
import posts from "@/data/blog/posts.json";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Vidya Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) notFound();

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
          
          <Link href="/blog" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <article className="max-w-3xl mx-auto">
          {/* Article Header */}
          <header className="space-y-8 mb-16 text-center">
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-primary uppercase tracking-widest">
              <span>{post.category}</span>
              <span className="w-1 h-1 rounded-full bg-sand" />
              <span>{post.date}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              {post.title}
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">
              {post.description}
            </p>
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-sand max-w-xs mx-auto">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {post.author[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">{post.author}</p>
                <p className="text-xs text-slate-400 font-medium">Author & Educator</p>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg prose-slate max-w-none 
            prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-slate-600 prose-p:leading-[1.8]
            prose-strong:text-slate-900 prose-strong:font-bold
            prose-code:bg-slate-100 prose-code:p-1 prose-code:rounded prose-code:text-primary
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-emerald-50 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
          </div>

          {/* Post Footer CTA */}
          <section className="mt-20 p-10 bg-slate-900 rounded-[40px] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 space-y-6 text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight">Want to study like this?</h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Turn your own notes, PDFs, or any topic into high-density summaries and interactive mock tests with Vidya AI.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 bg-primary px-10 py-5 rounded-2xl font-bold text-white hover:bg-emerald-400 transition-all shadow-xl shadow-primary/20"
              >
                Start Your First Session Free
              </Link>
            </div>
          </section>

          {/* Share & Breadcrumbs */}
          <footer className="mt-16 pt-8 border-t border-sand flex items-center justify-between">
            <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-slate-600">{post.category}</span>
            </div>
            <button className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80 transition-opacity">
              <Share2 className="w-4 h-4" /> Share Article
            </button>
          </footer>
        </article>
      </main>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "datePublished": post.date,
            "image": "https://vidyabot.in/og-image.png",
            "publisher": {
              "@type": "Organization",
              "name": "Vidya",
              "logo": {
                "@type": "ImageObject",
                "url": "https://vidyabot.in/logo.png"
              }
            }
          })
        }}
      />
    </div>
  );
}
