import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3 } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(backRoute)}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-border bg-card hover:bg-muted/60"
          style={{ boxShadow: "2px 2px 0px 0px hsl(var(--border))" }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div
          className="mt-6 border-2 border-black dark:border-white bg-card p-8 md:p-12"
          style={{ boxShadow: "4px 4px 0px 0px hsl(var(--border))" }}
        >
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-primary text-black border-2 border-border mb-5">
            <Clock3 size={12} />
            Coming Soon
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight">
            {title}
          </h1>
          {languageLabel && (
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-primary">
              Selected Language: {languageLabel}
            </p>
          )}
          <p className="mt-4 text-sm font-semibold text-muted-foreground max-w-2xl">
            This section is under development. Content and guided interview material will be
            available here soon.
          </p>
        </div>
      </div>
    </div>
  );
}
