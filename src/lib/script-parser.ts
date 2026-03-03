import dagre from 'dagre';
import { StoryNode, StoryEdge, StoryNodeData } from '../types';
import { Node } from '@xyflow/react';

export interface ParsedScript {
  nodes: StoryNode[];
  edges: StoryEdge[];
}

export function parseScript(script: string): ParsedScript {
  const nodes: StoryNode[] = [];
  const edges: StoryEdge[] = [];
  const lines = script.split('\n');
  
  let currentNode: Partial<Node<StoryNodeData>> | null = null;

  // Regex patterns
  // Matches: ## Title {#id} [START]
  const sceneHeaderRegex = /^##\s+(.+?)(?:\s+\{#([a-zA-Z0-9_-]+)\})?(?:\s+\[(START)\])?\s*$/;
  // Matches: - [Label] -> (target_id)
  const optionRegex = /^-\s+\[(.*?)\]\s+->\s+\(([a-zA-Z0-9_-]+)\)\s*$/;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const headerMatch = trimmedLine.match(sceneHeaderRegex);
    if (headerMatch) {
      if (currentNode) {
        nodes.push(currentNode as StoryNode);
      }

      const [_, title, id, startTag] = headerMatch;
      // If no ID provided, generate a random one but try to make it consistent if re-parsing same title?
      // For now, random is safer to avoid collisions unless title is unique.
      // Better: use title as base for ID if not provided? No, let's stick to random for robustness.
      const nodeId = id || crypto.randomUUID();
      
      currentNode = {
        id: nodeId,
        type: 'storyNode',
        data: {
          label: title,
          isStartNode: !!startTag,
          actions: [],
        },
        position: { x: 0, y: 0 },
      };
      return;
    }

    const optionMatch = trimmedLine.match(optionRegex);
    if (optionMatch && currentNode && currentNode.data) {
      const [_, label, targetId] = optionMatch;
      const actionId = crypto.randomUUID();
      
      // Add action to current node
      if (!currentNode.data.actions) {
        currentNode.data.actions = [];
      }
      
      currentNode.data.actions.push({
        id: actionId,
        label: label,
      });

      // Create edge
      edges.push({
        id: `e-${currentNode.id}-${targetId}-${actionId}`,
        source: currentNode.id!,
        target: targetId,
        sourceHandle: actionId,
        type: 'default',
        data: {
          targetTime: 0,
        },
      });
    }
  });

  // Push the last node
  if (currentNode) {
    nodes.push(currentNode as StoryNode);
  }

  // Second pass: Ensure all target nodes exist (create placeholders if missing)
  const existingNodeIds = new Set(nodes.map(n => n.id));
  const missingNodeIds = new Set<string>();

  edges.forEach(edge => {
    if (!existingNodeIds.has(edge.target)) {
      missingNodeIds.add(edge.target);
    }
  });

  missingNodeIds.forEach(id => {
    nodes.push({
      id,
      type: 'storyNode',
      data: {
        label: `Missing Node (${id})`,
        actions: [],
      },
      position: { x: 0, y: 0 },
    });
  });

  // Auto Layout using Dagre
  const layoutedElements = getLayoutedElements(nodes, edges);
  
  return layoutedElements;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 200;

function getLayoutedElements(nodes: StoryNode[], edges: StoryEdge[]): ParsedScript {
  dagreGraph.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
