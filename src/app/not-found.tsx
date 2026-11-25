"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Compass, Home, LifeBuoy } from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-obsidian-void p-5 text-foreground">
      <div className="relative w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane">
          <AlgoGuruMark size={36} />
        </div>

        <p className="lp-kicker mb-2">404 — Route not found</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
          This path doesn&apos;t exist.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-muted-foreground">
          The page you&apos;re looking for may have moved, or the link might be
          out of date. Your workspace is still right here.
        </p>
        {pathname ? (
          <p className="mx-auto mt-4 max-w-md truncate rounded-md border border-obsidian-border bg-obsidian-elevated px-3 py-1.5 font-mono text-xs text-muted-foreground">
            {pathname}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home size={15} />
              Return home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/practice">
              <Compass size={15} className="text-muted-foreground" />
              Browse practice
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LifeBuoy size={13} />
            Open roadmap
          </Link>
          <Button variant="bare" size="bare"
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 rounded-md hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft size={13} />
            Go back
          </Button>
        </div>
      </div>
    </main>
  );
}
