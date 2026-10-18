import { ArrowUp, Github, Heart, Linkedin, Globe } from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import "@/styles/landing.css";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://www.aritrodutta.tech/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Practice sheet", to: "/practice" },
      { label: "Playground", to: "/playground" },
      { label: "Daily problem", to: "/problem-solver" },
      { label: "Contest", to: "/contest" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Interview prep", to: "/interview" },
      { label: "Advanced Java", to: "/java-advanced" },
      { label: "System design", to: "/interview/java/system-design" },
      { label: "Roadmap", to: "/roadmap" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Portfolio", href: PORTFOLIO_URL, icon: Globe },
      { label: "GitHub", href: GITHUB_URL, icon: Github },
      { label: "LinkedIn", href: LINKEDIN_URL, icon: Linkedin },
      { label: "Twitter", href: TWITTER_URL, icon: Globe },
    ],
  },
];

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="lp lp-footer footer">
      <div className="lp-shell">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-footer-lockup">
              <AlgoGuruMark size={30} />
              <span>
                Algo<span className="lp-footer-guru">Guru</span>
              </span>
            </div>
            <p>
              A focused workspace for data structures, system design and interview preparation.
              Free to use — sign in to keep your progress.
            </p>
          </div>

          <div className="lp-footer-cols">
            {COLUMNS.map((column) => (
              <div key={column.title} className="lp-footer-col">
                <h3>{column.title}</h3>
                {column.links.map((link) =>
                  "to" in link ? (
                    <a key={link.label} href={link.to}>
                      {link.label}
                    </a>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.icon ? <link.icon size={13} /> : null}
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            ))}

            <div className="lp-footer-col">
              <h3>Support</h3>
              <button type="button" onClick={onSupportClick}>
                <Heart size={13} />
                Buy me a coffee
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp size={13} />
                Back to top
              </button>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {currentYear} AlgoGuru — All rights reserved</span>
          <span>Master code. Ace interviews.</span>
          <span>v2.1.0</span>
        </div>
      </div>
    </footer>
  );
}
