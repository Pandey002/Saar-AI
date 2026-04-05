import { Download, Printer, Sparkles } from "lucide-react";
import type { MarkingSchemeItem } from "@/types";

interface SidebarPanelProps {
  title: string;
  subtitle: string;
  items: MarkingSchemeItem[];
  onPrint: () => void;
  onExport: () => void;
}

export function SidebarPanel({ title, subtitle, items, onPrint, onExport }: SidebarPanelProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Live Breakdown</p>
        <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={`${item.label}-${item.value}`} className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3">
              <span className="text-sm font-medium text-slate-600">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</p>
        <div className="mt-4 grid gap-3">
          <button onClick={onPrint} type="button" className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)] transition hover:bg-blue-700">
            <Printer className="h-4 w-4" />
            Print Assignment
          </button>
          <button onClick={onExport} type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-primary" />
              PDF-friendly layout
            </div>
            <p className="mt-2">Use the export action to save the exact assignment layout with sections, cards, and headings.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
