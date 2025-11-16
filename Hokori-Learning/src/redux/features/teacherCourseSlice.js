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

// GET teacher/courses/{id}  (metadata)
export const fetchCourseMeta = createAsyncThunk(
  "teacherCourse/fetchCourseMeta",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/courses/${courseId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

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
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // BE thường sẽ trả về Course đã được cập nhật coverImagePath
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
      await api.delete(`teacher/courses/${courseId}`);
      return courseId;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

// PUT teacher/courses/{id}/publish
export const publishCourseThunk = createAsyncThunk(
  "teacherCourse/publishCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.put(`teacher/courses/${courseId}/publish`);
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

// GET teacher/courses/{id}/tree  (full cấu trúc Course → Chapters → Lessons → Sections → Contents)
export const fetchCourseTree = createAsyncThunk(
  "teacherCourse/fetchCourseTree",
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await api.get(`teacher/courses/${courseId}/tree`);
      return res.data;
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
// data tuỳ bạn: ví dụ {newIndex: 2}
export const reorderChapterThunk = createAsyncThunk(
  "teacherCourse/reorderChapter",
  async ({ chapterId, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `teacher/courses/chapters/${chapterId}/reorder`,
        data
      );
      return res.data; // giả sử trả về full list chapters đã reorder
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
      return res.data; // lesson updated
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
// BE trả về { filePath, url }
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
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // res.data: { filePath, url }
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
    builder
      .addCase(fetchCourseMeta.pending, (state) => {
        state.loadingMeta = true;
        state.error = null;
      })
      .addCase(fetchCourseMeta.fulfilled, (state, action) => {
        state.loadingMeta = false;
        state.currentCourseMeta = action.payload;
      })
      .addCase(fetchCourseMeta.rejected, (state, action) => {
        state.loadingMeta = false;
        state.error = action.payload;
      });

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
        state.currentCourseMeta = updated;
        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
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
        state.currentCourseMeta = updated;
        const idx = state.list.findIndex((c) => c.id === updated.id);
        if (idx !== -1) state.list[idx] = updated;
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
        const id = action.payload;
        state.list = state.list.filter((c) => c.id !== id);
        if (state.currentCourseMeta?.id === id) {
          state.currentCourseMeta = null;
          state.currentCourseTree = null;
        }
      })
      .addCase(deleteCourseThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });

    builder
      .addCase(publishCourseThunk.fulfilled, (state, action) => {
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
      });

    /* ----- TREE ----- */
    builder
      .addCase(fetchCourseTree.pending, (state) => {
        state.loadingTree = true;
        state.error = null;
      })
      .addCase(fetchCourseTree.fulfilled, (state, action) => {
        state.loadingTree = false;
        state.currentCourseTree = action.payload;
      })
      .addCase(fetchCourseTree.rejected, (state, action) => {
        state.loadingTree = false;
        state.error = action.payload;
      });

    /* ----- CHAPTER CRUD (update state.currentCourseTree) ----- */
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
        // nếu BE trả về mảng chapters mới thì gán luôn
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
        // tuỳ payload BE – nếu là {chapterId, lessons:[...]} thì map lại
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
        // tương tự, nếu BE trả về {lessonId, sections:[...]}
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
        // nếu payload = {sectionId, contents:[...]}
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

export const { clearTeacherCourseState } = teacherCourseSlice.actions;

export default teacherCourseSlice.reducer;
