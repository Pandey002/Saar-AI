"use client";

import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";

interface QuizProps {
  quiz: any[];
  topicTitle: string;
}

export function TopicQuiz({ quiz, topicTitle }: QuizProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const currentQ = quiz[0]; // For now, we just show the first question as a "teaser"

  return (
    <section className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
      
      <div className="relative z-10 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Active Recall Challenge</h2>
          <p className="text-slate-400 font-medium italic">Test your understanding before you leave.</p>
        </div>

        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="space-y-6">
            <p className="text-xl font-bold text-center leading-relaxed">
              {currentQ.question}
            </p>
            <div className="grid gap-3">
              {currentQ.options.map((opt: string, idx: number) => {
                const isCorrect = idx === currentQ.answerIndex;
                const isSelected = selectedIdx === idx;
                
                let btnClass = "border-white/10 bg-white/5 text-slate-300";
                if (isSelected) {
                  btnClass = isCorrect 
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" 
                    : "border-red-500 bg-red-500/20 text-red-400";
                }

                return (
                  <button 
                    key={idx} 
                    disabled={selectedIdx !== null}
                    onClick={() => {
                      setSelectedIdx(idx);
                      setShowExplanation(true);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all font-medium flex items-center justify-between group/opt ${btnClass} ${selectedIdx === null ? "hover:bg-white/10 hover:border-white/20 hover:text-white" : ""}`}
                  >
                    {opt}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? (isCorrect ? "bg-emerald-500 border-emerald-500" : "bg-red-500 border-red-500") : "border-white/20"}`}>
                      {isSelected && (isCorrect ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />)}
                    </div>
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="font-bold text-white mr-2">Explanation:</span>
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Want more questions?</p>
          <Link 
            href={`/?topic=${encodeURIComponent(topicTitle)}&mode=assignment`}
            className="inline-flex items-center gap-2 bg-primary px-8 py-4 rounded-2xl font-bold text-white hover:bg-emerald-400 transition-all shadow-xl shadow-primary/20"
          >
            Start Full Practice Exam <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
