import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";
import "@/styles/ui.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-reading",
  display: "swap",
});

function resolveMetadataBase(): URL {
  const configured = publicEnv.publicBaseUrl;
  try {
    return new URL(configured || "https://algoguru.online");
  } catch {
    return new URL("https://algoguru.online");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "AlgoGuru — Master code. Ace interviews.",
  description:
    "A focused workspace for mastering data structures, system design, and the interviews that move your engineering career forward.",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlgoGuru",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    siteName: "AlgoGuru",
    title: "AlgoGuru — Master code. Ace interviews.",
    description:
      "Structured DSA paths, system design, curated interview questions and an in-browser coding workspace.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "AlgoGuru — Master code. Ace interviews.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlgoGuru — Master code. Ace interviews.",
    description:
      "Structured DSA paths, system design, curated interview questions and an in-browser coding workspace.",
    images: [
      {
        url: "/og-image.png",
        alt: "AlgoGuru — Master code. Ace interviews.",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#6366F1" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070709" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
  ],
};

// Apply saved theme before React hydrates so light-mode visitors never see a dark flash.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("cp-theme");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute("content",t==="dark"?"#070709":"#FAFAF8");}}catch(e){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = cn(
    inter.variable,
    spaceGrotesk.variable,
    jetbrainsMono.variable,
    sourceSans3.variable,
  );

  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={cn(fontVariables, "font-sans antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
