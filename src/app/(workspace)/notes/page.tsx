import type { Metadata } from "next";
import { NotesDashboardView } from "@/features/notes/NotesDashboardView";

export const metadata: Metadata = {
  title: "My Notes — AlgoGuru",
  description:
    "Review, edit, search, and export your personal study notes across practice problems, Core Java, and System Design.",
};

export default function NotesPage() {
  return <NotesDashboardView />;
}
