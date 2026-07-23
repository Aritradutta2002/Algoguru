export interface MindMapNode {
  id: string;
  name: string;
  level: number;
  color: string;
  children?: MindMapNode[];
  collapsed?: boolean;
}

export const javaMindMapData: MindMapNode = {
  id: "java-root",
  name: "Java",
  level: 0,
  color: "#A855F7",
  children: [
    {
      id: "core-java",
      name: "Core Java",
      level: 1,
      color: "#A855F7",
      collapsed: true,
      children: [
        {
          id: "multithreading",
          name: "Multithreading",
          level: 2,
          color: "#9333EA",
          collapsed: true,
          children: [
            { id: "thread-basics", name: "Thread Basics", level: 3, color: "#7C3AED" },
            { id: "synchronization", name: "Synchronization", level: 3, color: "#7C3AED" },
            { id: "executors", name: "Executors", level: 3, color: "#7C3AED" },
            {
              id: "concurrent-collections",
              name: "Concurrent Collections",
              level: 3,
              color: "#7C3AED",
            },
            { id: "locks-conditions", name: "Locks & Conditions", level: 3, color: "#7C3AED" },
            { id: "atomic-variables", name: "Atomic Variables", level: 3, color: "#7C3AED" },
          ],
        },
        {
          id: "collections",
          name: "Collections Framework",
          level: 2,
          color: "#9333EA",
        },
        { id: "oop", name: "OOP Concepts", level: 2, color: "#9333EA" },
        { id: "exceptions", name: "Exception Handling", level: 2, color: "#9333EA" },
        { id: "streams", name: "Streams & Lambda", level: 2, color: "#9333EA" },
        { id: "generics", name: "Generics", level: 2, color: "#9333EA" },
      ],
    },
    {
      id: "advance-java",
      name: "Advance Java",
      level: 1,
      color: "#3B82F6",
      collapsed: true,
      children: [
        { id: "spring", name: "Spring Framework", level: 2, color: "#2563EB" },
        { id: "hibernate", name: "Hibernate ORM", level: 2, color: "#2563EB" },
        { id: "microservices", name: "Microservices", level: 2, color: "#2563EB" },
        { id: "rest-api", name: "REST APIs", level: 2, color: "#2563EB" },
        { id: "security", name: "Security", level: 2, color: "#2563EB" },
      ],
    },
    {
      id: "prerequisites",
      name: "Prerequisites",
      level: 1,
      color: "#10B981",
      collapsed: true,
      children: [
        { id: "data-structures", name: "Data Structures", level: 2, color: "#059669" },
        { id: "algorithms", name: "Algorithms", level: 2, color: "#059669" },
        { id: "design-patterns", name: "Design Patterns", level: 2, color: "#059669" },
        { id: "system-design", name: "System Design", level: 2, color: "#059669" },
      ],
    },
    {
      id: "modules",
      name: "Java Modules",
      level: 1,
      color: "#F59E0B",
      collapsed: true,
      children: [
        { id: "jdk-modules", name: "JDK Modules", level: 2, color: "#D97706" },
        { id: "project-jigsaw", name: "Project Jigsaw", level: 2, color: "#D97706" },
        { id: "module-system", name: "Module System", level: 2, color: "#D97706" },
      ],
    },
  ],
};
