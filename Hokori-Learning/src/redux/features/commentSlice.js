import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// axios baseURL đã có /api rồi => KHÔNG thêm /api vào path

const normalizeComment = (c) => {
  if (!c) return null;

  const replies = Array.isArray(c.replies)
    ? c.replies.filter((x) => x && typeof x === "object") // chỉ nhận object
    : [];

  return {
    ...c,
    replies,
  };
};

export const fetchCourseComments = createAsyncThunk(
  "comments/fetchCourseComments",
  async (
    { courseId, page = 0, size = 20, sort = "createdAt,desc" },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/courses-public/${courseId}/comments`, {
        params: { page, size, sort },
      });
      return { courseId, page, data: res.data };
    } catch (err) {
      return rejectWithValue(
        err?.normalizedMessage || "Không thể tải bình luận."
      );
    }
  }
);

export const createCourseComment = createAsyncThunk(
  "comments/createCourseComment",
  async ({ courseId, content }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/learner/courses/${courseId}/comments`, {
        content,
      });
      // BE trả { success, message, data }
      const newComment = normalizeComment(res?.data?.data);
      return { courseId, newComment };
    } catch (err) {
      return rejectWithValue(
        err?.normalizedMessage || "Không thể gửi bình luận."
      );
    }
  }
);

export const replyCourseComment = createAsyncThunk(
  "comments/replyCourseComment",
  async ({ courseId, parentId, content }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/learner/courses/${courseId}/comments/${parentId}/reply`,
        { content }
      );
      const reply = normalizeComment(res?.data?.data);
      return { courseId, parentId, reply };
    } catch (err) {
      return rejectWithValue(
        err?.normalizedMessage || "Không thể gửi trả lời."
      );
    }
  }
);

export const updateCourseComment = createAsyncThunk(
  "comments/updateCourseComment",
  async ({ courseId, commentId, content }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/learner/courses/${courseId}/comments/${commentId}`,
        { content }
      );
      const updated = normalizeComment(res?.data?.data);
      return { courseId, commentId, updated };
    } catch (err) {
      return rejectWithValue(
        err?.normalizedMessage || "Không thể cập nhật bình luận."
      );
    }
  }
);

export const deleteCourseComment = createAsyncThunk(
  "comments/deleteCourseComment",
  async ({ courseId, commentId }, { rejectWithValue }) => {
    try {
      await api.delete(`/learner/courses/${courseId}/comments/${commentId}`);
      return { courseId, commentId };
    } catch (err) {
      return rejectWithValue(
        err?.normalizedMessage || "Không thể xóa bình luận."
      );
    }
  }
);

const initialState = {
  byCourseId: {},
};

const ensure = (state, courseId) => {
  if (!state.byCourseId[courseId]) {
    state.byCourseId[courseId] = {
      page: 0,
      data: null, // { content: [], totalPages,...}
      loading: false,
      posting: false,
      error: null,
    };
  }
};

const findAndUpdateInTree = (arr, id, updater) => {
  if (!Array.isArray(arr)) return false;
  for (let i = 0; i < arr.length; i++) {
    const node = arr[i];
    if (node?.id === id) {
      updater(node, i, arr);
      return true;
    }
    if (Array.isArray(node?.replies) && node.replies.length) {
      const found = findAndUpdateInTree(node.replies, id, updater);
      if (found) return true;
    }
  }
  return false;
};

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setCommentsPage(state, action) {
      const { courseId, page } = action.payload;
      ensure(state, courseId);
      state.byCourseId[courseId].page = page;
    },
    clearCommentsError(state, action) {
      const { courseId } = action.payload;
      ensure(state, courseId);
      state.byCourseId[courseId].error = null;
    },
  },
  extraReducers: (builder) => {
    // FETCH
    builder
      .addCase(fetchCourseComments.pending, (state, action) => {
        const { courseId, page } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].loading = true;
        state.byCourseId[courseId].error = null;
        state.byCourseId[courseId].page = page;
      })
      .addCase(fetchCourseComments.fulfilled, (state, action) => {
        const { courseId, page, data } = action.payload;
        ensure(state, courseId);
        state.byCourseId[courseId].loading = false;
        state.byCourseId[courseId].page = page;

        // normalize replies for safety
        const content = Array.isArray(data?.content)
          ? data.content.map(normalizeComment)
          : [];
        state.byCourseId[courseId].data = { ...data, content };
      })
      .addCase(fetchCourseComments.rejected, (state, action) => {
        const { courseId } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].loading = false;
        state.byCourseId[courseId].error =
          action.payload || "Không thể tải bình luận.";
      });

    // CREATE ROOT
    builder
      .addCase(createCourseComment.pending, (state, action) => {
        ensure(state, action.meta.arg.courseId);
        state.byCourseId[action.meta.arg.courseId].posting = true;
        state.byCourseId[action.meta.arg.courseId].error = null;
      })
      .addCase(createCourseComment.fulfilled, (state, action) => {
        const { courseId, newComment } = action.payload;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;

        // Nếu chưa fetch data thì tạo khung data tối thiểu
        if (!state.byCourseId[courseId].data) {
          state.byCourseId[courseId].data = {
            content: [],
            totalElements: 0,
            totalPages: 0,
          };
        }
        const list = state.byCourseId[courseId].data.content || [];
        // sort desc => thêm lên đầu
        if (newComment) list.unshift(newComment);

        // update counters nếu có
        if (typeof state.byCourseId[courseId].data.totalElements === "number") {
          state.byCourseId[courseId].data.totalElements += 1;
        }
      })
      .addCase(createCourseComment.rejected, (state, action) => {
        const { courseId } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;
        state.byCourseId[courseId].error =
          action.payload || "Không thể gửi bình luận.";
      });

    // REPLY
    builder
      .addCase(replyCourseComment.pending, (state, action) => {
        ensure(state, action.meta.arg.courseId);
        state.byCourseId[action.meta.arg.courseId].posting = true;
        state.byCourseId[action.meta.arg.courseId].error = null;
      })
      .addCase(replyCourseComment.fulfilled, (state, action) => {
        const { courseId, parentId, reply } = action.payload;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;

        const root = state.byCourseId[courseId].data?.content;
        if (!root || !reply) return;

        // find parent in tree and push reply
        findAndUpdateInTree(root, parentId, (node) => {
          if (!Array.isArray(node.replies)) node.replies = [];
          node.replies.push(reply);
        });
      })
      .addCase(replyCourseComment.rejected, (state, action) => {
        const { courseId } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;
        state.byCourseId[courseId].error =
          action.payload || "Không thể gửi trả lời.";
      });

    // UPDATE
    builder
      .addCase(updateCourseComment.pending, (state, action) => {
        ensure(state, action.meta.arg.courseId);
        state.byCourseId[action.meta.arg.courseId].posting = true;
        state.byCourseId[action.meta.arg.courseId].error = null;
      })
      .addCase(updateCourseComment.fulfilled, (state, action) => {
        const { courseId, commentId, updated } = action.payload;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;

        const root = state.byCourseId[courseId].data?.content;
        if (!root || !updated) return;

        findAndUpdateInTree(root, commentId, (node, idx, arr) => {
          arr[idx] = {
            ...node,
            ...updated,
            replies: Array.isArray(updated.replies)
              ? updated.replies
              : node.replies || [],
          };
        });
      })
      .addCase(updateCourseComment.rejected, (state, action) => {
        const { courseId } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;
        state.byCourseId[courseId].error =
          action.payload || "Không thể cập nhật bình luận.";
      });

    // DELETE
    builder
      .addCase(deleteCourseComment.pending, (state, action) => {
        ensure(state, action.meta.arg.courseId);
        state.byCourseId[action.meta.arg.courseId].posting = true;
        state.byCourseId[action.meta.arg.courseId].error = null;
      })
      .addCase(deleteCourseComment.fulfilled, (state, action) => {
        const { courseId, commentId } = action.payload;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;

        const root = state.byCourseId[courseId].data?.content;
        if (!root) return;

        // soft delete: xoá khỏi list luôn (hoặc bạn muốn giữ "đã xoá" thì patch content)
        const removeInTree = (arr, id) => {
          if (!Array.isArray(arr)) return false;
          for (let i = 0; i < arr.length; i++) {
            if (arr[i]?.id === id) {
              arr.splice(i, 1);
              return true;
            }
            if (Array.isArray(arr[i]?.replies) && arr[i].replies.length) {
              const found = removeInTree(arr[i].replies, id);
              if (found) return true;
            }
          }
          return false;
        };
        removeInTree(root, commentId);

        if (typeof state.byCourseId[courseId].data.totalElements === "number") {
          state.byCourseId[courseId].data.totalElements = Math.max(
            0,
            state.byCourseId[courseId].data.totalElements - 1
          );
        }
      })
      .addCase(deleteCourseComment.rejected, (state, action) => {
        const { courseId } = action.meta.arg;
        ensure(state, courseId);
        state.byCourseId[courseId].posting = false;
        state.byCourseId[courseId].error =
          action.payload || "Không thể xóa bình luận.";
      });
  },
});

export const { setCommentsPage, clearCommentsError } = commentSlice.actions;
export default commentSlice.reducer;

export const selectCourseCommentsState = (state, courseId) =>
  state.comments?.byCourseId?.[courseId] || {
    page: 0,
    data: null,
    loading: false,
    posting: false,
    error: null,
  };
