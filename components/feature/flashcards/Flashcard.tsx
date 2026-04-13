import { useState, useRef, useEffect } from "react";
import { 
  Lightbulb, 
  Sigma, 
  FlaskConical, 
  BookOpen, 
  Calendar,
  HelpCircle,
  RotateCw,
  Eye,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/feature/results/MathText";
import type { FlashcardCard, FlashcardType } from "@/types";

interface FlashcardProps {
  card: FlashcardCard;
  index?: number;
  total?: number;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  className?: string;
  showHint?: boolean;
  // New props for editing
  isEditing?: boolean;
  onUpdate?: (patch: Partial<FlashcardCard>) => void;
  flexible?: boolean;
}

const suitIcons: Record<FlashcardType | "unknown", any> = {
  concept: Lightbulb,
  formula: Sigma,
  process: FlaskConical,
  definition: BookOpen,
  date: Calendar,
  unknown: HelpCircle,
};

const suitColors: Record<FlashcardType | "unknown", string> = {
  concept: "text-amber-500 bg-amber-50 border-amber-100",
  formula: "text-blue-500 bg-blue-50 border-blue-100",
  process: "text-emerald-500 bg-emerald-50 border-emerald-100",
  definition: "text-indigo-500 bg-indigo-50 border-indigo-100",
  date: "text-rose-500 bg-rose-50 border-rose-100",
  unknown: "text-slate-500 bg-slate-50 border-slate-100",
};

export function Flashcard({
  card,
  index,
  total,
  isFlipped: controlledFlipped,
  onFlip,
  className,
  showHint,
  isEditing,
  onUpdate,
  flexible = false,
}: FlashcardProps) {
  const [localFlipped, setLocalFlipped] = useState(false);
  // Default to preview mode if editing so the whole card is clickable to flip.
  const [isPreviewMode, setIsPreviewMode] = useState(isEditing ? true : false);
  
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : localFlipped;
  const Icon = suitIcons[card.type] || suitIcons.unknown;
  const colorClass = suitColors[card.type] || suitColors.unknown;

  const handleFlip = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('textarea, button')) return;
    
    e.stopPropagation();
    const nextFlipped = !isFlipped;
    if (onFlip) {
      onFlip(nextFlipped);
    } else {
      setLocalFlipped(nextFlipped);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
      setIsPreviewMode(!isPreviewMode);
    }
  };

  const handleTextChange = (field: 'front' | 'back', value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return (
    <div 
      className={cn(
        "perspective-1000 group relative transition-all duration-500 mx-auto",
        flexible ? "min-h-[460px] max-w-[420px]" : "h-[280px] sm:h-[320px]",
        "w-full min-w-[320px]",
        className
      )}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={cn(
          "preserve-3d relative h-full w-full cursor-pointer duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transition-transform",
          isFlipped && "rotate-y-180"
        )}
        onClick={handleFlip}
      >
        {/* Sizer ensures the card grows based on content */}
        <div 
          className={cn(
            "invisible pointer-events-none p-10 sm:p-12 text-center text-2xl sm:text-3xl",
            flexible ? "relative min-h-[460px]" : "hidden"
          )}
          aria-hidden="true"
        >
          <div className="whitespace-pre-wrap">{card.front.length > card.back.length ? card.front : card.back}</div>
          <div className="h-24" />
        </div>

        {/* Front Face */}
        <div 
          className={cn(
            "absolute inset-0 flex flex-col overflow-hidden transition-all duration-500 bg-white border-2 border-slate-100 shadow-sm",
            flexible ? "rounded-[40px] sm:rounded-[48px] p-8 sm:p-12 overflow-y-auto scrollbar-hide" : "rounded-[28px] sm:rounded-[32px] p-5 sm:p-6",
            isFlipped ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible z-10"
          )}
          style={{ 
            transform: 'translateZ(1px)'
          }}
        >
          {/* Card Decoration */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-50 opacity-50 blur-2xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center justify-center border transition-transform group-hover:scale-110", 
                 flexible ? "h-10 w-10 rounded-2xl" : "h-8 w-8 rounded-xl", colorClass)}>
                <Icon className={cn(flexible ? "h-5 w-5" : "h-4 w-4")} />
              </div>
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {index !== undefined ? `#${index + 1}` : "Card"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPreviewMode(!isPreviewMode); }}
                  className={cn(
                    "rounded-full p-2.5 transition-colors flex items-center gap-2",
                    !isPreviewMode ? "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90" : "bg-slate-100 text-slate-500 hover:text-primary hover:bg-slate-200"
                  )}
                  title={isPreviewMode ? "Double-click card to edit" : "Click to save"}
                >
                  {isPreviewMode ? <Type className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {!isPreviewMode && <span className="text-[10px] font-bold tracking-wider pr-1">EDITING</span>}
                </button>
              )}
              {isPreviewMode && (
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {card.type}
                </div>
              )}
            </div>
          </div>

          <div className={cn("relative z-10 flex flex-1 flex-col items-center justify-center text-center", flexible ? "py-6" : "py-2")}>
            {isEditing && !isPreviewMode ? (
              <AutoExpandingTextarea
                value={card.front}
                onChange={(v) => handleTextChange('front', v)}
                placeholder="Enter question..."
                className={cn(
                  "font-bold tracking-tight text-slate-900 border-b-2 border-primary/20 pb-2 focus:border-primary",
                  flexible ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
                )}
              />
            ) : (
              <div className="study-prose w-full overflow-hidden px-2">
                <MathText 
                  text={card.front} 
                  className={cn(
                    "font-bold tracking-tight text-slate-900 drop-shadow-sm",
                    flexible ? "text-2xl sm:text-3xl" : "text-base sm:text-lg line-clamp-3"
                  )} 
                />
              </div>
            )}
          </div>

          {!isEditing || isPreviewMode ? (
            <div className="relative z-10 flex justify-center">
              {showHint && !isFlipped ? (
                <div className="flex animate-bounce items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-[11px] font-bold text-primary">
                  <RotateCw className="h-3 w-3" />
                  Tap to reveal
                </div>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                  Click to flip {isEditing && "• Dbl-click to edit"}
                </span>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex justify-center h-[18px]">
              {/* Spacer so it doesn't jump */}
            </div>
          )}
        </div>

        {/* Back Face */}
        <div 
          className={cn(
            "absolute inset-0 flex flex-col overflow-hidden transition-all duration-500 bg-white border-2 border-primary/20 shadow-inner",
            flexible ? "rounded-[40px] sm:rounded-[48px] p-8 sm:p-12 overflow-y-auto scrollbar-hide" : "rounded-[28px] sm:rounded-[32px] p-5 sm:p-6",
            isFlipped ? "opacity-100 visible z-20" : "opacity-0 invisible pointer-events-none"
          )}
          style={{ 
            transform: 'rotateY(180deg) translateZ(1px)'
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.02),transparent)]" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl opacity-30" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center justify-center border", 
                 flexible ? "h-10 w-10 rounded-2xl" : "h-8 w-8 rounded-xl", colorClass)}>
                <Icon className={cn(flexible ? "h-5 w-5" : "h-4 w-4")} />
              </div>
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary/40">
                Solution
              </span>
            </div>
          </div>

          <div className={cn("relative z-10 flex flex-1 flex-col items-center justify-center text-center", flexible ? "px-2 py-8" : "px-1 py-2")}>
            {isEditing && !isPreviewMode ? (
              <AutoExpandingTextarea
                value={card.back}
                onChange={(v) => handleTextChange('back', v)}
                placeholder="Enter answer..."
                className={cn(
                   "leading-relaxed text-slate-700 border-b-2 border-primary/20 pb-2 focus:border-primary",
                   flexible ? "text-xl sm:text-2xl" : "text-sm sm:text-base"
                )}
              />
            ) : (
              <div className="study-prose w-full">
                <MathText 
                  text={card.back} 
                  className={cn(
                    "leading-relaxed text-slate-700",
                    flexible ? "text-xl sm:text-2xl" : "text-sm sm:text-base line-clamp-4",
                    card.type === "formula" && "font-mono font-semibold"
                  )} 
                />
              </div>
            )}
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="h-1 w-12 rounded-full bg-primary/10" />
             <span className="text-[9px] font-bold uppercase tracking-widest text-primary/30">
                Tap to flip {isEditing && "• Dbl-click to edit"}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoExpandingTextarea({ 
  value, 
  onChange, 
  placeholder, 
  className 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent text-center outline-none ring-0 focus:ring-0",
        "resize-none overflow-hidden scrollbar-hide",
        className
      )}
      rows={1}
    />
  );
}
