"use client";

import React, { useState, useEffect } from "react";

const ROTATING_MESSAGES = [
  "Vidya is analyzing your material across all dimensions...",
  "Structuring the concepts into bite-sized pieces...",
  "Gathering exam-relevant insights and definitions...",
  "Optimizing the explanation for better retention...",
  "Almost there! Finalizing your structured study plan...",
  "Polishing the examples and analogies...",
  "Checking for conceptual depth and clarity...",
  "Fun Fact: The human brain can process images in as little as 13 milliseconds.",
  "Fun Fact: Writing by hand helps you learn and remember things better than typing.",
  "Did you know? Spaced repetition is one of the most effective ways to move info to long-term memory.",
  "Fun Fact: Your brain uses about 20% of your body's total energy despite being only 2% of its weight.",
  "Did you know? Teaching someone else what you've learned is one of the best ways to master a topic.",
  "Fun Fact: Goldfish actually have a memory span of up to 5 months, not 3 seconds!",
  "Did you know? A short 20-minute nap can significantly boost your focus and memory.",
];

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!isVisible) return;

    // Rotate messages every 4 seconds
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        setOpacity(1);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-xl transition-all duration-500 animate-in fade-in">
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(5,150,105,0.15)]">
        <div className="absolute inset-0 animate-ping rounded-[2.5rem] border-2 border-primary/20" />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-primary" />
      </div>
      
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <h3 className="text-[28px] font-extrabold tracking-tight text-navy">
          Please wait... Vidya is cooking for you
        </h3>
        <p className="max-w-md text-[16px] font-medium text-slate-500 transition-opacity duration-500" style={{ opacity }}>
          {ROTATING_MESSAGES[index]}
        </p>
      </div>
    </div>
  );
}
