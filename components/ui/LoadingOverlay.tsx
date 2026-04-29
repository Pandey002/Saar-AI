"use client";

import React, { useState, useEffect } from "react";

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

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!isVisible) return;

    // Rotate phrases every 3 seconds
    const phraseInterval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
        setOpacity(1);
      }, 500);
    }, 3000);

    // Rotate facts every 5.5 seconds
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 5500);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(factInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(5,150,105,0.15)]">
        <div className="absolute inset-0 animate-ping rounded-[2.5rem] border-2 border-primary/20" />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-primary" />
      </div>
      
      <div className="flex flex-col items-center gap-2 px-6 transition-opacity duration-500 text-center" style={{ opacity }}>
        <h3 className="text-[26px] font-extrabold tracking-tight text-navy">
          Please wait... Vidya is cooking for you
        </h3>
        <p className="max-w-md text-[15px] font-medium text-slate-500">
          {LOADING_PHRASES[phraseIndex]}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-400 italic">
          {message || "Preparing your personalized study experience..."}
        </p>
      </div>

      <div className="mt-12 max-w-sm rounded-[24px] bg-white/50 backdrop-blur-sm p-6 shadow-xl border border-white/40 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-emerald-200">
            <span className="text-sm font-bold">!</span>
          </div>
          <p className="text-center text-[14px] leading-relaxed text-slate-600 font-medium">
            {FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
