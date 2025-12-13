import { useMemo } from "react";

export default function useLessonSections(lessonFromTree) {
  const sectionsByType = useMemo(() => {
    const map = {
      GRAMMAR: null,
      KANJI: null,
      VOCABULARY: null,
      QUIZ: null,
    };

    const list = lessonFromTree?.sections || [];
    list.forEach((sec) => {
      const type = sec.studyType || sec.contentType;
      if (type && map[type] == null) map[type] = sec;
    });

    return map;
  }, [lessonFromTree]);

  const extractContentFromSection = (section) => {
    let assetContent = null;
    let descContent = null;
    let flashcardContent = null;

    (section?.contents || []).forEach((c) => {
      if (c.contentFormat === "ASSET" && c.primaryContent) assetContent = c;
      if (c.contentFormat === "RICH_TEXT") descContent = c;
      if (c.contentFormat === "FLASHCARD_SET") flashcardContent = c;
    });

    return { assetContent, descContent, flashcardContent };
  };

  return {
    sectionsByType,
    extractContentFromSection,
  };
}
