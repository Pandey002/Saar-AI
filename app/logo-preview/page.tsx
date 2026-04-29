"use client";

import React from "react";
import { GrandLogo, Logo, VidyaWordmark } from "@/components/brand/Logo";

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 font-sans">
      <div className="mx-auto max-w-4xl space-y-16">
        <header className="space-y-4 border-b pb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Vidya Identity v3</h1>
          <p className="text-lg text-slate-500">A pure, minimalist text-only identity focused on clarity and authoritative learning.</p>
        </header>

        <section className="space-y-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Contextual Previews</h2>
          
          {/* Header Context */}
          <div className="rounded-3xl border border-white bg-white/50 p-8 shadow-sm backdrop-blur-md">
            <p className="mb-6 text-xs font-bold uppercase text-slate-400">Application Header</p>
            <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-xl shadow-slate-200/50">
              <GrandLogo />
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="h-8 w-24 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Dark Context */}
            <div className="rounded-3xl bg-[#064E3B] p-12 text-white shadow-2xl">
              <p className="mb-6 text-xs font-bold uppercase text-emerald-400">Hero / Splash Context</p>
              <div className="flex flex-col items-center gap-6">
                <VidyaWordmark className="text-5xl !text-white" withDot />
                <p className="text-center text-sm text-emerald-100/60">Empowering Minds with AI</p>
              </div>
            </div>

            {/* Scale Variations */}
            <div className="flex flex-col justify-center gap-10 rounded-3xl border border-slate-200 bg-white p-12">
              <p className="text-xs font-bold uppercase text-slate-400">Typography Scale</p>
              <div className="space-y-6">
                <VidyaWordmark className="text-lg" />
                <VidyaWordmark className="text-2xl" />
                <VidyaWordmark className="text-4xl" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-emerald-50 p-12 border border-emerald-100">
           <h3 className="text-xl font-bold text-emerald-900 mb-4">Design Rationale</h3>
           <ul className="space-y-3 text-emerald-800 text-sm leading-relaxed">
             <li>• <strong>Minimalism:</strong> Removing the icon allows the name itself to become the brand, ensuring maximum clarity.</li>
             <li>• <strong>Authoritative Type:</strong> The black-weight sans-serif represents stability and educational depth.</li>
             <li>• <strong>The Signature Dot:</strong> The emerald accent dot serves as a "single point of truth," anchoring the brand in a digital-first landscape.</li>
             <li>• <strong>Color Palette:</strong> Emerald represents growth, while the deep forest tones represent wisdom and heritage.</li>
           </ul>
        </section>
      </div>
    </div>
  );
}
