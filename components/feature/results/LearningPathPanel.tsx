"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, GitBranchPlus, LoaderCircle, Route, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ConceptDependencyGraphResult } from "@/types";

const DynamicConceptDependencyGraph = dynamic(
  () =>
    import("@/components/feature/results/ConceptDependencyGraph").then((module) => ({
      default: module.ConceptDependencyGraph,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-[28px] border border-line bg-[#F6F3E6] text-sm text-ink">
        Loading learning graph...
      </div>
    ),
  }
);

interface LearningPathPanelProps {
  topic: string;
  onRequestGraph: (topic: string) => Promise<ConceptDependencyGraphResult>;
  onLoadTopic: (topic: string) => void;
  onStartStudyPath: (steps: string[]) => void;
}

export function LearningPathPanel({
  topic,
  onRequestGraph,
  onLoadTopic,
  onStartStudyPath,
}: LearningPathPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [graph, setGraph] = useState<ConceptDependencyGraphResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [collapsedLevels, setCollapsedLevels] = useState({
    prerequisite: false,
    advanced: false,
  });

  async function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    if (graph || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setGraph(await onRequestGraph(topic));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the learning path right now.");
    } finally {
      setIsLoading(false);
    }
  }

  const studyPath = useMemo(() => graph?.studyPath ?? [], [graph?.studyPath]);

  return (
    <section className="rounded-[32px] border border-line bg-[#F6F3E6] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Intelligent Learning Guide</p>
          <h2 className="mt-3 font-serif text-[34px] tracking-[-0.04em] text-slate-950">Concept Dependency Graph</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            See what to study before <strong>{topic}</strong>, what can come next, and the best order to build understanding.
          </p>
        </div>
        <Button
          variant={isOpen ? "secondary" : "primary"}
          onClick={() => void handleToggle()}
          className="rounded-2xl px-5 py-3"
        >
          {isOpen ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
          {isOpen ? "Hide Learning Path" : "View Learning Path"}
        </Button>
      </div>

      {isOpen ? (
        <div className="mt-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-[24px] border border-line bg-[#F6F3E6] px-4 py-4 text-sm text-ink">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              Vidya is mapping the concepts you should learn first.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[24px] border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {graph ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <DynamicConceptDependencyGraph
                  graph={graph}
                  collapsedLevels={collapsedLevels}
                  onTopicSelect={onLoadTopic}
                />

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-slate-900">Recommended study path</p>
                    </div>
                    <ol className="mt-4 space-y-3">
                      {studyPath.map((step, index) => (
                        <li key={`${step}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {index + 1}
                          </span>
                          <button type="button" onClick={() => onLoadTopic(step)} className="text-left transition hover:text-primary">
                            {step}
                          </button>
                        </li>
                      ))}
                    </ol>
                    <Button
                      onClick={() => onStartStudyPath(studyPath)}
                      className="mt-5 w-full rounded-2xl py-3"
                      disabled={studyPath.length === 0}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start from Basics
                    </Button>
                  </div>

                  <div className="rounded-[24px] border border-line bg-[#F6F3E6] p-5">
                    <div className="flex items-center gap-2">
                      <GitBranchPlus className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-slate-900">Graph controls</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ToggleChip
                        active={!collapsedLevels.prerequisite}
                        label={`${graph.prerequisites.length} prerequisites`}
                        onClick={() =>
                          setCollapsedLevels((current) => ({
                            ...current,
                            prerequisite: !current.prerequisite,
                          }))
                        }
                      />
                      <ToggleChip
                        active={!collapsedLevels.advanced}
                        label={`${graph.advanced.length} advanced topics`}
                        onClick={() =>
                          setCollapsedLevels((current) => ({
                            ...current,
                            advanced: !current.advanced,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-line bg-[#F6F3E6] text-muted"
      }`}
    >
      {active ? "Shown" : "Hidden"} · {label}
    </button>
  );
}
