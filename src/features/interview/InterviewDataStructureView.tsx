"use client";

import InterviewComingSoonLayout from "./InterviewComingSoonLayout";

export default function InterviewDataStructureView({
  language,
}: {
  language?: string;
}) {
  return (
    <InterviewComingSoonLayout
      title="Data Structure for Interview"
      language={language}
    />
  );
}
