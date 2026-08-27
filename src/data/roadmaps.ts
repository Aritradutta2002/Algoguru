export type RoadmapId = "java" | "dsa" | "system-design";

export interface RoadmapBranch {
  color: string;
  label: string;
}

/**
 * Hub-facing metadata for the three roadmaps. The hub renders the cards
 * from this, while the actual graph data lives in
 * `src/data/{dsa,java,systemDesign}Roadmap.ts` (graph-shaped, see
 * `src/types/roadmapGraph.ts`).
 */
export interface RoadmapMeta {
  id: RoadmapId;
  title: string;
  subtitle: string;
  accent: string;
  /** Subset of category labels shown as swatches on the hub card. */
  branches: RoadmapBranch[];
}

export const roadmaps: Record<RoadmapId, RoadmapMeta> = {
  java: {
    id: "java",
    title: "Java Roadmap",
    subtitle: "Core Java → Advanced Java → Spring → Microservices",
    accent: "#F59E0B",
    branches: [
      { color: "#3B82F6", label: "Fundamentals" },
      { color: "#A855F7", label: "OOP" },
      { color: "#10B981", label: "Collections" },
      { color: "#EC4899", label: "Functional" },
      { color: "#F59E0B", label: "JVM" },
      { color: "#22C55E", label: "Spring" },
    ],
  },
  dsa: {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Master the patterns that show up in every coding interview",
    accent: "#A855F7",
    branches: [
      { color: "#7C3AED", label: "Linear" },
      { color: "#10B981", label: "Trees" },
      { color: "#3B82F6", label: "Graphs" },
      { color: "#F59E0B", label: "Algorithmic" },
      { color: "#EC4899", label: "DP" },
      { color: "#06B6D4", label: "Math" },
    ],
  },
  "system-design": {
    id: "system-design",
    title: "System Design",
    subtitle: "Fundamentals → scaling → classic design interviews",
    accent: "#3B82F6",
    branches: [
      { color: "#3B82F6", label: "Fundamentals" },
      { color: "#10B981", label: "Scaling" },
      { color: "#F59E0B", label: "Data" },
      { color: "#A855F7", label: "Distributed" },
      { color: "#EC4899", label: "Messaging" },
      { color: "#EAB308", label: "Problems" },
    ],
  },
};

export const roadmapList: RoadmapMeta[] = [
  roadmaps.dsa,
  roadmaps.java,
  roadmaps["system-design"],
];

export function getRoadmap(id: string | undefined): RoadmapMeta | null {
  if (!id) return null;
  return (roadmaps as Record<string, RoadmapMeta>)[id] ?? null;
}
