"use client";

import { useRef } from "react";
import Link from "next/link";
import { Download, Loader2, StickyNote, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AppTooltip } from "@/components/ui/tooltip";
import { renderNoteMarkdown } from "@/lib/renderNoteMarkdown";

export interface NoteQuestionMeta {
  title: string;
  href?: string;
}

interface InterviewNotesDrawerProps {
  open: boolean;
  onClose: () => void;
  notesMap: Record<string, string>;
  getQuestionMeta: (id: string) => NoteQuestionMeta;
  deletingNoteId: string | null;
  onDeleteNote: (id: string) => void;
  onEditNote?: (id: string) => void;
  onDownloadPdf: () => void;
}

export function InterviewNotesDrawer({
  open,
  onClose,
  notesMap,
  getQuestionMeta,
  deletingNoteId,
  onDeleteNote,
  onEditNote,
  onDownloadPdf,
}: InterviewNotesDrawerProps) {
  const entries = Object.entries(notesMap).filter(([, note]) => Boolean(note));
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const skipReturnFocusRef = useRef(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        showClose={false}
        aria-modal="true"
        onOpenAutoFocus={() => {
          skipReturnFocusRef.current = false;
          returnFocusRef.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (skipReturnFocusRef.current) {
            skipReturnFocusRef.current = false;
            return;
          }
          returnFocusRef.current?.focus();
        }}
        className="flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-border/50 bg-card p-0 shadow-overlay sm:max-w-lg"
      >
            <div className="p-6 border-b border-border/30 flex items-center justify-between bg-card z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <StickyNote size={18} className="text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold leading-none">
                    My Notes
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-[13px] text-muted-foreground">
                    {entries.length} saved note{entries.length === 1 ? "" : "s"}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <AppTooltip content="Download PDF">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onDownloadPdf}
                      className="rounded-full"
                      aria-label="Download notes as PDF"
                    >
                      <Download size={16} />
                    </Button>
                  </AppTooltip>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                  aria-label="Close notes panel"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 bg-muted/5">
              <div className="p-6 space-y-4 min-h-full">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-6">
                      <StickyNote size={28} className="text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No notes yet</h3>
                    <p className="text-[14.5px] text-muted-foreground max-w-[250px]">
                      Add notes to questions while studying. They will appear here for review.
                    </p>
                  </div>
                ) : (
                  entries.map(([id, note]) => {
                    const meta = getQuestionMeta(id);
                    return (
                      <Card
                        key={id}
                        className="p-5 rounded-2xl bg-card border-border/40 shadow-sm relative group transition-all hover:border-border/60"
                      >
                        <div className="pr-8 mb-3">
                          {meta.href ? (
                            <Link
                              href={meta.href}
                              className="font-bold text-[14.5px] leading-snug hover:text-primary transition-colors"
                            >
                              {meta.title}
                            </Link>
                          ) : (
                            <p className="font-bold text-[14.5px] leading-snug">{meta.title}</p>
                          )}
                        </div>
                        <Button variant="bare" size="bare"
                          type="button"
                          onClick={() => onDeleteNote(id)}
                          disabled={deletingNoteId === id}
                          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 disabled:opacity-50"
                          title="Delete note"
                          aria-label="Delete note"
                        >
                          {deletingNoteId === id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                        <div className="bg-muted/20 rounded-xl p-4 border border-border/20">
                          <div
                            className="text-[13.5px] text-foreground/90 prose prose-invert prose-p:leading-relaxed prose-pre:bg-muted/50 max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(note) }}
                          />
                        </div>
                        {onEditNote && (
                          <Button variant="bare" size="bare"
                            type="button"
                            onClick={() => {
                              skipReturnFocusRef.current = true;
                              onEditNote(id);
                              onClose();
                            }}
                            className="mt-2.5 text-[11px] font-semibold text-primary hover:underline"
                          >
                            Edit note →
                          </Button>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
