"use client";

import React, { useState, useEffect } from "react";
import { X, Play, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdUnlockModalProps {
  featureName: string;
  onClose: () => void;
  onUnlock: () => void;
}

export function AdUnlockModal({ featureName, onClose, onUnlock }: AdUnlockModalProps) {
  const [status, setStatus] = useState<"ready" | "playing" | "completed">("ready");
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setStatus("completed");
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleStartAd = () => {
    setStatus("playing");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          {status === "ready" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Play className="h-8 w-8 fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Unlock {featureName}</h3>
                <p className="text-slate-500">Watch a 15-second educational partner clip to unlock this premium tool for free.</p>
              </div>
              <Button 
                onClick={handleStartAd}
                className="w-full rounded-2xl bg-emerald-600 py-6 text-lg font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              >
                Watch to Unlock
              </Button>
              <p className="text-xs text-slate-400">Your support helps keep Vidya free for students worldwide.</p>
            </div>
          )}

          {status === "playing" && (
            <div className="space-y-8 py-4 text-center">
              <div className="relative mx-auto h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-emerald-500 transition-all duration-1000 ease-linear"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (15 - timeLeft)) / 15}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-slate-900">
                  {timeLeft}s
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-widest">Ad Playing</span>
                </div>
                <p className="text-sm text-slate-500 italic">"Learning is the only thing the mind never exhausts..."</p>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-200">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">Success!</h3>
                <p className="text-slate-500">The <strong>{featureName}</strong> tool is now unlocked for this session.</p>
              </div>
              <Button 
                onClick={onUnlock}
                className="w-full rounded-2xl bg-slate-900 py-6 text-lg font-bold text-white hover:bg-slate-800 shadow-xl"
              >
                Access Now <Sparkles className="ml-2 h-5 w-5 text-emerald-400" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
