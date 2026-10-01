import type { LessonDefinition, LessonId } from "../types";
import lessonData from "./lessons.json";

// JSON is the shared source for the web lessons and offline narration generation.
export const lessons = lessonData as LessonDefinition[];

export function getLesson(id: LessonId | string): LessonDefinition | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
