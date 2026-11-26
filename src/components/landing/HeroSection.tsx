"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroWorkspacePreview } from "./HeroWorkspacePreview";

interface HeroSectionProps {
  onExplore: () => void;
  onQuiz: () => void;
  onOpenRoadmap: () => void;
}

export function HeroSection({ onExplore, onQuiz, onOpenRoadmap }: HeroSectionProps) {
  const router = useRouter();

  return (
    <section aria-labelledby="landing-heading" className="ag-hero">
      <div className="lp-container ag-hero__grid">
        <div className="ag-hero__intro">
          <h1 id="landing-heading" className="ag-hero__title">
            Practice with a plan.<br />
            <span>Interview with confidence.</span>
          </h1>
          <p className="ag-hero__description">
            Learn the patterns behind coding interviews. Work through structured DSA,
            Java, and system design tracks, then put them to the test in a timed round.
          </p>
          <div className="ag-hero__actions">
            <a href="#workspace-preview" className="ag-button ag-button--primary">
              Try the demo <ArrowDown size={17} aria-hidden="true" />
            </a>
            <Button type="button" variant="bare" size="bare" onClick={onExplore} className="ag-button ag-button--secondary">
              Explore learning paths <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          <div className="ag-hero__links">
            <Button type="button" variant="bare" size="bare" onClick={() => router.push("/playground")}>
              <Code2 size={16} aria-hidden="true" /> Open playground
            </Button>
            <Button type="button" variant="bare" size="bare" onClick={onQuiz}>Or take a 10-question quiz</Button>
            <Link href="/auth" className="ag-hero__sync">
              Sign in to sync progress <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="ag-hero__stage">
          <HeroWorkspacePreview onOpenRoadmap={onOpenRoadmap} />
        </div>
      </div>
    </section>
  );
}
