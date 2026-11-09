import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout/PagePrimitives";

interface InterviewComingSoonLayoutProps {
  title: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  java: "Java",
  cpp: "C++",
  python: "Python",
};

export default function InterviewComingSoonLayout({ title }: InterviewComingSoonLayoutProps) {
  const navigate = useNavigate();
  const { language } = useParams<{ language?: string }>();
  const languageLabel = language ? LANGUAGE_LABELS[language] : null;
  const backRoute = languageLabel ? `/interview/${language}` : "/interview";

  return (
    <div className="min-h-screen bg-obsidian-void text-foreground selection:bg-primary/20">
      <PageContainer className="py-10 md:py-16 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-full max-w-3xl space-y-8">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate(backRoute)}
              className="inline-flex items-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-pane px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-obsidian-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft size={14} />
              Back to Roadmap
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-[0.875rem] border border-obsidian-border bg-obsidian-pane p-8 sm:p-12"
          >
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
                  <div className="inline-flex items-center gap-2 rounded-md border border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Target language: {languageLabel}
                  </div>
                )}
              </div>

              <p className="text-[15px] leading-7 text-muted-foreground max-w-2xl">
                Interview preparation material for this topic is currently being developed. Structured questions, curated explanations, and coding scenarios will be available here soon.
              </p>

              <div className="pt-4 flex flex-wrap gap-2.5">
                <div className="rounded-md border border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground">
                  Content verified
                </div>
                <div className="rounded-md border border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs text-muted-foreground">
                  Expert reviewed
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </PageContainer>
    </div>
  );
}
