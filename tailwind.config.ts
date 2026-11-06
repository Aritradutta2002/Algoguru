import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "SFMono-Regular", "ui-monospace", "monospace"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        /* Display is the UI face tightened — one family, two roles, so the
           product does not look like a template pairing. */
        display: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        /* Editorial italic, used sparingly for emphasis in marketing copy. */
        editorial: ["Instrument Serif", "Iowan Old Style", "Georgia", "serif"],
        /* Long-form reading */
        reading: ["Inter", "system-ui", "sans-serif"],
        /* Documentation-grade code face */
        code: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        /* Legacy category accents, folded into the Forge palette so no
           surface can drift back to a rainbow. */
        category: {
          dsa: "hsl(var(--primary))",
          interview: "hsl(var(--success))",
          core: "hsl(var(--accent))",
          system: "hsl(var(--info))",
          playlist: "hsl(var(--primary))",
        },
        accentLine: {
          system: "hsl(var(--success))",
          playlist: "hsl(var(--difficulty-hard))",
          core: "hsl(var(--accent))",
        },
        brand: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary) / 0.12)",
        },
        panel: "hsl(var(--surface-panel))",
        raised: "hsl(var(--surface-raised))",
        chrome: "hsl(var(--surface-chrome))",
        line: "hsl(var(--surface-line))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: "hsl(var(--info))",
        heap: "hsl(var(--heap))",
        /* Coding-contest workspace ladder: page < chrome < panel.
           See the `--surface-*` tokens in index.css. */
        surface: {
          page: "hsl(var(--surface-page))",
          chrome: "hsl(var(--surface-chrome))",
          panel: "hsl(var(--surface-panel))",
          line: "hsl(var(--surface-line))",
          raised: "hsl(var(--surface-raised))",
        },
        code: {
          bg: "hsl(var(--code-bg))",
          border: "hsl(var(--code-border))",
          header: "hsl(var(--code-header))",
        },
        /* Guru AI surfaces follow the app's day/night theme while keeping
           the assistant's violet identity. See `--guru-*` in index.css. */
        guru: {
          bg: "hsl(var(--guru-bg))",
          surface: "hsl(var(--guru-surface))",
          raised: "hsl(var(--guru-raised))",
          line: "hsl(var(--guru-line))",
          text: "hsl(var(--guru-text))",
          muted: "hsl(var(--guru-muted))",
          accent: "hsl(var(--guru-accent))",
          "accent-2": "hsl(var(--guru-accent-2))",
          "accent-soft": "hsl(var(--guru-accent) / 0.14)",
          "on-accent": "hsl(var(--guru-on-accent))",
          success: "hsl(var(--guru-success))",
          danger: "hsl(var(--guru-danger))",
          code: "hsl(var(--guru-code))",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        DEFAULT: "var(--radius)",
      },
      zIndex: {
        raised: "var(--z-raised)",
        sticky: "var(--z-sticky)",
        nav: "var(--z-nav)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
        command: "var(--z-command)",
      },
      spacing: {
        header: "var(--header-height)",
        sidebar: "var(--sidebar-width)",
      },
      maxWidth: {
        content: "var(--content-max)",
        reading: "var(--reading-max)",
      },
      transitionDuration: {
        1: "var(--dur-1)",
        2: "var(--dur-2)",
        3: "var(--dur-3)",
        4: "var(--dur-4)",
        5: "var(--dur-5)",
      },
      boxShadow: {
        /* Restrained elevation ladder, driven by theme tokens */
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        accent: "var(--shadow-accent)",
        overlay: "var(--shadow-overlay)",
        cardHover: "var(--shadow-accent)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        standard: "cubic-bezier(0.2, 0, 0, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "caret-blink": {
          "0%, 45%": { opacity: "1" },
          "55%, 100%": { opacity: "0" },
        },
        "sweep-x": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        /* Guru mascot: antenna orb breathes, eyelids blink, halo drifts.
           All transform/opacity only so the loop stays on the compositor. */
        "guru-orb": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "guru-blink": {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "95%, 97%": { transform: "scaleY(0.08)" },
        },
        "guru-halo": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.06)" },
        },
        "guru-caret": {
          "0%, 45%": { opacity: "1" },
          "55%, 100%": { opacity: "0" },
        },
        "guru-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "guru-orb": "guru-orb 3.2s ease-in-out infinite",
        "guru-blink": "guru-blink 5.5s ease-in-out infinite",
        "guru-halo": "guru-halo 4.5s ease-in-out infinite",
        "guru-caret": "guru-caret 1.1s steps(1, end) infinite",
        "guru-shimmer": "guru-shimmer 1.8s ease-in-out infinite",
        "slide-in": "slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "caret-blink": "caret-blink 1.1s steps(1, end) infinite",
      },
      backgroundImage: {
        "gradient-primary": "none",
        "gradient-card": "none",
        "gradient-hero": "none",
        "gradient-sidebar": "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
