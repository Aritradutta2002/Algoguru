"use client";

import { getPythonQuestionDetailPath } from "@/data/pythonInterviewMetadata";
import { usePythonBookmarks } from "@/hooks/usePythonBookmarks";
import { usePythonUserState } from "@/hooks/usePythonUserState";
import {
  getAdjacentPythonQuestions,
  getPythonQuestionById,
  getPythonQuestionBySlug,
} from "@/lib/pythonQuestionIndex";
import {
  LanguageQuestionDetailView,
  type LanguageDetailEntry,
} from "./LanguageQuestionDetailView";

export default function InterviewPythonQuestionDetailView({
  language,
  questionSlug,
}: {
  language?: string;
  questionSlug?: string;
}) {
  const { isBookmarked, toggleBookmark } = usePythonBookmarks();
  const {
    doneMap,
    toggleDone,
    isUpserting,
    loading: userStateLoading,
    readingSectionMap,
    saveReadingSection,
  } = usePythonUserState();

  return (
    <LanguageQuestionDetailView
      language={language}
      questionSlug={questionSlug}
      defaultLanguageSlug="python"
      languageLabel="Python"
      codeLanguage="python"
      getEntryBySlug={(slug) =>
        getPythonQuestionBySlug(slug) as unknown as LanguageDetailEntry | undefined
      }
      getEntryById={(id) =>
        getPythonQuestionById(id) as unknown as LanguageDetailEntry | undefined
      }
      getAdjacent={(id) =>
        getAdjacentPythonQuestions(id) as unknown as {
          previous?: LanguageDetailEntry;
          next?: LanguageDetailEntry;
        }
      }
      getDetailPath={getPythonQuestionDetailPath}
      renderVersionBadges={(
        entry: LanguageDetailEntry & { meta: { pythonVersions?: string[] } },
      ) =>
        entry.meta.pythonVersions?.map((v) => (
          <span
            key={v}
            className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium font-mono bg-obsidian-elevated text-muted-foreground border-obsidian-border"
          >
            {v}
          </span>
        ))
      }
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
