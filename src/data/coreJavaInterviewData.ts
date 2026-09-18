/**
 * Core Java interview question bank — public entry point.
 *
 * The `InterviewQuestion` / `InterviewTopic` interfaces live here and are
 * imported by the C++ and Python interview data modules, so this module must
 * keep exporting them from this exact path.
 *
 * Question content itself is authored in `src/data/coreJavaQuestions/*`
 * (one file per topic range) and aggregated here. Edit content there, not here.
 */
import { TOPIC_DEFINITIONS } from "./coreJavaQuestions/topics";
import { questionsByTopicId } from "./coreJavaQuestions";

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  code?: string;
  codeLanguage?: string;
  explanation: string;
  visualization?: string;
  followUpQuestions?: string[];
}

export interface InterviewTopic {
  id: string;
  title: string;
  icon: string;
  questions: InterviewQuestion[];
}

/**
 * Topics in curriculum order. The rendered question number ("Question N") is
 * derived from array position in `coreJavaQuestionIndex`, so both the topic
 * order and the question order inside each topic are significant.
 */
export const coreJavaInterviewTopics: InterviewTopic[] = TOPIC_DEFINITIONS.map(
  (topic) => ({
    id: topic.id,
    title: topic.title,
    icon: topic.icon,
    questions: questionsByTopicId[topic.id] ?? [],
  })
);