"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { pythonInterviewTopics } from "@/data/pythonInterviewData";
import { getPythonQuestionDetailPath } from "@/data/pythonInterviewMetadata";
import { usePythonBookmarks } from "@/hooks/usePythonBookmarks";
import { usePythonUserState } from "@/hooks/usePythonUserState";
import { getAllPythonQuestions } from "@/lib/pythonQuestionIndex";
import {
  LanguageQuestionsView,
  type LanguageQuestionEntry,
} from "./LanguageQuestionsView";

export default function InterviewPythonQuestionsView({
  language,
}: {
  language?: string;
}) {
  const { doneMap, notesMap, upsertingId, toggleDone, saveNote, deleteNote } =
    usePythonUserState();
  const { isBookmarked, toggleBookmark, bookmarkedIds } = usePythonBookmarks();
  const allQuestions = useMemo(
    () => getAllPythonQuestions() as unknown as LanguageQuestionEntry[],
    [],
  );

  return (
    <LanguageQuestionsView
      language={language}
      defaultLanguageSlug="python"
      languageLabel="Python"
      pageTitle="Python Interview Questions | AlgoGuru"
      codeLanguage="python"
      pdfTitle="Python Interview Notes"
      pdfFilename="Python-Notes.pdf"
      topics={pythonInterviewTopics}
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
      getDetailPath={getPythonQuestionDetailPath}
      renderExtraMeta={(entry: LanguageQuestionEntry & { meta: { pythonVersions?: string[] } }) => (
        <>
          {entry.meta.pythonVersions?.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium font-mono bg-obsidian-elevated text-muted-foreground border-obsidian-border"
            >
              {v}
            </span>
          ))}
          {(entry.meta.priority === "high" || entry.meta.priority === "very-high") && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
              <Flame size={10} /> Hot
            </span>
          )}
        </>
      )}
    />
  );
}
