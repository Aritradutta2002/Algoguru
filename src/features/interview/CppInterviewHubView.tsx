"use client";

import { useMemo } from "react";
import { Code2, Flame, Layers, Target } from "lucide-react";
import { cppInterviewTopics } from "@/data/cppInterviewData";
import { useCppUserState } from "@/hooks/useCppUserState";
import { useCppBookmarks } from "@/hooks/useCppBookmarks";
import { getAllCppQuestions, getCppTopicCount } from "@/lib/cppQuestionIndex";
import { getCppQuestionDetailPath } from "@/data/cppInterviewMetadata";
import {
  LanguageInterviewHub,
  type LanguageLearningPath,
} from "./LanguageInterviewHub";

const LEARNING_PATHS: LanguageLearningPath[] = [
  {
    id: "cpp-qa",
    title: "C++ Q&A",
    subtitle: "Theory, code & interview-ready answers",
    icon: Code2,
    route: "/interview/cpp/language-questions",
  },
  {
    id: "data-structure",
    title: "Data Structure",
    subtitle: "DSA patterns used in C++ rounds",
    icon: Target,
    route: "/interview/cpp/data-structure",
  },
  {
    id: "system-design",
    title: "System Design",
    subtitle: "Scalable system thinking",
    icon: Layers,
    route: "/interview/cpp/system-design",
  },
  {
    id: "sql-structure",
    title: "SQL Questions",
    subtitle: "Interview SQL concepts & patterns",
    icon: Flame,
    route: "/interview/cpp/sql-structure",
  },
];

export default function CppInterviewHubView() {
  const { doneMap } = useCppUserState();
  const { bookmarkedIds } = useCppBookmarks();
  const allQuestions = useMemo(() => getAllCppQuestions(), []);
  const topicCount = getCppTopicCount();

  return (
    <LanguageInterviewHub
      languageSlug="cpp"
      languageLabel="C++"
      badgeText="C++ Interview Preparation"
      BadgeIcon={Code2}
      heroHeadlinePrefix="Master C++. Prepare smarter."
      heroDescription="Structured path through C++ basics, memory & RAII, pointers, OOP, STL, templates, concurrency and modern C++ (11/17/20/23) — with code snippets and interview-ready answers."
      versionStatLabel="Modern C++"
      versionStatValue="11–23"
      learningPaths={LEARNING_PATHS}
      qaPathId="cpp-qa"
      topics={cppInterviewTopics}
      allQuestions={allQuestions}
      topicCount={topicCount}
      doneMap={doneMap}
      bookmarkedIds={bookmarkedIds}
      getDetailPath={getCppQuestionDetailPath}
    />
  );
}
