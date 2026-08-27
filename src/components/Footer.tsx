import { Heart, ExternalLink, Zap, Github, Globe } from "lucide-react";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://www.aritrodutta.tech/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-16 border-t border-border bg-background footer">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Links</h3>
            <div className="flex flex-col gap-1">
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-manipulation text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5"
              >
                <Globe size={14} />
                Portfolio
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-manipulation text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5"
              >
                <Github size={14} />
                GitHub
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Connect</h3>
            <div className="flex flex-col gap-1">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-manipulation text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5"
              >
                <ExternalLink size={14} />
                LinkedIn
              </a>
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-manipulation text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5"
              >
                <ExternalLink size={14} />
                Twitter (X)
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Support</h3>
            <button
              onClick={onSupportClick}
              className="touch-manipulation text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1.5 group"
            >
              <Heart size={14} />
              Buy me a coffee
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Project</h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 py-1.5">
                <Zap size={14} className="text-primary" />
                Built by Aritra
              </span>
              <span className="py-1.5 text-xs">Version 2.1.0</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="touch-manipulation text-left hover:text-foreground transition-colors py-1.5"
              >
                Back to top
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Copyright © {currentYear} AlgoGuru. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap size={12} className="text-primary" />
            <span>Master code. Ace interviews.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
