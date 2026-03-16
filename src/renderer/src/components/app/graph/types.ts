import type { InvestigationDocumentKind } from "../../../../../shared/workspace-investigation"

export type GraphNodeType =
  | "person"
  | "group"
  | "place"
  | "timeline"
  | "lead"
  | "source"
  | "allegation"
  | "finding"

export type GraphNode = {
  id: string
  label: string
  type: GraphNodeType
  relativePath: string
  mentionCount: number
  degree: number
  documentKind?: InvestigationDocumentKind
}

export type GraphEdgeReason =
  | "wikilink"
  | "evidence"
  | "allegationFinding"
  | "findingAllegation"
  | "leadReference"

export type GraphEdge = {
  id: string
  source: string
  target: string
  reason: GraphEdgeReason
}

export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  neighborsByNodeId: Map<string, Set<string>>
  nodeById: Map<string, GraphNode>
}

export type GraphBuildCache = {
  outgoingByDocumentId: Map<string, { updatedAt: string; outgoing: string[] }>
}
