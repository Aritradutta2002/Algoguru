import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyPlanWeek } from "./javaHubData";

interface StudyPlanTimelineProps {
  weeks: StudyPlanWeek[];
}

/**
 * Four-week study plan as a disclosure accordion. Completion shown per week is
 * derived from real question progress; the plan itself is a recommended order
 * over the curriculum and tracks no separate state.
 */
export function StudyPlanTimeline({ weeks }: StudyPlanTimelineProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const defaultOpenId = weeks.find((week) => week.current)?.id ?? weeks[0]?.id ?? null;
  const activeId = openId ?? defaultOpenId;

  return (
    <div className="cjh-plan">
      {weeks.map((week, index) => {
        const open = week.id === activeId;
        const panelId = `${week.id}-panel`;
        return (
          <div
            key={week.id}
            className={cn(
              "cjh-plan-week",
              open && "is-open",
              week.current && "is-current",
              week.complete && "is-complete"
            )}
          >
            <h3 className="cjh-plan-heading">
              <button
                type="button"
                className="cjh-plan-toggle"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : week.id)}
              >
                <span className="cjh-plan-marker" aria-hidden="true">
                  {week.complete ? <CheckCircle2 size={13} /> : <span>{index + 1}</span>}
                </span>
                <span className="cjh-plan-label">
                  <span className="cjh-plan-week-name">{week.label}</span>
                  <span className="cjh-plan-focus">{week.focus}</span>
                </span>
                <span className="cjh-plan-meta">
                  <span className="cjh-num">
                    {week.done} of {week.total}
                  </span>{" "}
                  questions studied
                  {week.current && !week.complete && (
                    <span className="cjh-status cjh-status--progress">Current week</span>
                  )}
                  {week.complete && (
                    <span className="cjh-status cjh-status--done">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      Complete
                    </span>
                  )}
                </span>
                <ChevronDown size={16} className="cjh-plan-chevron" aria-hidden="true" />
              </button>
            </h3>

            <div id={panelId} className={cn("cjh-plan-panel", open && "is-open")}>
              <div className="cjh-plan-panel-inner">
                <p className="cjh-plan-outcome">{week.outcome}</p>
                <ul className="cjh-plan-topics">
                  {week.topics.map((topic) => (
                    <li key={topic.id}>
                      <Link to={topic.href} className="cjh-plan-topic">
                        <span className="cjh-topic-num" aria-hidden="true">
                          {String(topic.number).padStart(2, "0")}
                        </span>
                        <span className="cjh-plan-topic-title">{topic.title}</span>
                        <span className="cjh-plan-topic-count cjh-num">
                          {topic.done}/{topic.total}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
