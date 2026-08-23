import type { InterviewTopic } from "./pythonInterviewMetadataBase";
import { pythonTopicsPart1 } from "./pythonDataCore";
import { pythonTopicsPart2 } from "./pythonDataStringsCollections";
import { pythonTopicsPart3 } from "./pythonDataFunctionsGenerators";
import { pythonTopicsPart4 } from "./pythonDataOopDecorators";
import { pythonTopicsPart5 } from "./pythonDataIoModulesMemory";
import { pythonTopicsPart6 } from "./pythonDataConcurrencyAdvanced";

export const pythonInterviewTopics: InterviewTopic[] = [
  ...pythonTopicsPart1,
  ...pythonTopicsPart2,
  ...pythonTopicsPart3,
  ...pythonTopicsPart4,
  ...pythonTopicsPart5,
  ...pythonTopicsPart6,
];

export function getTotalPythonQuestionCount(): number {
  return pythonInterviewTopics.reduce((sum, topic) => sum + topic.questions.length, 0);
}
