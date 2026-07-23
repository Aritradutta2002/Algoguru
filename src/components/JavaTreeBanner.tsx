import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { javaTopics } from "@/data/javaTopics";
import { ArrowRight, Sparkles } from "lucide-react";

interface TreeNode {
  id: string;
  title: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  subtopics: number;
  level: number;
}

export function JavaTreeBanner() {
  const navigate = useNavigate();

  // Full horizontal tree layout - all topics spread across width
  const treeNodes: TreeNode[] = [
    // Level 1 - Foundation
    { id: "java-basics", title: "Java\nFundamentals", icon: "☕", color: "#A8A4F5", x: 50, y: 120, subtopics: 10, level: 1 },
    
    // Level 2 - Core OOP
    { id: "java-oop", title: "OOP\nConcepts", icon: "◈", color: "#FCBA7C", x: 200, y: 120, subtopics: 10, level: 2 },
    { id: "java-exceptions", title: "Exception\nHandling", icon: "⚡", color: "#F4A396", x: 350, y: 120, subtopics: 7, level: 2 },
    
    // Level 3 - Collections & Data
    { id: "java-collections", title: "Collections\nFramework", icon: "▤", color: "#9BE2C3", x: 500, y: 120, subtopics: 13, level: 3 },
    { id: "java-generics", title: "Generics", icon: "⟨T⟩", color: "#99C2F8", x: 650, y: 120, subtopics: 6, level: 3 },
    
    // Level 4 - Modern Java
    { id: "java-streams", title: "Streams &\nLambdas", icon: "λ", color: "#E0A8F5", x: 800, y: 120, subtopics: 9, level: 4 },
    
    // Level 5 - Concurrency & I/O
    { id: "java-multithreading", title: "Multi-\nthreading", icon: "⇶", color: "#A8A4F5", x: 950, y: 120, subtopics: 10, level: 5 },
    { id: "java-io", title: "I/O & File\nHandling", icon: "📁", color: "#FCBA7C", x: 1100, y: 120, subtopics: 6, level: 5 },
    
    // Level 6 - Database
    { id: "java-jdbc", title: "JDBC &\nDatabase", icon: "🗄️", color: "#99C2F8", x: 1250, y: 120, subtopics: 5, level: 6 },
    { id: "java-sql", title: "SQL\nMastery", icon: "📊", color: "#9BE2C3", x: 1400, y: 120, subtopics: 19, level: 6 },
    
    // Level 7 - Advanced
    { id: "java-advanced", title: "Advanced\nJava", icon: "🔥", color: "#F4A396", x: 1550, y: 120, subtopics: 9, level: 7 },
  ];

  const connections = [
    ["java-basics", "java-oop"],
    ["java-oop", "java-exceptions"],
    ["java-exceptions", "java-collections"],
    ["java-collections", "java-generics"],
    ["java-generics", "java-streams"],
    ["java-streams", "java-multithreading"],
    ["java-multithreading", "java-io"],
    ["java-io", "java-jdbc"],
    ["java-jdbc", "java-sql"],
    ["java-sql", "java-advanced"],
  ];

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 via-white to-purple-50 border-b-4 border-purple-200 overflow-hidden py-12 md:py-16">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        {/* Banner Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold uppercase tracking-widest mb-3 shadow-lg">
            <Sparkles size={14} />
            Complete Learning Path
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Java Mastery Tree
            </span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2 max-w-3xl mx-auto">
            Click any topic to start learning • 11 comprehensive modules • From basics to advanced
          </p>
        </motion.div>

        {/* Full-Width Horizontal Tree */}
        <div className="relative bg-white rounded-3xl shadow-2xl border-2 border-purple-100 p-6 md:p-10 overflow-x-auto">
          <svg
            viewBox="0 0 1700 280"
            className="w-full"
            style={{ minWidth: "1400px", height: "280px" }}
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A8A4F5" />
                <stop offset="50%" stopColor="#99C2F8" />
                <stop offset="100%" stopColor="#9BE2C3" />
              </linearGradient>
              
              {/* Glow filters for nodes */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connection Path - Main Learning Flow */}
            <motion.path
              d="M 50 140 L 200 140 L 350 140 L 500 140 L 650 140 L 800 140 L 950 140 L 1100 140 L 1250 140 L 1400 140 L 1550 140"
              stroke="url(#pathGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="12 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* Branch Connections */}
            {connections.map(([from, to], idx) => {
              const fromNode = treeNodes.find(n => n.id === from);
              const toNode = treeNodes.find(n => n.id === to);
              if (!fromNode || !toNode) return null;
              
              return (
                <motion.line
                  key={`${from}-${to}`}
                  x1={fromNode.x + 65}
                  y1={fromNode.y + 20}
                  x2={toNode.x + 65}
                  y2={toNode.y + 20}
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                />
              );
            })}

            {/* Topic Nodes */}
            {treeNodes.map((node, index) => (
              <g
                key={node.id}
                onClick={() => navigate(`/${node.id}`)}
                className="cursor-pointer group"
                style={{ transformOrigin: `${node.x + 65}px ${node.y + 20}px` }}
              >
                {/* Glow Circle Background */}
                <motion.circle
                  cx={node.x + 65}
                  cy={node.y + 20}
                  r="42"
                  fill={node.color}
                  opacity="0.15"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.15 }}
                  transition={{ delay: index * 0.08, type: "spring", bounce: 0.6 }}
                  className="group-hover:opacity-30 transition-all duration-300"
                />

                {/* Main Circle */}
                <motion.circle
                  cx={node.x + 65}
                  cy={node.y + 20}
                  r="35"
                  fill="white"
                  stroke={node.color}
                  strokeWidth="3"
                  filter="url(#glow)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08, type: "spring", bounce: 0.5 }}
                  className="group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
                />

                {/* Icon */}
                <motion.text
                  x={node.x + 65}
                  y={node.y + 30}
                  textAnchor="middle"
                  fontSize="24"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.2 }}
                >
                  {node.icon}
                </motion.text>

                {/* Title Box */}
                <motion.rect
                  x={node.x + 10}
                  y={node.y + 60}
                  width="110"
                  height="50"
                  rx="10"
                  fill="white"
                  stroke={node.color}
                  strokeWidth="2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                  className="group-hover:fill-gray-50 transition-colors duration-300"
                />

                {/* Title Text */}
                <motion.text
                  x={node.x + 65}
                  y={node.y + 75}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#1f2937"
                  className="uppercase tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.4 }}
                >
                  {node.title.split("\n").map((line, i) => (
                    <tspan key={i} x={node.x + 65} dy={i === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </motion.text>

                {/* Subtopic Badge */}
                <motion.circle
                  cx={node.x + 100}
                  cy={node.y + 5}
                  r="11"
                  fill={node.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 + 0.5, type: "spring" }}
                />
                <text
                  x={node.x + 100}
                  y={node.y + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="white"
                >
                  {node.subtopics}
                </text>

                {/* Level Indicator */}
                <motion.text
                  x={node.x + 65}
                  y={node.y + 130}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={node.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: index * 0.08 + 0.6 }}
                  className="uppercase tracking-wider"
                >
                  Level {node.level}
                </motion.text>
              </g>
            ))}

            {/* Start Arrow */}
            <motion.g
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <text x="10" y="145" fontSize="11" fontWeight="700" fill="#9333ea" className="uppercase tracking-wider">
                Start →
              </text>
            </motion.g>

            {/* End Arrow */}
            <motion.g
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <text x="1620" y="145" fontSize="11" fontWeight="700" fill="#9333ea" className="uppercase tracking-wider">
                → Master
              </text>
            </motion.g>
          </svg>

          {/* Mobile Scroll Hint */}
          <div className="md:hidden flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
            <ArrowRight size={12} />
            <span>Scroll right to see all topics</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-4 mt-8 flex-wrap"
        >
          <button
            onClick={() => navigate("/java-basics")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            Start Learning
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => {
              document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-purple-50 transition-all flex items-center gap-2"
          >
            Explore All Modules
          </button>
        </motion.div>
      </div>
    </div>
  );
}
