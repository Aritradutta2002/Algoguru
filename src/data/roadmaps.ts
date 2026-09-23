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
    accent: "#F5A97F",
    branches: [
      { color: "#7BA7F8", label: "Fundamentals" },
      { color: "#C3A6F7", label: "OOP" },
      { color: "#A3D977", label: "Collections" },
      { color: "#F7A8C3", label: "Functional" },
      { color: "#E8D870", label: "JVM" },
      { color: "#8FD9F0", label: "Spring" },
    ],
  },
  dsa: {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Master the patterns that show up in every coding interview",
    accent: "#C3A6F7",
    branches: [
      { color: "#C3A6F7", label: "Linear" },
      { color: "#A3D977", label: "Trees" },
      { color: "#7BA7F8", label: "Graphs" },
      { color: "#E8D870", label: "Algorithmic" },
      { color: "#F7A8C3", label: "DP" },
      { color: "#5CD6C0", label: "Math" },
    ],
  },
  "system-design": {
    id: "system-design",
    title: "System Design",
    subtitle: "Fundamentals → scaling → classic design interviews",
    accent: "#7BA7F8",
    branches: [
      { color: "#7BA7F8", label: "Fundamentals" },
      { color: "#A3D977", label: "Scaling" },
      { color: "#E8D870", label: "Data" },
      { color: "#C3A6F7", label: "Distributed" },
      { color: "#F7A8C3", label: "Messaging" },
      { color: "#C3E88C", label: "Problems" },
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
