import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass, Home, LifeBuoy } from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import {
  AnimatedRays,
  BorderBeam,
  CandyButton,
  InteractiveHoverButton,
} from "@/components/ui/vengeance";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5">
      {/* ── Official Vengeance UI Animated Rays Background ── */}
      <AnimatedRays
        rayCount={5}
        primaryColor="rgba(56, 189, 248, 0.12)"
        secondaryColor="rgba(99, 102, 241, 0.08)"
        opacity={0.7}
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid opacity-35" />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card/85 p-8 text-center shadow-overlay backdrop-blur-xl sm:p-10">
        <BorderBeam size={260} duration={14} colorFrom="#38bdf8" colorTo="#818cf8" />

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <AlgoGuruMark size={42} />
        </div>

        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          404 — Route not found
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-5xl">
          This path doesn't exist.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-muted-foreground">
          The page you're looking for may have moved, or the link might be out
          of date. Your workspace is still right here.
        </p>
        <p className="mx-auto mt-3 max-w-md truncate rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          {location.pathname}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" tabIndex={-1}>
            <CandyButton className="min-w-[170px]">
              <Home size={16} />
              Return home
            </CandyButton>
          </Link>
          <Link to="/practice" tabIndex={-1}>
            <InteractiveHoverButton
              icon={<Compass size={16} className="text-primary" />}
            >
              Browse practice
            </InteractiveHoverButton>
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LifeBuoy size={12} />
            Open roadmap
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={12} />
            Go back
          </button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
