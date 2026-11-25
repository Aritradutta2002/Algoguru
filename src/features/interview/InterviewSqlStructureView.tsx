"use client";

import InterviewComingSoonLayout from "./InterviewComingSoonLayout";

export default function InterviewSqlStructureView({
  language,
}: {
  language?: string;
}) {
  return <InterviewComingSoonLayout title="SQL Structure" language={language} />;
}
