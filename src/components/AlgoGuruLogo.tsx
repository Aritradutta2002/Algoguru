interface AlgoGuruLogoProps {
  /** Size of the icon part in pixels */
  size?: number;
  /** Whether to show the "Algo / Guru" text in the SVG */
  showText?: boolean;
  className?: string;
}

export function AlgoGuruLogo({ size = 80, showText = true, className = "" }: AlgoGuruLogoProps) {
  const src = showText ? "/algoguru-logo.png" : "/algoguru-icon.png";

  return (
    <img
      src={src}
      alt="AlgoGuru Logo"
      width={size}
      className={`max-w-full object-contain ${className}`}
    />
  );
}
