import { Heart, ExternalLink, Zap, Coffee, Github, Globe } from "lucide-react";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://portfolio-aritra-pearl.vercel.app/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-20 border-t bg-background" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Column 1: Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Links</h3>
            <div className="flex flex-col gap-2.5">
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Globe size={14} />
                Portfolio
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Github size={14} />
                GitHub
              </a>
            </div>
          </div>

          {/* Column 2: Social/Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Connect</h3>
            <div className="flex flex-col gap-2.5">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <ExternalLink size={14} />
                LinkedIn
              </a>
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <ExternalLink size={14} />
                Twitter (X)
              </a>
            </div>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Support</h3>
            <button
              onClick={onSupportClick}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
            >
              <Heart size={14} className="group-hover:fill-primary" />
              Buy Me A Coffee
            </button>
          </div>

          {/* Column 4: Project Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Project</h3>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Zap size={14} className="text-success" />
                Built By Aritra
              </span>
              <span className="opacity-70">Version 2.1.0</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-left hover:text-primary transition-colors"
              >
                Back To Top
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: "hsl(var(--border) / 0.3)" }}>
          <p className="text-xs text-muted-foreground font-medium">
            Copyright © {currentYear} AlgoGuru. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap size={12} className="text-primary" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Master Code. Ace Interviews.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

