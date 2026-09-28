import { type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import {
  handleSectionLinkClick,
  useActiveSection,
  type SectionLink,
} from "./useSectionNavigation";

interface LocalSectionNavigationProps {
  sections: readonly SectionLink[];
}

/** Quiet anchor navigation for the hub's own sections. */
export function LocalSectionNavigation({ sections }: LocalSectionNavigationProps) {
  const active = useActiveSection(sections);

  return (
    <nav className="cjh-nav" aria-label="Page sections">
      <ul className="cjh-nav-list">
        {sections.map((section) => {
          const isActive = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn("cjh-nav-link", isActive && "cjh-nav-link--active")}
                aria-current={isActive ? "location" : undefined}
                onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                  handleSectionLinkClick(event, section.id)
                }
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
