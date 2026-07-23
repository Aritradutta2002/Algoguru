import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { javaTopics } from "@/data/javaTopics";

export default function JavaRoadmapPage() {
  const navigate = useNavigate();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleSubtopicClick = (topicId: string, subtopicId: string) => {
    navigate(`/${topicId}#${subtopicId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all font-semibold text-sm"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Java Complete Roadmap
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">Click topics to expand • Click lessons to learn</p>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-8 mb-12 flex-wrap">
          <div className="text-center">
            <div className="text-3xl font-black text-purple-600">{javaTopics.length}</div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Topics</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-600">
              {javaTopics.reduce((sum, t) => sum + t.subtopics.length, 0)}
            </div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-600">100%</div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Coverage</div>
          </div>
        </div>

        {/* Roadmap Tree */}
        <div className="space-y-6">
          {javaTopics.map((topic, topicIndex) => {
            const isExpanded = expandedTopics.has(topic.id);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: topicIndex * 0.05 }}
                className="relative"
              >
                {/* Connection Line to Next Topic */}
                {topicIndex < javaTopics.length - 1 && (
                  <div className="absolute left-[42px] top-[80px] bottom-[-24px] w-[3px] bg-gradient-to-b from-purple-300 to-blue-300 rounded-full" />
                )}

                {/* Topic Card */}
                <div
                  className={`relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                    isExpanded ? "border-purple-400 shadow-xl shadow-purple-100" : "border-gray-200 shadow-lg hover:border-purple-300"
                  }`}
                >
                  {/* Topic Header */}
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full p-6 flex items-center gap-6 hover:bg-gray-50 transition-all group"
                  >
                    {/* Topic Number Circle */}
                    <div
                      className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${topic.color}20, ${topic.color}40)`,
                        border: `3px solid ${topic.color}`,
                      }}
                    >
                      {topic.icon}
                    </div>

                    {/* Topic Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600">
                          Level {topicIndex + 1}
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                          style={{ background: topic.color }}
                        >
                          {topic.subtopics.length} Lessons
                        </span>
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{topic.title}</h2>
                      <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
                    </div>

                    {/* Expand Icon */}
                    <div className="shrink-0">
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 bg-white group-hover:border-purple-400 transition-colors"
                      >
                        <ChevronDown size={20} className="text-gray-600" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Subtopics List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-purple-50/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6">
                            {topic.subtopics.map((subtopic, subIndex) => (
                              <motion.button
                                key={subtopic.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.03 }}
                                onClick={() => handleSubtopicClick(topic.id, subtopic.id)}
                                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all text-left"
                              >
                                {/* Subtopic Number */}
                                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                  {subIndex + 1}
                                </div>

                                {/* Subtopic Title */}
                                <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                                  {subtopic.title}
                                </span>

                                {/* Arrow Icon */}
                                <ChevronRight
                                  size={16}
                                  className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
                                />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center bg-white rounded-3xl border-2 border-purple-200 p-12 shadow-2xl"
        >
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 mb-6">
            <BookOpen size={48} className="text-purple-600" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Ready to Start Your Journey?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Begin with Java Fundamentals and work your way through to Advanced topics.
            Click any lesson above to dive in!
          </p>
          <button
            onClick={() => navigate("/java-basics")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            Start with Java Fundamentals
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </main>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto px-6 pb-12 text-center">
        <p className="text-xs text-gray-500">
          💡 Tip: Click any topic card to expand and see all lessons • Click a lesson to start learning
        </p>
      </div>
    </div>
  );
}
