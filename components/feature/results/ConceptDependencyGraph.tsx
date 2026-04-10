"use client";

import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import dagre from "dagre";
import type { ConceptDependencyGraphResult, ConceptGraphNode } from "@/types";

interface ConceptDependencyGraphProps {
  graph: ConceptDependencyGraphResult;
  collapsedLevels: {
    prerequisite: boolean;
    advanced: boolean;
  };
  onTopicSelect: (topic: string) => void;
}

const CARD_WIDTH = 224;
const CARD_HEIGHT = 102;

export function ConceptDependencyGraph({
  graph,
  collapsedLevels,
  onTopicSelect,
}: ConceptDependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const visibleNodes = graph.nodes.filter((node) => {
      if (node.level === "prerequisite") return !collapsedLevels.prerequisite;
      if (node.level === "advanced") return !collapsedLevels.advanced;
      return true;
    });
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const visibleEdges = graph.edges.filter(
      (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );

    return layoutGraph(visibleNodes, visibleEdges, onTopicSelect);
  }, [collapsedLevels.advanced, collapsedLevels.prerequisite, graph.edges, graph.nodes, onTopicSelect]);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <ReactFlow
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={20} size={1} color="#dbeafe" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

const nodeTypes = {
  concept: memo(function ConceptNode({ data }: NodeProps) {
    const typedData = data as NodeData;
    const node = typedData.node;
    const palette =
      node.level === "core"
        ? "border-primary bg-blue-600 text-white shadow-[0_24px_50px_rgba(37,99,235,0.28)]"
        : node.level === "advanced"
          ? "border-emerald-200 bg-emerald-50 text-slate-900"
          : "border-amber-200 bg-amber-50 text-slate-900";

    return (
      <div
        title={node.description}
        className={`w-56 rounded-[24px] border px-4 py-4 text-left transition ${palette}`}
      >
        <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-primary/40" />
        <button type="button" onClick={() => typedData.onOpen(node.title)} className="w-full text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
            {node.level === "core" ? "Current Topic" : node.level}
          </p>
          <p className="mt-2 text-base font-semibold leading-6">{node.title}</p>
          <p className={`mt-2 text-sm leading-5 ${node.level === "core" ? "text-white/80" : "text-slate-600"}`}>
            {node.description}
          </p>
        </button>
        <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-0 !bg-primary/40" />
      </div>
    );
  }),
};

interface NodeData {
  node: ConceptGraphNode;
  onOpen: (topic: string) => void;
  [key: string]: unknown;
}

function layoutGraph(
  graphNodes: ConceptGraphNode[],
  graphEdges: ConceptDependencyGraphResult["edges"],
  onTopicSelect: (topic: string) => void
): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "LR",
    nodesep: 32,
    ranksep: 92,
    marginx: 24,
    marginy: 24,
  });

  graphNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: CARD_WIDTH, height: CARD_HEIGHT });
  });

  graphEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: graphNodes.map((node) => {
      const position = dagreGraph.node(node.id);

      return {
        id: node.id,
        type: "concept",
        position: {
          x: position.x - CARD_WIDTH / 2,
          y: position.y - CARD_HEIGHT / 2,
        },
        data: {
          node,
          onOpen: onTopicSelect,
        } satisfies NodeData,
      };
    }),
    edges: graphEdges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#2563eb",
      },
      style: {
        stroke: "#2563eb",
        strokeWidth: 1.8,
      },
    })),
  };
}
