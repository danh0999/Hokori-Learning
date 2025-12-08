import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data ||
  err.message ||
  "Something went wrong";

/* =========================
   COURSE LEVEL
   ========================= */

// GET teacher/courses  (danh sách khoá của tôi)
export const fetchTeacherCourses = createAsyncThunk(
  "teacherCourse/fetchTeacherCourses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("teacher/courses");
      return res.data?.content || res.data || [];
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// // GET teacher/courses/{id}  (metadata ngắn)
// export const fetchCourseMeta = createAsyncThunk(
//   "teacherCourse/fetchCourseMeta",
//   async (courseId, { rejectWithValue }) => {
//     try {
//       const res = await api.get(`teacher/courses/${courseId}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(getError(err));
//     }
//   }
// );

// POST teacher/courses  (tạo course – chỉ metadata)
export const createCourseThunk = createAsyncThunk(
  "teacherCourse/createCourse",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("teacher/courses", data);
      return res.data; // {id, title, ...}
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/{id} (update metadata)
export const updateCourseThunk = createAsyncThunk(
  "teacherCourse/updateCourse",
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/${courseId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// POST teacher/courses/{courseId}/cover-image (multipart/form-data)
export const uploadCourseCoverThunk = createAsyncThunk(
  "teacherCourse/uploadCourseCover",
  async ({ courseId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `teacher/courses/${courseId}/cover-image`,
        formData,
        {
          // ⚠️ override Content-Type cho request này
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// DELETE teacher/courses/{id}
export const deleteCourseThunk = createAsyncThunk(
  "teacherCourse/deleteCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      console.log(
        "[deleteCourseThunk] calling DELETE teacher/courses/",
        courseId
      );
      const res = await api.delete(`teacher/courses/${courseId}`);
      console.log("[deleteCourseThunk] response status:", res.status);
      // BE có thể trả 200/204, body có hoặc không, kệ – mình chỉ cần biết xoá thành công
      return courseId; // vẫn return id
    } catch (err) {
      console.error("[deleteCourseThunk] error:", err);
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/{id}/publish
export const submitforapprovalCourseThunk = createAsyncThunk(
  "teacherCourse/publishCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `teacher/courses/${courseId}/submit-for-approval`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/{id}/unpublish
export const unpublishCourseThunk = createAsyncThunk(
  "teacherCourse/unpublishCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/${courseId}/unpublish`);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);
// GET teacher/courses/{id}/flag-reason
export const fetchFlagReasonThunk = createAsyncThunk(
  "teacherCourse/fetchFlagReason",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/courses/${courseId}/flag-reason`);
      const body = res.data;
      return body?.data ?? body;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/{id}/resubmit  (course FLAGGED → PENDING_APPROVAL)
export const resubmitFlaggedCourseThunk = createAsyncThunk(
  "teacherCourse/resubmitFlaggedCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/${courseId}/resubmit`);
      const body = res.data;
      return body?.data ?? body;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// GET teacher/courses/{id}/detail  (FULL TREE cho màn soạn)
export const fetchCourseTree = createAsyncThunk(
  "teacherCourse/fetchCourseTree",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/courses/${courseId}/detail`);
      const body = res.data;
      return body?.data ?? body; // phòng trường hợp BE bọc {data: ...}
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   CHAPTER
   ========================= */

// POST teacher/courses/{courseId}/chapters
export const createChapterThunk = createAsyncThunk(
  "teacherCourse/createChapter",
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`teacher/courses/${courseId}/chapters`, data);
      return { courseId, chapter: res.data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/chapters/{chapterId}
export const updateChapterThunk = createAsyncThunk(
  "teacherCourse/updateChapter",
  async ({ chapterId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/chapters/${chapterId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// DELETE teacher/courses/chapters/{chapterId}
export const deleteChapterThunk = createAsyncThunk(
  "teacherCourse/deleteChapter",
  async (chapterId, { rejectWithValue }) => {
    try {
      await api.delete(`teacher/courses/chapters/${chapterId}`);
      return chapterId;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PATCH teacher/courses/chapters/{chapterId}/reorder
export const reorderChapterThunk = createAsyncThunk(
  "teacherCourse/reorderChapter",
  async ({ chapterId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `teacher/courses/chapters/${chapterId}/reorder`,
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   LESSON
   ========================= */

// POST teacher/courses/chapters/{chapterId}/lessons
export const createLessonThunk = createAsyncThunk(
  "teacherCourse/createLesson",
  async ({ chapterId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `teacher/courses/chapters/${chapterId}/lessons`,
        data
      );
      return { chapterId, lesson: res.data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/lessons/{lessonId}
export const updateLessonThunk = createAsyncThunk(
  "teacherCourse/updateLesson",
  async ({ lessonId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/lessons/${lessonId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// DELETE teacher/courses/lessons/{lessonId}
export const deleteLessonThunk = createAsyncThunk(
  "teacherCourse/deleteLesson",
  async ({ chapterId, lessonId }, { rejectWithValue }) => {
    try {
      await api.delete(`teacher/courses/lessons/${lessonId}`);
      return { chapterId, lessonId };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PATCH teacher/courses/lessons/{lessonId}/reorder
export const reorderLessonThunk = createAsyncThunk(
  "teacherCourse/reorderLesson",
  async ({ lessonId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `teacher/courses/lessons/${lessonId}/reorder`,
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   SECTION
   ========================= */

// POST teacher/courses/lessons/{lessonId}/sections
export const createSectionThunk = createAsyncThunk(
  "teacherCourse/createSection",
  async ({ lessonId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `teacher/courses/lessons/${lessonId}/sections`,
        data
      );
      return { lessonId, section: res.data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/sections/{sectionId}
export const updateSectionThunk = createAsyncThunk(
  "teacherCourse/updateSection",
  async ({ sectionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/sections/${sectionId}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// DELETE teacher/courses/sections/{sectionId}
export const deleteSectionThunk = createAsyncThunk(
  "teacherCourse/deleteSection",
  async ({ lessonId, sectionId }, { rejectWithValue }) => {
    try {
      await api.delete(`teacher/courses/sections/${sectionId}`);
      return { lessonId, sectionId };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PATCH teacher/courses/sections/{sectionId}/reorder
export const reorderSectionThunk = createAsyncThunk(
  "teacherCourse/reorderSection",
  async ({ sectionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `teacher/courses/sections/${sectionId}/reorder`,
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// POST teacher/courses/sections/{sectionId}/files (multipart/form-data)
export const uploadSectionFileThunk = createAsyncThunk(
  "teacherCourse/uploadSectionFile",
  async ({ sectionId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `teacher/courses/sections/${sectionId}/files`,
        formData,
        {
          // ⚠️ override Content-Type cho request upload
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { sectionId, ...res.data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   CONTENT
   ========================= */

// POST teacher/courses/sections/{sectionId}/contents
export const createContentThunk = createAsyncThunk(
  "teacherCourse/createContent",
  async ({ sectionId, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `teacher/courses/sections/${sectionId}/contents`,
        data
      );
      return { sectionId, content: res.data };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/sections/contents/{contentId}
export const updateContentThunk = createAsyncThunk(
  "teacherCourse/updateContent",
  async ({ contentId, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `teacher/courses/sections/contents/${contentId}`,
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// DELETE teacher/courses/sections/contents/{contentId}
export const deleteContentThunk = createAsyncThunk(
  "teacherCourse/deleteContent",
  async ({ sectionId, contentId }, { rejectWithValue }) => {
    try {
      await api.delete(`teacher/courses/sections/contents/${contentId}`);
      return { sectionId, contentId };
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PATCH teacher/courses/sections/contents/{contentId}/reorder
export const reorderContentThunk = createAsyncThunk(
  "teacherCourse/reorderContent",
  async ({ contentId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `teacher/courses/sections/contents/${contentId}/reorder`,
        data
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/* =========================
   SLICE
   ========================= */

const initialState = {
  list: [],
  listLoading: false,

  currentCourseMeta: null,
  currentCourseTree: null,

  loadingMeta: false,
  loadingTree: false,
  saving: false,
  flagInfo: null,
  loadingFlagInfo: false,
  error: null,
};

const teacherCourseSlice = createSlice({
  name: "teacherCourse",
  initialState,
  reducers: {
    clearTeacherCourseState(state) {
      state.currentCourseMeta = null;
      state.currentCourseTree = null;
      state.loadingMeta = false;
      state.loadingTree = false;
      state.saving = false;
      state.error = null;
    },
    // chỉ clear tree khi đổi course để tránh recycle curriculum cũ
    clearCourseTree(state) {
      state.currentCourseTree = null;
      state.loadingTree = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    /* ----- LIST ----- */
    builder
      .addCase(fetchTeacherCourses.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherCourses.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchTeacherCourses.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload;
      });

    /* ----- META ----- */
    // builder
    //   .addCase(fetchCourseMeta.pending, (state) => {
    //     state.loadingMeta = true;
    //     state.error = null;
    //   })
    //   .addCase(fetchCourseMeta.fulfilled, (state, action) => {
    //     state.loadingMeta = false;
    //     state.currentCourseMeta = action.payload;
    //   })
    //   .addCase(fetchCourseMeta.rejected, (state, action) => {
    //     state.loadingMeta = false;
    //     state.error = action.payload;
    //   });

    builder
      .addCase(createCourseThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCourseThunk.fulfilled, (state, action) => {
        state.saving = false;
        const course = action.payload;
        state.list.unshift(course);
        state.currentCourseMeta = course;
      })
      .addCase(createCourseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateCourseThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCourseThunk.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;

        // merge meta
        state.currentCourseMeta = {
          ...(state.currentCourseMeta || {}),
          ...(updated || {}),
        };

        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) {
          // 🟢 Giữ nguyên vị trí cũ — update đúng vị trí đó
          state.list[idx] = { ...state.list[idx], ...(updated || {}) };
        }
      })
      .addCase(updateCourseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(uploadCourseCoverThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(uploadCourseCoverThunk.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;

        state.currentCourseMeta = {
          ...(state.currentCourseMeta || {}),
          ...(updated || {}),
        };

        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) {
          state.list[idx] = {
            ...state.list[idx],
            ...(updated || {}),
          };
        }
      })

      .addCase(uploadCourseCoverThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteCourseThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteCourseThunk.fulfilled, (state, action) => {
        state.saving = false;

        // dùng chính id truyền vào thunk (meta.arg) chứ không phụ thuộc payload
        const id = action.meta.arg;

        // Ép kiểu để tránh trường hợp "9" với 9 khác type
        state.list = state.list.filter((c) => String(c.id) !== String(id));

        if (
          state.currentCourseMeta?.id &&
          String(state.currentCourseMeta.id) === String(id)
        ) {
          state.currentCourseMeta = null;
          state.currentCourseTree = null;
        }
      })
      .addCase(deleteCourseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(submitforapprovalCourseThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        state.currentCourseMeta = updated;
        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(unpublishCourseThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        state.currentCourseMeta = updated;
        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      })

      // 🔽 FLAG REASON
      .addCase(fetchFlagReasonThunk.pending, (state) => {
        state.loadingFlagInfo = true;
        state.flagInfo = null;
        state.error = null;
      })
      .addCase(fetchFlagReasonThunk.fulfilled, (state, action) => {
        state.loadingFlagInfo = false;
        state.flagInfo = action.payload;
      })
      .addCase(fetchFlagReasonThunk.rejected, (state, action) => {
        state.loadingFlagInfo = false;
        state.flagInfo = null;
        state.error = action.payload;
      })

      // 🔽 RESUBMIT FLAGGED
      .addCase(resubmitFlaggedCourseThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        state.currentCourseMeta = updated;
        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
      });

    /* ----- TREE ----- */
    builder
      .addCase(fetchCourseTree.pending, (state) => {
        state.loadingTree = true;
        state.loadingMeta = true; // meta và tree cùng loading
        state.error = null;
      })
      .addCase(fetchCourseTree.fulfilled, (state, action) => {
        state.loadingTree = false;
        state.loadingMeta = false;

        const tree = action.payload;
        state.currentCourseTree = tree;

        // Nếu chưa có meta thì xài tạm meta từ /detail
        if (!state.currentCourseMeta) {
          state.currentCourseMeta = tree;
        } else {
          const prev = state.currentCourseMeta;

          // Merge, nhưng nếu /detail trả description/subtitle = null
          // thì giữ lại giá trị cũ
          const merged = { ...prev, ...tree };

          if (
            (tree.description == null || tree.description === "") &&
            prev.description
          ) {
            merged.description = prev.description;
          }
          if (
            (tree.subtitle == null || tree.subtitle === "") &&
            prev.subtitle
          ) {
            merged.subtitle = prev.subtitle;
          }

          state.currentCourseMeta = merged;
        }
      })

      .addCase(fetchCourseTree.rejected, (state, action) => {
        state.loadingTree = false;
        state.loadingMeta = false;
        state.error = action.payload;
      });

    /* ----- CHAPTER CRUD ----- */
    builder
      .addCase(createChapterThunk.fulfilled, (state, action) => {
        const chapter = action.payload.chapter;
        if (!state.currentCourseTree) return;
        if (!state.currentCourseTree.chapters)
          state.currentCourseTree.chapters = [];
        state.currentCourseTree.chapters.push(chapter);
      })
      .addCase(updateChapterThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        const idx = chapters.findIndex((c) => c.id === updated.id);
        if (idx !== -1) chapters[idx] = { ...chapters[idx], ...updated };
      })
      .addCase(deleteChapterThunk.fulfilled, (state, action) => {
        const id = action.payload;
        if (!state.currentCourseTree?.chapters) return;
        state.currentCourseTree.chapters =
          state.currentCourseTree.chapters.filter((c) => c.id !== id);
      })
      .addCase(reorderChapterThunk.fulfilled, (state, action) => {
        if (state.currentCourseTree) {
          state.currentCourseTree.chapters =
            action.payload.chapters || action.payload;
        }
      });

    /* ----- LESSON CRUD ----- */
    builder
      .addCase(createLessonThunk.fulfilled, (state, action) => {
        const { chapterId, lesson } = action.payload;
        const chapter = state.currentCourseTree?.chapters?.find(
          (c) => c.id === chapterId
        );
        if (!chapter) return;
        if (!chapter.lessons) chapter.lessons = [];
        chapter.lessons.push(lesson);
      })
      .addCase(updateLessonThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          const idx = ch.lessons?.findIndex((l) => l.id === updated.id);
          if (idx !== -1) {
            ch.lessons[idx] = { ...ch.lessons[idx], ...updated };
            break;
          }
        }
      })
      .addCase(deleteLessonThunk.fulfilled, (state, action) => {
        const { chapterId, lessonId } = action.payload;
        const chapter = state.currentCourseTree?.chapters?.find(
          (c) => c.id === chapterId
        );
        if (!chapter?.lessons) return;
        chapter.lessons = chapter.lessons.filter((l) => l.id !== lessonId);
      })
      .addCase(reorderLessonThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        if (!state.currentCourseTree?.chapters) return;
        if (payload.chapterId && payload.lessons) {
          const ch = state.currentCourseTree.chapters.find(
            (c) => c.id === payload.chapterId
          );
          if (ch) ch.lessons = payload.lessons;
        }
      });

    /* ----- SECTION CRUD ----- */
    builder
      .addCase(createSectionThunk.fulfilled, (state, action) => {
        const { lessonId, section } = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          const les = ch.lessons?.find((l) => l.id === lessonId);
          if (les) {
            if (!les.sections) les.sections = [];
            les.sections.push(section);
            break;
          }
        }
      })
      .addCase(updateSectionThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          for (const les of ch.lessons || []) {
            const idx = les.sections?.findIndex((s) => s.id === updated.id);
            if (idx !== -1) {
              les.sections[idx] = { ...les.sections[idx], ...updated };
              return;
            }
          }
        }
      })
      .addCase(deleteSectionThunk.fulfilled, (state, action) => {
        const { lessonId, sectionId } = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          const les = ch.lessons?.find((l) => l.id === lessonId);
          if (les?.sections) {
            les.sections = les.sections.filter((s) => s.id !== sectionId);
            break;
          }
        }
      })
      .addCase(reorderSectionThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        if (!state.currentCourseTree?.chapters) return;
        if (payload.lessonId && payload.sections) {
          for (const ch of state.currentCourseTree.chapters) {
            const les = ch.lessons?.find((l) => l.id === payload.lessonId);
            if (les) {
              les.sections = payload.sections;
              break;
            }
          }
        }
      });

    /* ----- CONTENT CRUD ----- */
    builder
      .addCase(createContentThunk.fulfilled, (state, action) => {
        const { sectionId, content } = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          for (const les of ch.lessons || []) {
            const sec = les.sections?.find((s) => s.id === sectionId);
            if (sec) {
              if (!sec.contents) sec.contents = [];
              sec.contents.push(content);
              return;
            }
          }
        }
      })
      .addCase(updateContentThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          for (const les of ch.lessons || []) {
            for (const sec of les.sections || []) {
              const idx = sec.contents?.findIndex((c) => c.id === updated.id);
              if (idx !== -1) {
                sec.contents[idx] = { ...sec.contents[idx], ...updated };
                return;
              }
            }
          }
        }
      })
      .addCase(deleteContentThunk.fulfilled, (state, action) => {
        const { sectionId, contentId } = action.payload;
        const chapters = state.currentCourseTree?.chapters || [];
        for (const ch of chapters) {
          for (const les of ch.lessons || []) {
            const sec = les.sections?.find((s) => s.id === sectionId);
            if (sec?.contents) {
              sec.contents = sec.contents.filter((c) => c.id !== contentId);
              return;
            }
          }
        }
      })
      .addCase(reorderContentThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        if (!state.currentCourseTree?.chapters) return;
        if (payload.sectionId && payload.contents) {
          for (const ch of state.currentCourseTree.chapters) {
            for (const les of ch.lessons || []) {
              const sec = les.sections?.find((s) => s.id === payload.sectionId);
              if (sec) {
                sec.contents = payload.contents;
                return;
              }
            }
          }
        }
      });
  },
});

export const { clearTeacherCourseState, clearCourseTree } =
  teacherCourseSlice.actions;

export default teacherCourseSlice.reducer;
