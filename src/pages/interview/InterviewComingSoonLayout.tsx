import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3 } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <section className="px-4 md:px-10 lg:px-16 py-9 md:py-24 max-w-7xl mx-auto relative overflow-hidden flex flex-col items-center justify-center min-h-[80vh]">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl space-y-12">
          <div className="flex justify-center md:justify-start">
            <button
              onClick={() => navigate(backRoute)}
              className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-border/30 bg-muted/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:border-primary/30 hover:text-foreground"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              Back to Roadmap
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="group relative bg-card border border-border/30 rounded-[48px] p-10 md:p-20 overflow-hidden transition-all hover:shadow-[0_32px_120px_-20px_rgba(0,0,0,0.3)]"
          >
            {/* Card Accent Glow */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] bg-primary/10 opacity-50 pointer-events-none group-hover:bg-primary/20 transition-colors" />
            
            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border bg-primary/10 border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Clock3 size={14} className="animate-pulse" />
                Under Development
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[1.1]">
                  {title.split(' ').map((word, i) => (
                    <span key={i} className={i % 2 === 1 ? "text-primary" : ""}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                
                {languageLabel && (
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl border border-border/30 bg-muted/20 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Target Language: {languageLabel}
                  </div>
                )}
              </div>

              <p className="text-base md:text-xl font-medium text-muted-foreground/70 leading-relaxed max-w-2xl">
                We're meticulously crafting the ultimate interview preparation experience for this topic. High-quality theoretical deep-dives and real-world coding scenarios will be available here soon.
              </p>

              <div className="pt-8 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/10 border border-border/10 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Content Verified
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/10 border border-border/10 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Expert Reviewed
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
