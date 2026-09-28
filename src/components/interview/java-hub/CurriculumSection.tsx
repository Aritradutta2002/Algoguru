import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Flame, Search, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DifficultyBadge } from "@/components/interview/CoreJavaBadges";
import {
  topicActionLabel,
  topicActionName,
  type HotQuestion,
  type TopicStat,
} from "./javaHubData";

interface CurriculumSectionProps {
  topics: TopicStat[];
  hotQuestions: HotQuestion[];
}

function CurriculumTopicItem({ stat }: { stat: TopicStat }) {
  const { difficulty } = stat;
  return (
    <li className="cjh-topic-row">
      <span className="cjh-topic-num" aria-hidden="true">
        {String(stat.number).padStart(2, "0")}
      </span>

      <div className="cjh-topic-main">
        <h3 className="cjh-topic-title">{stat.title}</h3>
        <p className="cjh-topic-desc">{stat.description}</p>
        <p className="cjh-topic-meta">
          <span>
            <span className="cjh-num">{stat.total}</span> questions
          </span>
          {stat.mustKnow > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                <span className="cjh-num">{stat.mustKnow}</span> must-know
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>
            ~<span className="cjh-num">{stat.minutes}</span> min read
          </span>
          {stat.state === "complete" && (
            <span className="cjh-status cjh-status--done">
              <CheckCircle2 size={13} aria-hidden="true" />
              Complete
            </span>
          )}
          {stat.state === "in-progress" && <span className="cjh-status cjh-status--progress">In progress</span>}
        </p>
      </div>

      <div className="cjh-topic-progress">
        <Progress
          value={stat.pct}
          className="h-1.5"
          aria-label={`${stat.title}: ${stat.done} of ${stat.total} questions studied`}
        />
        <p className="cjh-topic-count">
          <span className="cjh-num">
            {stat.done} of {stat.total}
          </span>{" "}
          studied
        </p>
      </div>

      <div className="cjh-topic-action">
        <Link to={stat.href} className="cjh-btn-secondary" aria-label={topicActionName(stat)}>
          {topicActionLabel(stat)}
          <ArrowRight size={14} />
        </Link>
      </div>

      <details className="cjh-topic-details">
        <summary>Question mix</summary>
        <p className="cjh-topic-mix">
          <span className="cjh-num">{difficulty.easy}</span> easy ·{" "}
          <span className="cjh-num">{difficulty.medium}</span> medium ·{" "}
          <span className="cjh-num">{difficulty.hard}</span> hard
          {stat.mustKnow > 0 && (
            <>
              {" "}
              · <span className="cjh-num">{stat.mustKnow}</span> must-know
            </>
          )}
        </p>
      </details>
    </li>
  );
}

export function CurriculumSection({ topics, hotQuestions }: CurriculumSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();
  const filteredTopics = useMemo(() => {
    if (!query) return topics;
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.id.toLowerCase().includes(query)
    );
  }, [topics, query]);

  return (
    <>
      <div className="cjh-curriculum-search">
        <Search size={15} className="cjh-curriculum-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics (e.g. Collections, Threads, OOP)…"
          className="cjh-curriculum-input"
          aria-label="Search topics"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="cjh-curriculum-clear"
            aria-label="Clear topic search"
          >
            <X size={13} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {filteredTopics.length > 0 ? (
        <ol className="cjh-curriculum">
          {filteredTopics.map((stat) => (
            <CurriculumTopicItem key={stat.id} stat={stat} />
          ))}
        </ol>
      ) : (
        <div className="cjh-curriculum-empty">
          <p>No topics match “{searchQuery}”</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="cjh-btn-secondary"
          >
            Show all topics
          </button>
        </div>
      )}

      {hotQuestions.length > 0 && (
        <div className="cjh-hotlist-block">
          <h3 className="cjh-subheading">Most asked in interviews</h3>
          <p className="cjh-subheading-desc">
            The questions raised most often across Java rounds, ordered by interview priority.
          </p>
          <ol className="cjh-hotlist">
            {hotQuestions.map((question, index) => (
              <li key={question.id}>
                <Link to={question.href} className="cjh-hot-row">
                  <span className="cjh-hot-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="cjh-hot-body">
                    <span className="cjh-hot-title">{question.title}</span>
                    <span className="cjh-hot-meta">
                      <span className="cjh-chip">
                        Q<span className="cjh-num">{String(question.number).padStart(3, "0")}</span>
                      </span>
                      <span className="cjh-chip">{question.topicTitle}</span>
                      {question.difficulty && <DifficultyBadge difficulty={question.difficulty} />}
                      {question.mustKnow && (
                        <span className="cjh-chip cjh-chip--accent">
                          <Flame size={11} aria-hidden="true" />
                          Must know
                        </span>
                      )}
                    </span>
                  </span>
                  <ArrowRight size={15} className="cjh-hot-arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
