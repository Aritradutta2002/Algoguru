import { Suspense } from "react";
import type { Metadata } from "next";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import PlaygroundWorkspace from "@/features/playground/PlaygroundWorkspace";

export const metadata: Metadata = {
  title: "Playground IDE — AlgoGuru",
  description:
    "In-browser Java, Python, and C++ coding playground with debugger, templates, practice problems, and GuruBot.",
};

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<AppLoadingScreen label="Loading playground" />}>
      <PlaygroundWorkspace />
    </Suspense>
  );
}
