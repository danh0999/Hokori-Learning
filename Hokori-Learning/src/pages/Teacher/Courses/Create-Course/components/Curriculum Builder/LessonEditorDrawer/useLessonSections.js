// LessonEditorDrawer/useLessonSections.js
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { createSectionThunk } from "../../../../../../../redux/features/teacherCourseSlice.js";

export default function useLessonSections(lessonFromTree) {
  const dispatch = useDispatch();
  const [refreshFlag, setRefreshFlag] = useState(0);

  const sectionsByType = useMemo(() => {
    const map = { GRAMMAR: null, KANJI: null, VOCABULARY: null };
    const list = lessonFromTree?.sections || [];
    list.forEach((sec) => {
      const type = sec.studyType || sec.contentType;
      if (type && map[type] == null) {
        map[type] = sec;
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFromTree, refreshFlag]);

  const extractContent = (section) => {
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

  const grammarInfo = extractContent(sectionsByType.GRAMMAR);
  const kanjiInfo = extractContent(sectionsByType.KANJI);
  const vocabInfo = extractContent(sectionsByType.VOCABULARY);

  const ensureSection = async (type) => {
    if (!lessonFromTree?.id) throw new Error("Missing lessonId");

    if (sectionsByType[type]) return sectionsByType[type];

    const created = await dispatch(
      createSectionThunk({
        lessonId: lessonFromTree.id,
        data: {
          title:
            type === "GRAMMAR"
              ? "Grammar"
              : type === "KANJI"
              ? "Kanji"
              : "Vocabulary",
          orderIndex: (lessonFromTree.sections?.length || 0) + 1,
          studyType: type,
          flashcardSetId: null,
        },
      })
    ).unwrap();

    // “búng” flag để useMemo tính lại sectionsByType
    setRefreshFlag((f) => f + 1);
    return created.section || created;
  };

  return {
    sectionsByType,
    grammarInfo,
    kanjiInfo,
    vocabInfo,
    ensureSection,
  };
}
