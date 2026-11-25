"use client";

import { useMemo } from "react";
import { Network } from "lucide-react";
import { cppInterviewTopics } from "@/data/cppInterviewData";
import { getCppQuestionDetailPath } from "@/data/cppInterviewMetadata";
import { CppVersionBadge } from "@/components/interview/CppBadges";
import { hasCppVisualization } from "@/components/interview/CppVisualizationBlock";
import { useCppBookmarks } from "@/hooks/useCppBookmarks";
import { useCppUserState } from "@/hooks/useCppUserState";
import { getAllCppQuestions } from "@/lib/cppQuestionIndex";
import {
  LanguageQuestionsView,
  type LanguageQuestionEntry,
} from "./LanguageQuestionsView";

export default function InterviewCppQuestionsView({
  language,
}: {
  language?: string;
}) {
  const { doneMap, notesMap, upsertingId, toggleDone, saveNote, deleteNote } =
    useCppUserState();
  const { isBookmarked, toggleBookmark, bookmarkedIds } = useCppBookmarks();
  const allQuestions = useMemo(() => getAllCppQuestions(), []);

  return (
    <LanguageQuestionsView
      language={language}
      defaultLanguageSlug="cpp"
      languageLabel="C++"
      pageTitle="C++ Interview Questions | AlgoGuru"
      codeLanguage="cpp"
      pdfTitle="C++ Interview Notes"
      pdfFilename="Cpp-Notes.pdf"
      topics={cppInterviewTopics}
      allQuestions={allQuestions}
      doneMap={doneMap}
      notesMap={notesMap}
      upsertingId={upsertingId}
      toggleDone={toggleDone}
      saveNote={saveNote}
      deleteNote={deleteNote}
      isBookmarked={isBookmarked}
      toggleBookmark={toggleBookmark}
      bookmarkedIds={bookmarkedIds}
      getDetailPath={getCppQuestionDetailPath}
      renderExtraMeta={(entry: LanguageQuestionEntry & { meta: { cppVersions?: string[] } }) => (
        <>
          {entry.meta.cppVersions?.map((v) => (
            <CppVersionBadge key={v} version={v} />
          ))}
          {hasCppVisualization(entry.question.id) && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-info bg-info/10 px-2 py-0.5 rounded-full">
              <Network size={10} /> Visual
            </span>
          )}
        </>
      )}
    />
  );
}
