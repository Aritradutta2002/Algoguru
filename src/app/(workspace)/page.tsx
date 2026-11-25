import type { Metadata } from "next";
import { HomeView } from "@/features/landing/HomeView";

export const metadata: Metadata = {
  title: "AlgoGuru — Master code. Ace interviews.",
  description:
    "Structured DSA paths, system design, curated interview questions and an in-browser coding workspace.",
};

export default function HomePage() {
  return <HomeView />;
}
