"use client";

import { CppVersionBadge } from "@/components/interview/CppBadges";
import {
  CppVisualizationBlock,
  hasCppVisualization,
} from "@/components/interview/CppVisualizationBlock";
import { getCppQuestionDetailPath } from "@/data/cppInterviewMetadata";
import { useCppBookmarks } from "@/hooks/useCppBookmarks";
import { useCppUserState } from "@/hooks/useCppUserState";
import {
  getAdjacentCppQuestions,
  getCppQuestionById,
  getCppQuestionBySlug,
} from "@/lib/cppQuestionIndex";
import {
  LanguageQuestionDetailView,
  type LanguageDetailEntry,
} from "./LanguageQuestionDetailView";

export default function InterviewCppQuestionDetailView({
  language,
  questionSlug,
}: {
  language?: string;
  questionSlug?: string;
}) {
  const { isBookmarked, toggleBookmark } = useCppBookmarks();
  const {
    doneMap,
    toggleDone,
    isUpserting,
    loading: userStateLoading,
    readingSectionMap,
    saveReadingSection,
  } = useCppUserState();

  return (
    <LanguageQuestionDetailView
      language={language}
      questionSlug={questionSlug}
      defaultLanguageSlug="cpp"
      languageLabel="C++"
      codeLanguage="cpp"
      getEntryBySlug={getCppQuestionBySlug}
      getEntryById={getCppQuestionById}
      getAdjacent={getAdjacentCppQuestions}
      getDetailPath={getCppQuestionDetailPath}
      hasVisualization={hasCppVisualization}
      renderVisualization={(id) => <CppVisualizationBlock questionId={id} />}
      renderVersionBadges={(
        entry: LanguageDetailEntry & { meta: { cppVersions?: string[] } },
      ) => entry.meta.cppVersions?.map((v) => <CppVersionBadge key={v} version={v} />)}
      isBookmarked={isBookmarked}
      toggleBookmark={toggleBookmark}
      doneMap={doneMap}
      toggleDone={toggleDone}
      isUpserting={isUpserting}
      userStateLoading={userStateLoading}
      readingSectionMap={readingSectionMap}
      saveReadingSection={saveReadingSection}
    />
  );
}
