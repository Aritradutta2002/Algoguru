import { memo } from "react";
import type { ReactNode } from "react";

function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\`[^\`]+\`)/g;
  let last = 0, k = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) parts.push(<strong key={k++} className="font-bold text-foreground">{token.slice(2,-2)}</strong>);
    else parts.push(<code key={k++} className="font-mono text-[0.85em] font-medium px-1.5 py-[2px] rounded-md bg-primary/10 text-primary border border-primary/20 mx-[1px]">{token.slice(1,-1)}</code>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  if (parts.length===0) return text;
  if (parts.length===1 && typeof parts[0]==="string") return parts[0];
  return <>{parts}</>;
}

function renderTheoryContent(answer: string): ReactNode {
  if(!answer) return null;
  const sections = answer.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-6 font-sans">
      {sections.map((section, idx)=>{
        const lines = section.split("\n").filter(Boolean);
        const isBullet = lines.every((l)=> l.trim().startsWith("- "));
        const isNumbered = lines.every((l)=> /^\d+\./.test(l.trim()));
        const isHeading = lines.length===1 && (lines[0].startsWith("##") || (lines[0].endsWith(":") && lines[0].length<70) || (lines[0].length<55 && !lines[0].endsWith(".") && !lines[0].startsWith("-")));
        if(isHeading) return <div key={idx} className="flex items-center gap-3 pt-3"><span className="w-1 h-6 rounded-full bg-primary shrink-0"/><h4 className="text-[18px] font-bold text-foreground tracking-tight">{lines[0].replace(/^#{1,3}\s*/,"").replace(/:$/,"")}</h4></div>;
        if(isBullet) return <ul key={idx} className="space-y-3">{lines.map((l,i)=><li key={i} className="flex items-start gap-3.5 text-[16px] leading-[1.85] text-foreground/90"><span className="mt-[10px] w-2 h-2 rounded-full bg-primary/70 shrink-0"/><span>{parseInline(l.replace(/^- /,""))}</span></li>)}</ul>;
        if(isNumbered) return <ol key={idx} className="space-y-3.5">{lines.map((l,i)=><li key={i} className="flex items-start gap-4 text-[16px] leading-[1.85]"><span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-[12px] font-bold flex items-center justify-center mt-[2px]">{i+1}</span><span className="text-foreground/90">{parseInline(l.replace(/^\d+\.\s*/,""))}</span></li>)}</ol>;
        return <div key={idx} className="space-y-3">{lines.map((l,i)=><p key={i} className="text-[16px] leading-[1.9] text-foreground/90">{parseInline(l)}</p>)}</div>;
      })}
    </div>
  );
}

export const CppQuestionAnswer = memo(function CppQuestionAnswer({ answer }: { answer: string }){
  return <>{renderTheoryContent(answer)}</>;
});
