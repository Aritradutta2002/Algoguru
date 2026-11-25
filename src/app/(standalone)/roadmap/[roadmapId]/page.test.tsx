import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  NextNotFoundError,
  notFoundMock,
  resetNextNavigationMocks,
} from "@/test/nextNavigationMock";
import RoadmapDetailPage, { generateMetadata } from "./page";

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("@/features/roadmap/RoadmapRouteView", () => ({
  default: ({ roadmapId }: { roadmapId?: string }) => (
    <main aria-label={`${roadmapId} roadmap`} />
  ),
}));

const validRoadmaps = [
  {
    roadmapId: "dsa",
    title: "Data Structures & Algorithms — AlgoGuru",
    description: "Master the patterns that show up in every coding interview",
  },
  {
    roadmapId: "java",
    title: "Java Roadmap — AlgoGuru",
    description: "Core Java → Advanced Java → Spring → Microservices",
  },
  {
    roadmapId: "system-design",
    title: "System Design — AlgoGuru",
    description: "Fundamentals → scaling → classic design interviews",
  },
] as const;

function roadmapProps(roadmapId: string) {
  return { params: Promise.resolve({ roadmapId }) };
}

beforeEach(() => {
  resetNextNavigationMocks();
});

describe("RoadmapDetailPage", () => {
  it("invokes notFound instead of rendering an unknown roadmap", async () => {
    await expect(
      RoadmapDetailPage(roadmapProps("not-a-roadmap")),
    ).rejects.toBeInstanceOf(NextNotFoundError);

    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "invokes notFound for inherited prototype key %s",
    async (roadmapId) => {
      await expect(
        RoadmapDetailPage(roadmapProps(roadmapId)),
      ).rejects.toBeInstanceOf(NextNotFoundError);

      expect(notFoundMock).toHaveBeenCalledOnce();
    },
  );

  it.each(validRoadmaps)(
    "renders the requested $roadmapId roadmap view",
    async ({ roadmapId }) => {
      render(await RoadmapDetailPage(roadmapProps(roadmapId)));

      expect(
        screen.getByRole("main", { name: `${roadmapId} roadmap` }),
      ).toBeInTheDocument();
    },
  );
});

describe("generateMetadata", () => {
  it("invokes notFound for an unknown roadmap", async () => {
    await expect(
      generateMetadata(roadmapProps("not-a-roadmap")),
    ).rejects.toBeInstanceOf(NextNotFoundError);

    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
    "invokes notFound for inherited prototype key %s in metadata",
    async (roadmapId) => {
      await expect(
        generateMetadata(roadmapProps(roadmapId)),
      ).rejects.toBeInstanceOf(NextNotFoundError);

      expect(notFoundMock).toHaveBeenCalledOnce();
    },
  );

  it.each(validRoadmaps)(
    "preserves the title and description for $roadmapId",
    async ({ roadmapId, title, description }) => {
      await expect(generateMetadata(roadmapProps(roadmapId))).resolves.toEqual({
        title,
        description,
      });
    },
  );
});
