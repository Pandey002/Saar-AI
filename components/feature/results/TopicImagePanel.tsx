"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TopicImageData } from "@/types";

interface TopicImagePanelProps {
  query: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
  onImageDataChange?: (imageData: TopicImageData | null) => void;
}

export function TopicImagePanel({
  query,
  title,
  subtitle,
  compact = false,
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

  return (
        <div className={`overflow-hidden rounded-[24px] border border-slate-200 bg-white ${compact ? "" : "shadow-[0_12px_30px_rgba(15,23,42,0.05)]"}`}>
      {imageData?.imageUrl ? (
        <>
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
        </>
      ) : (
        <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%),#edf5ff] p-8 ${compact ? "min-h-[260px]" : "min-h-[320px]"}`}>
          <div className="max-w-lg text-center">
            <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {isLoading ? "Fetching a relevant reference image..." : "No relevant reference image was found for this topic yet."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
