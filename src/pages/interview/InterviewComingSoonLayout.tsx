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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <button
            onClick={() => navigate(backRoute)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-card text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to roadmap
          </button>

          <div className="group relative bg-card border rounded-[32px] p-8 md:p-12 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5 max-w-4xl">
            {/* Card Accent Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] bg-primary/10 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-primary/10 border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Clock3 size={12} />
                Coming Soon
              </div>

              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                {title}
              </h1>

              {languageLabel && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Language: {languageLabel}
                </div>
              )}

              <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed max-w-2xl">
                This section is currently under development. High-quality interview content and guided materials will be available here soon. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
