import { Metadata } from "next";
import { Sprout, Sun, CloudRain, Droplets, Activity, Zap, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Climate Smart Agriculture Tool | Vidya Tools",
  description: "Precision agronomy decision support. Get AI-powered crop recommendations, irrigation plans, and risk analysis based on environmental telemetry.",
  keywords: ["climate smart agriculture", "AI farming", "crop recommendation", "irrigation plan", "agrotech", "precision farming"],
};

export default function ClimateAgriLanding() {
  return (
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/30">
              <Zap className="w-3 h-3" />
              Agri-Tech Edition
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              AI-Powered <span className="text-emerald-400">Climate Smart</span> Agriculture.
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              Optimize your yield with precision telemetry. Our AI analyzes temperature, rainfall, and soil moisture to provide actionable agronomic intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/tools/climate-agriculture/dashboard"
                className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                Launch Tool <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sprout, title: "Crop Recommendation", desc: "Predictive modeling for optimal crop selection based on climate vectors." },
              { icon: Droplets, title: "Irrigation Planning", desc: "Automated water usage indexing and frequency scheduling." },
              { icon: Activity, title: "Risk Analysis", desc: "Real-time assessment of drought, flood, and pest proliferation risks." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Data for Tools */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AI Climate Smart Agriculture Tool",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Precision agronomy decision support for climate-resilient farming.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
    </div>
  );
}
