interface AlgoGuruLogoProps {
  /** Size of the icon part in pixels */
  size?: number;
  /** Whether to show the "Algo / Guru" text in the SVG */
  showText?: boolean;
  className?: string;
}

/**
 * Inline SVG logo for AlgoGuru — no file dependency.
 *
 * - showText=true  → full logo with "Algo" + outlined "Guru" (for splash/loading)
 * - showText=false → icon only (for header / sidebar)
 */
export function AlgoGuruLogo({ size = 80, showText = true, className = "" }: AlgoGuruLogoProps) {
  const viewBox = showText ? "0 0 400 370" : "0 0 400 220";
  const height  = showText ? size * (370 / 400) : size * (220 / 400);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      aria-label="AlgoGuru Logo"
      role="img"
    >
      {/* Shadow ellipse */}
      <ellipse cx="200" cy="205" rx="70" ry="12" fill="#f0f2f5" />

      <g stroke="#1b1b1b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* White robe / sleeves */}
        <path d="M 140 180 C 130 200, 160 210, 185 200 L 195 190" fill="#ffffff" />
        <path d="M 260 180 C 270 200, 240 210, 215 200 L 205 190" fill="#ffffff" />

        {/* Feet */}
        <path d="M 185 190 L 195 205 L 200 195 Z" fill="#fcd09f" />
        <path d="M 215 190 L 205 205 L 200 195 Z" fill="#fcd09f" />

        {/* Orange robe body */}
        <path d="M 155 125 C 135 155, 150 190, 170 190 L 230 190 C 250 190, 265 155, 245 125 Z" fill="#ed7014" />

        {/* Scroll / document */}
        <rect x="175" y="130" width="40" height="50" rx="3" fill="#ffffff" />
        <line x1="183" y1="145" x2="207" y2="145" strokeWidth="2" />
        <line x1="183" y1="155" x2="207" y2="155" strokeWidth="2" />
        <line x1="183" y1="165" x2="207" y2="165" strokeWidth="2" />

        {/* Left hand */}
        <circle cx="170" cy="140" r="12" fill="#fcd09f" />

        {/* White beard / neck */}
        <path d="M 165 95 C 145 130, 180 170, 200 170 C 220 170, 255 130, 235 95 Z" fill="#ffffff" />

        {/* Face */}
        <circle cx="200" cy="95" r="24" fill="#fcd09f" />

        {/* Glasses */}
        <circle cx="188" cy="90" r="8" fill="#fcd09f" strokeWidth="2" />
        <circle cx="212" cy="90" r="8" fill="#fcd09f" strokeWidth="2" />
        <line x1="196" y1="90" x2="204" y2="90" strokeWidth="2" />

        {/* Eyebrows */}
        <path d="M 185 88 Q 188 85 191 88" fill="none" />
        <path d="M 209 88 Q 212 85 215 88" fill="none" />

        {/* Smile */}
        <path d="M 190 105 C 195 110, 205 110, 210 105 C 205 115, 195 115, 190 105 Z" fill="#ffffff" />

        {/* Turban */}
        <path
          d="M 155 65 C 145 40, 180 30, 200 30 C 220 30, 255 40, 245 65 C 260 80, 240 105, 220 95 C 210 100, 190 100, 180 95 C 160 105, 140 80, 155 65 Z"
          fill="#ed7014"
        />
        <path d="M 165 50 C 180 70, 200 95, 220 95" fill="none" strokeWidth="2" />
        <path d="M 235 50 C 220 70, 200 95, 180 95" fill="none" strokeWidth="2" />
      </g>

      {/* Text — only when showText=true */}
      {showText && (
        <>
          <text
            x="200"
            y="275"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontSize="80"
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
            letterSpacing="-1"
          >
            Algo
          </text>
          <text
            x="200"
            y="355"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
            fontSize="80"
            fontWeight="300"
            fill="none"
            stroke="#ed7014"
            strokeWidth="2"
            textAnchor="middle"
          >
            Guru
          </text>
        </>
      )}
    </svg>
  );
}
