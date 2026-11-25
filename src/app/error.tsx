"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-obsidian-void p-5 text-foreground">
      <Card className="w-full max-w-md border-obsidian-border bg-obsidian-pane">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
            <AlertTriangle size={18} />
          </div>
          <CardTitle className="text-lg">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error interrupted this view. Your workspace data is
            safe — try rendering this page again.
          </CardDescription>
        </CardHeader>
        {error?.message ? (
          <CardContent>
            <p className="rounded-md border border-obsidian-border bg-obsidian-elevated px-3 py-2 font-mono text-xs text-muted-foreground break-words">
              {error.message}
            </p>
          </CardContent>
        ) : null}
        <CardFooter className="flex items-center justify-end gap-2">
          <Button type="button" onClick={reset}>
            <RotateCcw size={15} />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
