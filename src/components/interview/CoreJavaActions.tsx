import { memo, useCallback, useState } from "react";
import { Bookmark, BookmarkCheck, Copy, Check, Share2, CircleCheck, Circle } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CoreJavaBookmarkButtonProps {
  questionId: string;
  isBookmarked: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}

export const CoreJavaBookmarkButton = memo(function CoreJavaBookmarkButton({
  questionId,
  isBookmarked,
  onToggle,
  compact = false,
}: CoreJavaBookmarkButtonProps) {
  const handleClick = useCallback(() => onToggle(questionId), [onToggle, questionId]);

  return (
    <AppTooltip content={isBookmarked ? "Remove bookmark" : "Bookmark question"}>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border font-semibold transition-all duration-200 active:scale-95",
          compact ? "px-2.5 py-1.5 min-h-[36px]" : "px-3.5 py-2 min-h-[40px]",
          isBookmarked
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        {!compact && <span className="text-xs">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>}
      </button>
    </AppTooltip>
  );
});

interface CoreJavaLearnedButtonProps {
  questionId: string;
  isLearned: boolean;
  isUpserting: boolean;
  onToggle: (id: string) => void;
  compact?: boolean;
}

export const CoreJavaLearnedButton = memo(function CoreJavaLearnedButton({
  questionId,
  isLearned,
  isUpserting,
  onToggle,
  compact = false,
}: CoreJavaLearnedButtonProps) {
  const handleClick = useCallback(() => onToggle(questionId), [onToggle, questionId]);

  return (
    <AppTooltip content={isLearned ? "Mark as not learned" : "Mark as learned"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isUpserting}
        aria-pressed={isLearned}
        aria-label={isLearned ? "Mark as not learned" : "Mark as learned"}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60",
          compact ? "px-2.5 py-1.5 min-h-[36px]" : "px-3.5 py-2 min-h-[40px]",
          isLearned
            ? "bg-success/15 border-success/40 text-success"
            : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {isLearned ? <CircleCheck size={15} /> : <Circle size={15} />}
        {!compact && <span className="text-xs">{isLearned ? "Learned" : "Mark as Learned"}</span>}
      </button>
    </AppTooltip>
  );
});

interface CoreJavaShareButtonProps {
  url: string;
  title?: string;
  compact?: boolean;
}

export const CoreJavaShareButton = memo(function CoreJavaShareButton({
  url,
  title,
  compact = false,
}: CoreJavaShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: title ?? "Core Java Interview Question",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled — fall through to copy.
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — leave button state unchanged.
    }
  }, [url, title]);

  return (
    <AppTooltip content={copied ? "Link copied" : "Share question"}>
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share question"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground font-semibold transition-all duration-200 active:scale-95",
          compact ? "px-2.5 py-1.5 min-h-[36px]" : "px-3.5 py-2 min-h-[40px]"
        )}
      >
        {copied ? <Check size={15} className="text-success" /> : <Share2 size={15} />}
        {!compact && <span className="text-xs">{copied ? "Copied" : "Share"}</span>}
      </button>
    </AppTooltip>
  );
});

interface CoreJavaCopyTextButtonProps {
  text: string;
  label?: string;
}

export const CoreJavaCopyTextButton = memo(function CoreJavaCopyTextButton({
  text,
  label = "Copy",
}: CoreJavaCopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border font-medium text-[11px] transition-all duration-200 active:scale-95",
        copied
          ? "bg-success/10 border-success/30 text-success"
          : "bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
});
