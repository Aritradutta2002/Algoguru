import type { RoadmapId } from "@/data/roadmaps";
import type { Roadmap } from "@/types/roadmapGraph";
import { dsaRoadmap } from "./dsaRoadmap";
import { javaRoadmap } from "./javaRoadmap";
import { systemDesignRoadmap } from "./systemDesignRoadmap";

/**
 * Graph-shaped roadmap data, indexed by the same id the existing hub uses.
 * The RoadmapEngine consumes a single `Roadmap` value; this index lets the
 * `RoadmapPage` pick the right one based on the URL param.
 */
export const ROADMAP_DATA: Record<RoadmapId, Roadmap> = {
  dsa: dsaRoadmap,
  java: javaRoadmap,
  "system-design": systemDesignRoadmap,
};

export const ROADMAP_DATA_LIST: Roadmap[] = [
  dsaRoadmap,
  javaRoadmap,
  systemDesignRoadmap,
];
