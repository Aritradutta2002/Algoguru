interface AlgoGuruLogoProps {
  /** Size of the icon part in pixels */
  size?: number;
  /** Whether to show the "Algo / Guru" text in the SVG */
  showText?: boolean;
  className?: string;
}

export function AlgoGuruLogo({ size = 80, showText = true, className = "" }: AlgoGuruLogoProps) {
  const style = showText 
    ? { width: size, height: 'auto', maxWidth: '100%' }
    : { height: size, width: 'auto' };

  return (
    <img
      src="/algoguru-logo.png"
      alt="AlgoGuru Logo"
      style={style}
      className={`object-contain ${className}`}
    />
  );
}
