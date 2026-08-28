import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, CheckCircle2, Code2, Flame, Layers, Sparkles, Target, Timer, TrendingUp } from "lucide-react";
import { cppInterviewTopics } from "@/data/cppInterviewData";
import { useCppUserState } from "@/hooks/useCppUserState";
import { useCppBookmarks } from "@/hooks/useCppBookmarks";
import { getAllCppQuestions, getCppTopicCount } from "@/lib/cppQuestionIndex";
import { getCppQuestionDetailPath } from "@/data/cppInterviewMetadata";
import { CppPriorityBadge, CppDifficultyBadge } from "@/components/interview/CppBadges";
import "@/styles/core-java-interview.css";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

const LEARNING_PATHS = [
  { id: "cpp-qa", title: "C++ Q&A", subtitle: "Theory, code & interview-ready answers", icon: Code2, color: "primary" as const, route: "/interview/cpp/language-questions" },
  { id: "data-structure", title: "Data Structure", subtitle: "DSA patterns used in C++ rounds", icon: Target, color: "accent" as const, route: "/interview/cpp/data-structure" },
  { id: "system-design", title: "System Design", subtitle: "Scalable system thinking", icon: Layers, color: "destructive" as const, route: "/interview/cpp/system-design" },
  { id: "sql-structure", title: "SQL Questions", subtitle: "Interview SQL concepts & patterns", icon: Flame, color: "info" as const, route: "/interview/cpp/sql-structure" },
];
const PATH_ICON_STYLES = { primary: "bg-primary/10 border-primary/20 text-primary", accent: "bg-accent/10 border-accent/20 text-accent", destructive: "bg-destructive/10 border-destructive/20 text-destructive", info: "bg-info/10 border-info/20 text-info" };

function countDifficulty(questions: ReturnType<typeof getAllCppQuestions>, difficulty: string){ return questions.filter((q)=> q.meta.difficulty===difficulty).length; }

export default function CppInterviewHub(){
  const navigate = useNavigate();
  const { doneMap } = useCppUserState();
  const { bookmarkedIds } = useCppBookmarks();
  const allQuestions = useMemo(()=> getAllCppQuestions(), []);
  const totalQuestions = allQuestions.length;
  const topicCount = getCppTopicCount();
  const doneCount = allQuestions.filter((q)=> doneMap[q.question.id]).length;
  const progressPct = totalQuestions>0?Math.round((doneCount/totalQuestions)*100):0;
  const easyCount = countDifficulty(allQuestions,"easy");
  const mediumCount = countDifficulty(allQuestions,"medium");
  const hardCount = countDifficulty(allQuestions,"hard");
  const bookmarkedCount = bookmarkedIds.length;

  const mostAsked = useMemo(()=> allQuestions.filter((q)=> q.meta.priority==="very-high").sort((a,b)=> a.index-b.index).slice(0,6),[allQuestions]);
  const continueQuestion = useMemo(()=> allQuestions.find((q)=> q.meta.priority==="very-high" && !doneMap[q.question.id]),[allQuestions,doneMap]);
  const topicStats = useMemo(()=> cppInterviewTopics.map((topic,i)=>{ const done=topic.questions.filter((q)=> doneMap[q.id]).length; return { topic, number:i+1, done, total: topic.questions.length, pct: topic.questions.length>0?Math.round((done/topic.questions.length)*100):0 }; }),[doneMap]);

  const totalWords = useMemo(()=> allQuestions.reduce((sum,q)=> sum+(q.question.answer?.split(/\s+/).length ??0),0),[allQuestions]);
  const fullReadMinutes = Math.max(5, Math.round(totalWords/200));
  const quickRevisionMinutes = useMemo(()=>{ const words=allQuestions.filter((q)=> q.meta.priority==="very-high"||q.meta.priority==="high").reduce((sum,q)=> sum+(q.question.explanation?.split(/\s+/).length ??0),0); return Math.max(10, Math.round(words/250)); },[allQuestions]);
  const learningPaths = LEARNING_PATHS.map((p)=> p.id==="cpp-qa"?{...p, subtitle:`${totalQuestions} interview questions with answers`}:p);

  return (
    <div className="cjh-page min-h-screen text-foreground selection:bg-primary/20">
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-10 lg:px-16 py-8 md:py-12">
        <motion.nav {...fadeUp} transition={{duration:0.4}} aria-label="Breadcrumb" className="cjh-breadcrumb text-[11px] text-muted-foreground mb-8 font-mono">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span aria-hidden="true" className="opacity-40">/</span>
          <Link to="/interview" className="hover:text-primary transition-colors">Interview</Link>
          <span aria-hidden="true" className="opacity-40">/</span>
          <span className="text-foreground font-semibold">C++</span>
        </motion.nav>

        <motion.header initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.55, ease:[0.22,1,0.36,1]}} className="cjh-hero p-6 md:p-10 lg:p-12 mb-10">
          <div className="cjh-hero-glow" aria-hidden="true"/>
          <div className="cjh-hero-accent" aria-hidden="true"/>
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="cjh-hero-badge mb-5"><Code2 size={13}/> C++ Interview Preparation</div>
              <h1 className="cjh-hero-title text-3xl md:text-[2.75rem] lg:text-5xl 2xl:text-[3.5rem] font-bold leading-[1.1] mb-4">
                Master C++. Prepare smarter. <span>Crack the interview.</span>
              </h1>
              <p className="text-[15px] md:text-base text-muted-foreground leading-relaxed mb-7 max-w-xl">
                Structured path through C++ basics, memory & RAII, pointers, OOP, STL, templates, concurrency and modern C++ (11/17/20/23) — with code snippets and interview-ready answers.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={()=> continueQuestion ? navigate(getCppQuestionDetailPath(continueQuestion.question)) : navigate("/interview/cpp/language-questions")} className="cjh-btn-primary">
                  {progressPct>0?"Continue Learning":"Start Learning"} <ArrowRight size={15}/>
                </button>
                <Link to="/interview/cpp/language-questions" className="cjh-btn-secondary">Explore Questions</Link>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[{label:"Questions", value:`${totalQuestions}+`},{label:"Topics", value:String(topicCount)},{label:"Difficulty Mix", value:null, custom:(<span className="text-xs font-bold leading-relaxed"><span className="text-success">{easyCount}E</span>{" · "}<span className="text-warning">{mediumCount}M</span>{" · "}<span className="text-destructive">{hardCount}H</span></span>)},{label:"Modern C++", value:"11–23"}].map((stat)=>(
                <div key={stat.label} className="cjh-stat-card">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-foreground">{stat.custom ?? stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.header>

        {progressPct>0 ? (
          <motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.45, delay:0.1}} className="cjh-progress-card p-5 md:p-6 mb-12" aria-label="Your C++ interview progress">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="cjh-section-icon"><TrendingUp size={16}/></div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Your Progress</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of {totalQuestions} questions completed{bookmarkedCount>0 && ` · ${bookmarkedCount} bookmarked`}</p>
                </div>
              </div>
              <span className="text-2xl font-semibold tracking-[-0.02em] text-primary">{progressPct}%</span>
            </div>
            <div className="cjh-progress-track" role="progressbar" aria-label="Overall progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}><div className="cjh-progress-fill" style={{width:`${progressPct}%`}}/></div>
            {continueQuestion && <button type="button" onClick={()=> navigate(getCppQuestionDetailPath(continueQuestion.question))} className="mt-4 cjh-btn-primary text-xs py-2 px-4 min-h-0">Pick up where you left off <ArrowRight size={13}/></button>}
          </motion.section>
        ) : (
          <motion.button type="button" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.45, delay:0.1}} onClick={()=> continueQuestion ? navigate(getCppQuestionDetailPath(continueQuestion.question)) : navigate("/interview/cpp/language-questions")} className="cjh-progress-card w-full px-5 py-4 mb-12 flex items-center justify-between gap-4 group text-left" aria-label="Start your C++ interview progress">
            <div className="flex items-center gap-3 min-w-0"><div className="cjh-section-icon shrink-0"><TrendingUp size={16}/></div><p className="text-sm font-semibold truncate">Track your progress across {totalQuestions} questions<span className="hidden md:inline text-muted-foreground font-normal"> — answer your first question to begin</span></p></div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary whitespace-nowrap shrink-0">Get started <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform"/></span>
          </motion.button>
        )}

        <motion.section className="mb-14" aria-labelledby="learning-paths-heading" variants={stagger} initial="initial" whileInView="animate" viewport={{once:true, margin:"-40px"}}>
          <div className="cjh-section-header">
            <h2 id="learning-paths-heading" className="cjh-section-title"><span className="cjh-section-icon"><Layers size={16}/></span> Learning Paths</h2>
            <span className="cjh-section-meta">4 tracks · pick your focus</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningPaths.map((path,i)=>{ const Icon=path.icon; return (<motion.div key={path.id} variants={fadeUp} transition={{delay:i*0.05}}><Link to={path.route} className={`cjh-path-card cjh-path-card--${path.color} group`}><div className={`cjh-path-icon border ${PATH_ICON_STYLES[path.color]}`}><Icon size={20}/></div><h3 className="text-[15px] font-bold mb-1.5 group-hover:text-primary transition-colors relative z-10">{path.title}</h3><p className="text-xs text-muted-foreground leading-relaxed relative z-10 flex-1">{path.subtitle}</p><span className="cjh-path-arrow relative z-10">Open track <ArrowRight size={12}/></span></Link></motion.div>); })}
          </div>
        </motion.section>

        <motion.section className="mb-14" aria-labelledby="roadmap-heading" variants={stagger} initial="initial" whileInView="animate" viewport={{once:true, margin:"-40px"}}>
          <div className="cjh-section-header">
            <h2 id="roadmap-heading" className="cjh-section-title"><span className="cjh-section-icon"><Target size={16}/></span> Interview Roadmap</h2>
            <span className="cjh-section-meta">{topicCount} topics · {totalQuestions} questions</span>
          </div>
          <div className="cjh-roadmap grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {topicStats.map(({topic,number,done,total,pct},i)=>(
              <motion.div key={topic.id} variants={fadeUp} transition={{delay:i*0.03}}>
                <Link to={`/interview/cpp/language-questions?topic=${topic.id}`} className={`cjh-topic-card group ${pct===100?"cjh-topic-card--complete":""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="cjh-topic-emoji" aria-hidden="true">{topic.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{topic.title}</h3>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Topic {String(number).padStart(2,"0")} · {done}/{total} solved</p>
                    </div>
                    {pct===100 && <CheckCircle2 size={16} className="text-success shrink-0" aria-label="Complete"/>}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label={`${topic.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full transition-[width] duration-500" style={{width:`${pct}%`, background: pct===100?"hsl(var(--success))":"hsl(var(--primary))"}}/></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="mb-14" aria-labelledby="most-asked-heading" variants={stagger} initial="initial" whileInView="animate" viewport={{once:true, margin:"-40px"}}>
          <div className="cjh-section-header">
            <h2 id="most-asked-heading" className="cjh-section-title"><span className="cjh-section-icon"><Flame size={16}/></span> Most Asked Questions</h2>
            <Link to="/interview/cpp/language-questions?filter=most-asked" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {mostAsked.map((entry,i)=>(
              <motion.div key={entry.question.id} variants={fadeUp} transition={{delay:i*0.05}}>
                <Link to={getCppQuestionDetailPath(entry.question)} className="cjh-question-card group">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">Q{String(entry.index+1).padStart(2,"0")}</span>
                    {entry.meta.difficulty && <CppDifficultyBadge difficulty={entry.meta.difficulty}/>}
                  </div>
                  <h3 className="text-[14px] font-semibold leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2 flex-1">{entry.question.question}</h3>
                  <div className="mt-auto">{entry.meta.priority && <CppPriorityBadge priority={entry.meta.priority}/>}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section className="mb-14" aria-labelledby="quick-revision-heading" initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}>
          <div className="cjh-revision-banner p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest font-mono mb-2"><Sparkles size={12}/> ~{quickRevisionMinutes} min revision</div>
              <h2 id="quick-revision-heading" className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2"><Timer size={20} className="text-primary"/> Interview tomorrow?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">Skim the highest-priority questions first — theory, code, and one-line takeaways designed for last-minute revision.</p>
            </div>
            <button type="button" onClick={()=> navigate("/interview/cpp/language-questions?filter=most-asked")} className="cjh-btn-primary shrink-0">Start Quick Revision <ArrowRight size={15}/></button>
          </div>
        </motion.section>

        <motion.section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Study stats" variants={stagger} initial="initial" whileInView="animate" viewport={{once:true}}>
          {[{icon:Bookmark,label:"Bookmarks",value:bookmarkedCount,sub:"saved questions",iconClass:"bg-primary/10 text-primary"},{icon:CheckCircle2,label:"Completed",value:doneCount,sub:`of ${totalQuestions} questions`,iconClass:"bg-success/10 text-success"},{icon:Timer,label:"Full Read",value:`~${fullReadMinutes} min`,sub:"all answers",iconClass:"bg-warning/10 text-warning"},{icon:Flame,label:"Quick Revision",value:`~${quickRevisionMinutes} min`,sub:"high-priority essentials",iconClass:"bg-destructive/10 text-destructive"}].map((stat,i)=>{ const Icon=stat.icon; return (<motion.div key={stat.label} variants={fadeUp} transition={{delay:i*0.05}}><div className="cjh-footer-stat"><div className={`cjh-footer-stat-icon ${stat.iconClass}`}><Icon size={14}/></div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-1">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p><p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p></div></motion.div>); })}
        </motion.section>
      </div>
    </div>
  );
}
