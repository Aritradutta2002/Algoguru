import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  level: number;
  color: string;
  children?: GraphNode[];
  collapsed?: boolean;
  _children?: GraphNode[];
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  color: string;
}
