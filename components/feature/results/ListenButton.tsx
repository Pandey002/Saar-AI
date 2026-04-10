"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ListenButtonProps {
  text: string;
  className?: string;
}

export function ListenButton({ text, className }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const normalizedText = useMemo(() => text.replace(/\s+/g, " ").trim(), [text]);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis?.cancel();
  }, [isSupported, normalizedText]);

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((voice) => voice.lang === "en-IN") ||
      voices.find((voice) => voice.lang.startsWith("en-IN")) ||
      voices.find((voice) => voice.lang.startsWith("en")) ||
      null
    );
  }

  function handleToggle() {
    if (typeof window === "undefined" || !normalizedText) {
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    const preferredVoice = pickVoice();

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleStop() {
    if (typeof window === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button onClick={handleToggle} variant="secondary" className="rounded-2xl px-5 py-3">
        {isSpeaking && !isPaused ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
        {isSpeaking ? (isPaused ? "Resume" : "Pause") : "Listen"}
      </Button>
      {isSpeaking ? (
        <Button onClick={handleStop} variant="ghost" className="rounded-2xl px-4 py-3 text-slate-600">
          <Square className="mr-2 h-4 w-4" />
          Stop
        </Button>
      ) : null}
    </div>
  );
}
