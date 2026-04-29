"use client";

import { useState, useEffect } from "react";
import { StudyMode } from "@/types";

const ROTATING_TITLES = [
  "Vidya is thinking...",
  "Gathering insights...",
  "Analyzing material...",
  "Building your sanctuary...",
  "Structuring concepts...",
  "Connecting the dots...",
  "Preparing deep dive...",
  "Refining the essence...",
];

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

interface LoadingScreenProps {
  mode: StudyMode;
}

export function LoadingScreen({ mode }: LoadingScreenProps) {
  const [index, setIndex] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Rotate messages every 4 seconds
    const interval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        setTitleIndex((prev) => (prev + 1) % ROTATING_TITLES.length);
        setOpacity(1);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-10 flex flex-col items-center gap-6 py-16 text-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/10 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/5" />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 transition-opacity duration-500" style={{ opacity }}>
        <h3 className="text-[22px] font-black tracking-tight text-[#064E3B]">
          {ROTATING_TITLES[titleIndex]}
        </h3>
        <p className="max-w-md text-[15px] font-medium leading-relaxed text-emerald-800/60">
          {ROTATING_MESSAGES[index]}
        </p>
      </div>
    </div>
  );
}
