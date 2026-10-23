import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass, Home, LifeBuoy } from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

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
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid opacity-35" />
        <div className="aurora-blob left-[18%] top-[22%] h-64 w-64 bg-primary/12" />
        <div
          className="aurora-blob bottom-[12%] right-[16%] h-56 w-56 bg-accent/10"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card/80 shadow-overlay backdrop-blur-xl">
          <AlgoGuruMark size={42} />
        </div>

        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          404 — Route not found
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-[-0.05em] md:text-6xl">
          This path doesn't exist.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-muted-foreground">
          The page you're looking for may have moved, or the link might be out
          of date. Your workspace is still right here.
        </p>
        <p className="mx-auto mt-3 max-w-md truncate rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          {location.pathname}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-accent transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Home size={16} />
            Return home
          </Link>
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold shadow-card transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Compass size={16} className="text-primary" />
            Browse practice
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
          <Link to="/roadmap" className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
