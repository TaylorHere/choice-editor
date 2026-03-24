import { StoryEdge, StoryNode, Variable } from '../types';

export const CHOICE_EXPORT_SCHEMA_VERSION = '1.0.0';
export const CHOICE_EXPORT_STORY_FILE = 'story.json';
export const CHOICE_EXPORT_MANIFEST_FILE = 'choice.manifest.json';

export interface ChoiceStoryExport {
  schemaVersion: string;
  project: {
    nodes: StoryNode[];
    edges: StoryEdge[];
    variables: Variable[];
  };
}

export interface ChoiceExportManifest {
  schemaVersion: string;
  entry: string;
  generatedAt: string;
  app: {
    name: string;
    shortName: string;
    themeColor: string;
    backgroundColor: string;
    display: 'standalone';
    orientation: 'portrait';
  };
}

export interface ParsedProjectData {
  nodes: StoryNode[];
  edges: StoryEdge[];
  variables: Variable[];
}

export function buildStoryExport(
  nodes: StoryNode[],
  edges: StoryEdge[],
  variables: Variable[]
): ChoiceStoryExport {
  return {
    schemaVersion: CHOICE_EXPORT_SCHEMA_VERSION,
    project: {
      nodes,
      edges,
      variables,
    },
  };
}

export function buildExportManifest(
  appName = 'Choice Story',
  shortName = 'Choice'
): ChoiceExportManifest {
  return {
    schemaVersion: CHOICE_EXPORT_SCHEMA_VERSION,
    entry: CHOICE_EXPORT_STORY_FILE,
    generatedAt: new Date().toISOString(),
    app: {
      name: appName,
      shortName,
      themeColor: '#0f172a',
      backgroundColor: '#000000',
      display: 'standalone',
      orientation: 'portrait',
    },
  };
}

export function parseProjectData(raw: unknown): ParsedProjectData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project file: expected JSON object');
  }

  const data = raw as Record<string, unknown>;
  const candidateProject = isObject(data.project) ? data.project : data;

  const nodes = Array.isArray((candidateProject as Record<string, unknown>).nodes)
    ? ((candidateProject as Record<string, unknown>).nodes as StoryNode[])
    : [];
  const edges = Array.isArray((candidateProject as Record<string, unknown>).edges)
    ? ((candidateProject as Record<string, unknown>).edges as StoryEdge[])
    : [];
  const variables = Array.isArray((candidateProject as Record<string, unknown>).variables)
    ? ((candidateProject as Record<string, unknown>).variables as Variable[])
    : [];

  return { nodes, edges, variables };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
