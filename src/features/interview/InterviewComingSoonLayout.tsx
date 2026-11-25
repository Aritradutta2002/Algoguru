"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PagePrimitives";
import {
  INTERVIEW_LANGUAGE_LABELS,
  isInterviewLanguage,
} from "./interviewLanguage";

interface InterviewComingSoonLayoutProps {
  title: string;
  language?: string;
}

export default function InterviewComingSoonLayout({
  title,
  language: languageProp,
}: InterviewComingSoonLayoutProps) {
  const params = useParams<{ language?: string }>();
  const language = languageProp ?? params.language;
  const languageLabel = isInterviewLanguage(language)
    ? INTERVIEW_LANGUAGE_LABELS[language]
    : null;
  const backRoute = languageLabel ? `/interview/${language}` : "/interview";

  return (
    <div className="min-h-screen bg-obsidian-void text-foreground selection:bg-primary/20">
      <PageContainer className="py-10 md:py-16 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-full max-w-3xl space-y-8">
          <div className="flex justify-start">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-auto gap-2 rounded-lg border-obsidian-border bg-obsidian-pane px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-obsidian-elevated hover:text-foreground"
            >
              <Link href={backRoute}>
                <ArrowLeft size={14} />
                Back to Roadmap
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Card className="rounded-[0.875rem] border-obsidian-border bg-obsidian-pane p-8 sm:p-12 shadow-none">
              <div className="flex flex-col items-start space-y-6">
                <p className="lp-kicker">
                  <Clock3 size={13} className="inline mr-1.5" />
                  Under development
                </p>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                    {title}
                  </h1>

                  {languageLabel && (
                    <Badge
                      variant="outline"
                      className="gap-2 rounded-md border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Target language: {languageLabel}
                    </Badge>
                  )}
                </div>

                <p className="text-[15px] leading-7 text-muted-foreground max-w-2xl">
                  Interview preparation material for this topic is currently being developed.
                  Structured questions, curated explanations, and coding scenarios will be
                  available here soon.
                </p>

                <div className="pt-4 flex flex-wrap gap-2.5">
                  <Badge
                    variant="outline"
                    className="rounded-md border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    Content verified
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-md border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    Expert reviewed
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </PageContainer>
    </div>
  );
}
