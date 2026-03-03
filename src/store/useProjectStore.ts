import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import { StoryNode, StoryEdge, Variable } from '../types';

interface ProjectState {
  nodes: StoryNode[];
  edges: StoryEdge[];
  variables: Variable[];

  onNodesChange: OnNodesChange<StoryNode>;
  onEdgesChange: OnEdgesChange<StoryEdge>;
  onConnect: OnConnect;

  addNode: (node: StoryNode) => void;
  updateNode: (id: string, data: Partial<StoryNode>) => void;
  deleteNode: (id: string) => void;

  updateEdge: (id: string, updates: Partial<StoryEdge>) => void;
  deleteEdge: (id: string) => void;

  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  removeVariable: (id: string) => void;

  setProject: (nodes: StoryNode[], edges: StoryEdge[]) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  nodes: [],
  edges: [],
  variables: [],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as StoryNode[],
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as StoryEdge[],
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges) as StoryEdge[],
    });
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNode: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, ...data } : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    });
  },

  updateEdge: (id, updates) => {
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  },

  deleteEdge: (id) => {
    set({ edges: get().edges.filter((e) => e.id !== id) });
  },

  addVariable: (variable) => {
    set({ variables: [...get().variables, variable] });
  },

  updateVariable: (id, updates) => {
    set({
      variables: get().variables.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    });
  },

  removeVariable: (id) => {
    set({ variables: get().variables.filter((v) => v.id !== id) });
  },

  setProject: (nodes, edges) => {
    set({ nodes, edges });
  },
}));
