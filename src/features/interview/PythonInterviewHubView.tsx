"use client";

import { useMemo } from "react";
import { BrainCircuit, Flame, Layers, Target } from "lucide-react";
import { pythonInterviewTopics } from "@/data/pythonInterviewData";
import { usePythonUserState } from "@/hooks/usePythonUserState";
import { usePythonBookmarks } from "@/hooks/usePythonBookmarks";
import { getAllPythonQuestions, getPythonTopicCount } from "@/lib/pythonQuestionIndex";
import { getPythonQuestionDetailPath } from "@/data/pythonInterviewMetadata";
import {
  LanguageInterviewHub,
  type LanguageHubQuestionEntry,
  type LanguageLearningPath,
} from "./LanguageInterviewHub";

const LEARNING_PATHS: LanguageLearningPath[] = [
  {
    id: "python-qa",
    title: "Python Q&A",
    subtitle: "Theory, code & interview-ready answers",
    icon: BrainCircuit,
    route: "/interview/python/language-questions",
  },
  {
    id: "data-structure",
    title: "Data Structure",
    subtitle: "DSA patterns used in Python rounds",
    icon: Target,
    route: "/interview/python/data-structure",
  },
  {
    id: "system-design",
    title: "System Design",
    subtitle: "Scalable system thinking",
    icon: Layers,
    route: "/interview/python/system-design",
  },
  {
    id: "sql-structure",
    title: "SQL Questions",
    subtitle: "Interview SQL concepts & patterns",
    icon: Flame,
    route: "/interview/python/sql-structure",
  },
];

export default function PythonInterviewHubView() {
  const { doneMap } = usePythonUserState();
  const { bookmarkedIds } = usePythonBookmarks();
  const allQuestions = useMemo(
    () => getAllPythonQuestions() as unknown as LanguageHubQuestionEntry[],
    [],
  );
  const topicCount = getPythonTopicCount();

  return (
    <LanguageInterviewHub
      languageSlug="python"
      languageLabel="Python"
      badgeText="Python Interview Preparation"
      BadgeIcon={BrainCircuit}
      heroHeadlinePrefix="Master Python. Prepare smarter."
      heroDescription="Structured path through Python basics, strings & collections, functions & generators, OOP & decorators, I/O & memory, and concurrency — with code snippets and interview-ready answers."
      versionStatLabel="Python Versions"
      versionStatValue="3.8 – 3.13"
      learningPaths={LEARNING_PATHS}
      qaPathId="python-qa"
      topics={pythonInterviewTopics}
      allQuestions={allQuestions}
      topicCount={topicCount}
      doneMap={doneMap}
      bookmarkedIds={bookmarkedIds}
      getDetailPath={getPythonQuestionDetailPath}
    />
  );
}
