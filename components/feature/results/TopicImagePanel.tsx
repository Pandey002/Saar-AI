"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TopicImageData } from "@/types";

interface TopicImagePanelProps {
  query: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
  scrapbook?: boolean;
  onImageDataChange?: (imageData: TopicImageData | null) => void;
}

export function TopicImagePanel({
  query,
  title,
  subtitle,
  compact = false,
  scrapbook = false,
  onImageDataChange,
}: TopicImagePanelProps) {
  const [imageData, setImageData] = useState<TopicImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/topic-image?topic=${encodeURIComponent(query)}`);
        const payload = await response.json();

        if (!isMounted) {
          return;
        }

        setImageData(payload.data ?? null);
        onImageDataChange?.(payload.data ?? null);
      } catch {
        if (isMounted) {
          setImageData(null);
          onImageDataChange?.(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [onImageDataChange, query]);

  if (!imageData?.imageUrl) {
    if (scrapbook) return null;

    return (
      <div className={`overflow-hidden rounded-[24px] border border-slate-200 bg-white ${compact ? "" : "shadow-[0_12px_30px_rgba(15,23,42,0.05)]"}`}>
        <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%),#edf5ff] p-8 ${compact ? "min-h-[260px]" : "min-h-[320px]"}`}>
          <div className="max-w-lg text-center">
            <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {isLoading ? "Fetching a relevant reference image..." : "No relevant reference image was found for this topic yet."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (scrapbook) {
    return (
      <div className="my-8 overflow-hidden rounded-[8px] bg-white p-3 shadow-md ring-1 ring-slate-900/5 rotate-[-0.5deg] max-w-4xl mx-auto transition-transform hover:rotate-0 hover:shadow-lg duration-300">
        <div className="bg-slate-50/50 rounded-[4px] border border-slate-100 flex justify-center">
          <Image
            src={imageData.imageUrl}
            alt={imageData.title}
            width={1200}
            height={900}
            className="w-auto h-auto max-w-full max-h-[440px] object-contain rounded-[4px]"
            unoptimized
          />
        </div>
        <div className="px-3 pt-4 pb-2 text-center">
          <p className="font-serif text-[15px] leading-relaxed text-slate-700 italic">
            {subtitle || imageData.description || imageData.title}
          </p>
          <a
            href={imageData.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-primary transition"
          >
            Source
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[24px] border border-slate-200 bg-white ${compact ? "" : "shadow-[0_12px_30px_rgba(15,23,42,0.05)]"}`}>
      <Image
        src={imageData.imageUrl}
        alt={imageData.title}
        width={1200}
        height={900}
        className={`w-full object-cover ${compact ? "h-[260px]" : "h-[320px]"}`}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {subtitle || imageData.description}
            </p>
          </div>
          <a
            href={imageData.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="interactive-pop inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            View Source
          </a>
        </div>
      </div>
    </div>
  );
}
