import { cn } from "@/lib/utils";
import type { StudyMode } from "@/types";

const tabs: Array<{ value: StudyMode; label: string }> = [
  { value: "summary", label: "Summary" },
  { value: "explain", label: "Explain" },
  { value: "assignment", label: "Practice" },
  { value: "mocktest", label: "Mock Test" },
  { value: "solve", label: "Solve" }
];

interface TabsProps {
  value: StudyMode;
  onChange: (value: StudyMode) => void;
}

export function Tabs({ value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-full border border-line bg-black/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full px-5 py-2 text-[14px] font-semibold transition",
            value === tab.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
