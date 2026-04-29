"use client";

import { useState, useEffect } from "react";
import { StudyMode } from "@/types";

const LOADING_PHRASES = [
  "Vidya is analyzing your material across all dimensions...",
  "Structuring the concepts into bite-sized pieces...",
  "Gathering exam-relevant insights and definitions...",
  "Optimizing the explanation for better retention...",
  "Almost there! Finalizing your structured study plan...",
  "Polishing the examples and analogies...",
  "Checking for conceptual depth and clarity...",
];

const FUN_FACTS = [
  "Did you know? The human brain can process images in as little as 13 milliseconds.",
  "Fun Fact: Writing by hand helps you learn and remember things better than typing.",
  "Did you know? Spaced repetition is one of the most effective ways to move info to long-term memory.",
  "Fun Fact: Goldfish actually have a memory span of up to 5 months, not 3 seconds!",
  "Did you know? Teaching someone else what you've learned is one of the best ways to master a topic.",
  "Fun Fact: Your brain uses about 20% of your body's total energy despite being only 2% of its weight.",
  "Did you know? A short 20-minute nap can significantly boost your focus and memory.",
  "Fun Fact: The word 'school' comes from the Ancient Greek 'skhole', which originally meant 'leisure'.",
];

interface LoadingScreenProps {
  mode: StudyMode;
}

export function LoadingScreen({ mode }: LoadingScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Rotate phrases every 3.5 seconds
    const phraseInterval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
        setOpacity(1);
      }, 500);
    }, 3500);

    // Rotate facts every 6 seconds
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 6000);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(factInterval);
    };
  }, []);

  const modeText = mode === "summary" ? "summary" : mode === "explain" ? "explanation" : mode === "assignment" ? "practice assignment" : mode === "mocktest" ? "mock test" : mode === "solve" ? "solution" : "revision notes";

  return (
    <div className="mt-10 flex flex-col items-center gap-6 py-16 text-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/10 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/5" />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 transition-opacity duration-500" style={{ opacity }}>
        <h3 className="text-[17px] font-bold text-navy">
          Please wait... Vidya is cooking for you
        </h3>
        <p className="text-[14px] font-medium text-slate-500">
          {LOADING_PHRASES[phraseIndex]}
        </p>
        <p className="text-[12px] text-slate-400 italic">
          Preparing your {modeText}...
        </p>
      </div>

      <div className="mt-8 max-w-md rounded-2xl bg-[linear-gradient(135deg,#f8fbff_0%,#f0f7ff_100%)] p-6 shadow-sm border border-blue-100/50 animate-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-200">
            <span className="text-xs font-bold">!</span>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-600 transition-all duration-700">
            {FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
