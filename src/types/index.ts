import { Node, Edge } from '@xyflow/react';

export interface Variable {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'string';
  defaultValue: any;
  isPersistent: boolean;
}

export interface Condition {
  variableId: string;
  operator: '==' | '>' | '<' | '>=' | '<=' | '!=';
  value: any;
}

export interface Mutation {
  variableId: string;
  operation: 'set' | 'add' | 'subtract';
  value: any;
}

export interface StoryAction {
  id: string;
  label: string;
  // Type of action: default (button) or auto (automatic transition)
  type?: 'default' | 'auto';
  style?: {
    color: string;
    textColor: string;
  };
  showCondition?: Condition;
  // Time display mode
  timeMode?: 'onEnd' | 'custom';
  // Time range in milliseconds (only used if timeMode is 'custom')
  startTime?: number;
  endTime?: number;
  // Position in percentage (x, y)
  position?: { x: number; y: number };
  // Target node ID to jump to if action is not clicked before endTime
  // Deprecated in favor of hasTimeout handle logic, but keeping for backward compatibility if needed
  timeoutNodeId?: string;
  // If true, shows a timeout handle for connecting to a fallback node
  hasTimeout?: boolean;
}

export interface StoryNodeData extends Record<string, unknown> {
  label: string;
  videoSrc?: string;
  isStartNode?: boolean;
  actions: StoryAction[];
}

export interface LogicBranch {
  id: string;
  label: string; // e.g. "x > 5" or "Else"
  condition?: Condition; // If undefined, it's an "Else" branch
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  branches: LogicBranch[];
  // Mutations to apply BEFORE evaluating branches (e.g. increment counter)
  mutations?: Mutation[];
}

export type StoryNode = Node<StoryNodeData | ConditionNodeData>;

export interface ConnectionData extends Record<string, unknown> {
  targetTime: number;
  conditions?: Condition[];
  mutations?: Mutation[];
}

export type StoryEdge = Edge<ConnectionData>;
