import { memo, useCallback, useState } from "react";
import { Bookmark, BookmarkCheck, Copy, Check, Share2, CircleCheck, Circle } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const CppBookmarkButton = memo(function CppBookmarkButton({ questionId, isBookmarked, onToggle, compact=false }: { questionId:string; isBookmarked:boolean; onToggle:(id:string)=>void; compact?:boolean }){
  const handleClick=useCallback(()=> onToggle(questionId),[onToggle,questionId]);
  return (
    <AppTooltip content={isBookmarked ? "Remove bookmark" : "Bookmark question"}>
      <button type="button" onClick={handleClick} aria-pressed={isBookmarked} aria-label={isBookmarked?"Remove bookmark":"Bookmark question"} className={cn("inline-flex items-center gap-2 rounded-lg border font-semibold transition-all duration-200 ", compact?"px-2.5 py-1.5 min-h-[36px]":"px-3.5 py-2 min-h-[40px]", isBookmarked?"bg-primary/15 border-primary/40 text-primary":"bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
        {isBookmarked ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>}
        {!compact && <span className="text-xs">{isBookmarked?"Bookmarked":"Bookmark"}</span>}
      </button>
    </AppTooltip>
  );
});

export const CppLearnedButton = memo(function CppLearnedButton({ questionId, isLearned, isUpserting, onToggle, compact=false }: { questionId:string; isLearned:boolean; isUpserting:boolean; onToggle:(id:string)=>void; compact?:boolean }){
  const handleClick=useCallback(()=> onToggle(questionId),[onToggle,questionId]);
  return (
    <AppTooltip content={isLearned ? "Mark as not learned" : "Mark as learned"}>
      <button type="button" onClick={handleClick} disabled={isUpserting} aria-pressed={isLearned} aria-label={isLearned?"Mark as not learned":"Mark as learned"} className={cn("inline-flex items-center gap-2 rounded-lg border font-semibold transition-all duration-200 disabled:opacity-60", compact?"px-2.5 py-1.5 min-h-[36px]":"px-3.5 py-2 min-h-[40px]", isLearned?"bg-success/15 border-success/40 text-success":"bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
        {isLearned ? <CircleCheck size={15}/> : <Circle size={15}/>}
        {!compact && <span className="text-xs">{isLearned?"Learned":"Mark as Learned"}</span>}
      </button>
    </AppTooltip>
  );
});

export const CppShareButton = memo(function CppShareButton({ url, title, compact=false }: { url:string; title?:string; compact?:boolean }){
  const [copied,setCopied]=useState(false);
  const handleShare=useCallback(async()=>{
    const shareData={ title: title ?? "C++ Interview Question", url };
    try{ if(navigator.share){ await navigator.share(shareData); return; } } catch{}
    try{ await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch{}
  },[url,title]);
  return (
    <AppTooltip content={copied ? "Link copied" : "Share question"}>
      <button type="button" onClick={handleShare} aria-label="Share question" className={cn("inline-flex items-center gap-2 rounded-lg border bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground font-semibold transition-all duration-200 ", compact?"px-2.5 py-1.5 min-h-[36px]":"px-3.5 py-2 min-h-[40px]")}>
        {copied ? <Check size={15} className="text-success"/> : <Share2 size={15}/>}
        {!compact && <span className="text-xs">{copied?"Copied":"Share"}</span>}
      </button>
    </AppTooltip>
  );
});

export const CppCopyTextButton = memo(function CppCopyTextButton({ text, label="Copy" }: { text:string; label?:string }){
  const [copied,setCopied]=useState(false);
  const handleCopy=useCallback(async()=>{ try{ await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000);}catch{} },[text]);
  return (
    <button type="button" onClick={handleCopy} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border font-medium text-[11px] transition-all duration-200 ", copied?"bg-success/10 border-success/30 text-success":"bg-card border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
      {copied ? <Check size={12}/> : <Copy size={12}/>}
      {copied ? "Copied" : label}
    </button>
  );
});
