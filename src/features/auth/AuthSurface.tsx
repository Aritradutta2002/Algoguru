"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { SurfaceLockup } from "@/components/brand/SurfaceLockup";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

export function AuthSurfaceHeader({
  returnHref,
  returnLabel,
}: {
  returnHref: string;
  returnLabel: string;
}) {
  const { theme, toggleTheme } = useSettings();
  const isDark = theme === "dark";

  return (
    <header className="ag-auth__header">
      <Link href="/" aria-label="AlgoGuru home" className="ag-header__mark">
        <SurfaceLockup />
      </Link>
      <div className="ag-auth__tools">
        <Link href={returnHref}>
          <ArrowLeft size={16} aria-hidden="true" />
          {returnLabel}
        </Link>
        <Button
          type="button"
          variant="bare"
          size="bare"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </Button>
      </div>
    </header>
  );
}

export function AuthIllustration() {
  return (
    <aside aria-label="AlgoGuru workspace highlights" className="ag-auth__illustration">
      <div className="ag-auth__art-copy">
        <h2>Build skills you can explain under pressure.</h2>
        <p>Practice one pattern at a time, work through the reasoning, and see how it holds up in a timed round.</p>
      </div>
      <figure className="ag-auth__figure">
        <svg viewBox="0 0 520 330" fill="none" aria-hidden="true" focusable="false">
          <path d="M35 68h450M35 136h450M35 204h450M35 272h450M80 36v260M170 36v260M260 36v260M350 36v260M440 36v260" stroke="#688775" strokeOpacity=".48" />
          <path d="M80 136h90l90 68 90-68h90M170 136l90-68 90 68M260 204v68" stroke="#829e86" strokeWidth="2" />
          <path d="M170 136l90 68 90-68" stroke="#d6f477" strokeWidth="3" />
          <g fill="#192e26" stroke="#829e86" strokeWidth="2">
            <circle cx="80" cy="136" r="8" />
            <circle cx="260" cy="68" r="8" />
            <circle cx="440" cy="136" r="8" />
            <circle cx="260" cy="272" r="8" />
          </g>
          <g fill="#d6f477">
            <rect x="143" y="109" width="54" height="54" rx="9" />
            <rect x="323" y="109" width="54" height="54" rx="9" />
            <circle cx="260" cy="204" r="25" />
          </g>
          <g textAnchor="middle" dominantBaseline="central" fill="#142c21" className="ag-auth__figure-labels">
            <text x="170" y="136">2</text>
            <text x="350" y="136">7</text>
            <text x="260" y="204">9</text>
          </g>
          <path d="M60 284h40m-20-20v40M420 54h40m-20-20v40" stroke="#a9c0a6" strokeOpacity=".68" />
        </svg>
        <figcaption>Two Sum: find two numbers that add up to the target.</figcaption>
      </figure>
      <ul className="ag-auth__tracks" aria-label="Workspace features">
        <li>Interactive DSA Sheets</li>
        <li>Guru AI Hint</li>
        <li>Timed Contest</li>
      </ul>
    </aside>
  );
}
