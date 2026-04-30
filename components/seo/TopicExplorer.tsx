import Link from "next/link";
import topics from "@/data/seo/topics.json";
import { BookOpen, ChevronRight } from "lucide-react";

export function TopicExplorer() {
  // Group topics by category
  const categories = topics.reduce((acc: any, topic) => {
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {});

  return (
    <section className="py-16 bg-white border-t border-sand">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Explore Academic Topics</h2>
            <p className="text-slate-500">Deep-dives and AI-powered study guides.</p>
          </div>
          <Link href="/learn" className="text-primary font-semibold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(categories).map(([category, items]: [string, any]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                {category}
              </h3>
              <ul className="space-y-2">
                {items.slice(0, 5).map((topic: any) => (
                  <li key={topic.slug}>
                    <Link 
                      href={`/learn/${topic.slug}`}
                      className="text-slate-600 hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <BookOpen className="w-3 h-3 text-sand group-hover:text-primary" />
                      {topic.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
