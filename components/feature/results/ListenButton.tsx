"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ListenButtonProps {
  text: string;
  language?: string; // "English" | "Hinglish" | ...
  className?: string;
}

export function ListenButton({ text, language, className }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  
  const normalizedText = useMemo(() => text.replace(/\s+/g, " ").trim(), [text]);
  
  const chunks = useMemo(() => {
    const textChunks = normalizedText.match(/[^.!?]+[.!?]+(?=\s|$)|.{1,200}(?=\s|$)|.{1,200}/g) || [normalizedText];
    return textChunks.map(c => c.trim()).filter(Boolean);
  }, [normalizedText]);

  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

  useEffect(() => {
    if (!isSupported) return;

    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  function pickVoice() {
    const isHinglish = language?.toLowerCase().includes("hinglish");

    if (isHinglish) {
      return (
        voices.find((v) => v.lang === "en-IN" && (v.name.includes("Google") || v.name.includes("Natural"))) ||
        voices.find((v) => v.lang === "en-IN") ||
        voices.find((v) => v.lang.startsWith("hi-IN")) ||
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        null
      );
    }

    return (
      voices.find((v) => v.lang.startsWith("en-US") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
      voices.find((v) => v.lang.startsWith("en-GB") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }

  function speakChunk(index: number) {
    if (index >= chunks.length || !isSpeakingRef.current) {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setChunkIndex(0);
      }
      return;
    }

    try {
      const textToSpeak = chunks[index]?.trim();
      if (!textToSpeak) {
        setChunkIndex(index + 1);
        speakChunk(index + 1);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const preferredVoice = pickVoice();

      utterance.lang = language?.toLowerCase().includes("hinglish") ? "en-IN" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0; 
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        if (!isSpeakingRef.current) return;
        setChunkIndex(index + 1);
        speakChunk(index + 1);
      };

      utterance.onerror = (event) => {
        if (event.error === "interrupted" || event.error === "canceled") return;
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }

  function handleToggle() {
    if (!isSupported || !chunks.length) return;

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
    
    setTimeout(() => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setIsPaused(false);
      setChunkIndex(0);
      speakChunk(0);
    }, 100);
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsPaused(false);
    setChunkIndex(0);
  }

  if (!isSupported) return null;

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button 
        id="tts-listen-button"
        onClick={handleToggle} 
        className="rounded-2xl border border-primary bg-primary/10 px-5 py-3 font-bold text-primary shadow-sm transition hover:bg-primary/20"
      >
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
