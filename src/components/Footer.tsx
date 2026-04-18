import { motion } from "framer-motion";
import { Heart, Coffee, ExternalLink, Zap } from "lucide-react";
import { AlgoGuruLogo } from "./AlgoGuruLogo";

interface FooterProps {
  onSupportClick: () => void;
}

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-card border-t-2 mt-20" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Brand Column */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <AlgoGuruLogo size={40} showText={false} className="transition-transform group-hover:scale-110 duration-300" />
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest leading-none">AlgoGuru</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Unapologetic Dev Platform</span>
              </div>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-sm">
              Helping developers master DSA and Java through logic, not memorization. 
              100% free, forever open, and dedicated to the craft of coding.
            </p>

            <div className="flex items-center gap-4">
              <a 
                href="https://portfolio-aritra-pearl.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                Portfolio <ExternalLink size={12} />
              </a>
              <div className="w-1 h-1 rounded-full bg-border" />
              <a 
                href="#" 
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                GitHub <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="hidden md:block md:col-span-2" />

          {/* Support CTA Column */}
          <div className="md:col-span-5 flex flex-col items-start md:items-end gap-6 text-left md:text-right">
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight">Enjoying the platform?</h3>
              <p className="text-xs font-bold text-muted-foreground max-w-[280px] md:ml-auto">
                No paywalls, no ads. Help us keep the servers running and the content free.
              </p>
            </div>

            <motion.button
              onClick={onSupportClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-3 px-6 py-3 bg-primary text-black font-black uppercase tracking-wider text-sm overflow-hidden"
              style={{
                border: "2px solid black",
                boxShadow: "4px 4px 0 0 black",
              }}
            >
              <Heart size={16} fill="#FF3366" className="group-hover:animate-bounce" />
              <span>Fuel the Project</span>
              <Coffee size={16} />
            </motion.button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">UPI • Cards • Crypto Accepted</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            © {currentYear} AlgoGuru. Designed with passion for the community.
          </p>

          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-[#A3E635]">
              <Zap size={12} fill="#A3E635" /> Built by Aritra
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="text-muted-foreground">Version 2.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
