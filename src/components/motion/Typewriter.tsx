import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface TypewriterProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  /** Pause (ms) on a completed word before deleting. */
  pause?: number;
}

/**
 * Cycles through `words` with a typing/deleting effect and blinking caret.
 * Renders the first word statically when the user prefers reduced motion.
 * The animated text is decorative — screen readers get the full word list.
 */
export function Typewriter({
  words,
  className,
  typingSpeed = 65,
  deletingSpeed = 35,
  pause = 1700,
}: TypewriterProps) {
  const reduce = useReducedMotion();
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const [text, setText] = useState(words[0] ?? "");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState((words[0] ?? "").length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const list = wordsRef.current;
    if (list.length <= 1) return;
    const current = list[wordIndex % list.length];

    let delay: number;
    if (!deleting && charIndex < current.length) delay = typingSpeed;
    else if (!deleting) delay = pause;
    else if (charIndex > 0) delay = deletingSpeed;
    else delay = 350;

    const timer = setTimeout(() => {
      if (!deleting && charIndex < current.length) {
        setCharIndex(charIndex + 1);
        setText(current.slice(0, charIndex + 1));
      } else if (!deleting) {
        setDeleting(true);
      } else if (charIndex > 0) {
        setCharIndex(charIndex - 1);
        setText(current.slice(0, charIndex - 1));
      } else {
        setDeleting(false);
        setWordIndex((wordIndex + 1) % list.length);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [charIndex, deleting, wordIndex, typingSpeed, deletingSpeed, pause, reduce]);

  if (reduce) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={className}>
      <span className="sr-only">{words.join(" ")}</span>
      <span aria-hidden="true">{text}</span>
      <span aria-hidden="true" className="typewriter-caret" />
    </span>
  );
}
