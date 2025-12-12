// src/components/CourseComments/CourseComments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./CourseComments.module.scss";

import {
  fetchCourseComments,
  createCourseComment,
  replyCourseComment,
  updateCourseComment,
  deleteCourseComment,
  selectCourseCommentsState,
  setCommentsPage,
  clearCommentsError,
} from "../../redux/features/commentSlice";
import api from "../../configs/axios";

const toDateTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return "";
  }
};

const getFileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // axios baseURL: http://localhost:8080/api  => fileBase: http://localhost:8080
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const Avatar = ({ url, name }) => {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  const src = getFileUrl(url);

  return src ? (
    <img className={styles.avatarImg} src={src} alt={name || "avatar"} />
  ) : (
    <div className={styles.avatarFallback}>{letter}</div>
  );
};

function CommentItem({
  comment,
  isMine,
  mineSet,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(comment.content || "");

  const created = toDateTime(comment.createdAt);
  const updated = toDateTime(comment.updatedAt);
  const showEdited = !!comment.edited;

  const handleSubmitReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    await onReply(comment.id, text);
    setReplyText("");
    setReplyOpen(false);
  };

  const handleSubmitEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    await onEdit(comment.id, text);
    setEditOpen(false);
  };

  const replies = Array.isArray(comment.replies) ? comment.replies : [];

  return (
    <div
      className={`${styles.commentItem} ${depth > 0 ? styles.replyItem : ""}`}
    >
      <div className={styles.commentLeft}>
        <Avatar url={comment.avatarUrl} name={comment.authorName} />
      </div>

      <div className={styles.commentRight}>
        <div className={styles.commentBubble}>
          <div className={styles.commentHeaderRow}>
            <div className={styles.authorName}>{comment.authorName}</div>

            <div className={styles.metaLine}>
              <span>{created}</span>
              {showEdited && (
                <span className={styles.editedTag}> • đã sửa</span>
              )}
              {showEdited && updated && <span> ({updated})</span>}
            </div>
          </div>

          {!editOpen ? (
            <div className={styles.commentContent}>{comment.content}</div>
          ) : (
            <div className={styles.editorBox}>
              <textarea
                className={styles.textarea}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <div className={styles.editorActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setEditOpen(false);
                    setEditText(comment.content || "");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSubmitEdit}
                >
                  Lưu
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => setReplyOpen((v) => !v)}
          >
            Trả lời
          </button>

          {isMine && (
            <>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => setEditOpen((v) => !v)}
              >
                Sửa
              </button>
              <button
                type="button"
                className={`${styles.linkBtn} ${styles.dangerLink}`}
                onClick={() => onDelete(comment.id)}
              >
                Xóa
              </button>
            </>
          )}
        </div>

        {replyOpen && (
          <div className={styles.replyBox}>
            <textarea
              className={styles.textarea}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Viết trả lời..."
            />
            <div className={styles.replyActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setReplyOpen(false);
                  setReplyText("");
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSubmitReply}
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {replies.length > 0 && (
          <div className={styles.replyList}>
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                depth={depth + 1}
                isMine={mineSet.has(r.id)}
                mineSet={mineSet}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseComments({
  courseId,
  currentUserId,
  isLoggedIn,
}) {
  const dispatch = useDispatch();
  const state = useSelector((s) => selectCourseCommentsState(s, courseId));

  const [newText, setNewText] = useState("");

  const page = state.page ?? 0;
  const loading = !!state.loading;
  const posting = !!state.posting;
  const error = state.error;

  const data = state.data;
  const comments = data?.content || [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const canPrev = page > 0;
  const canNext = totalPages ? page < totalPages - 1 : false;

  useEffect(() => {
    if (!courseId) return;
    dispatch(fetchCourseComments({ courseId, page: 0 }));
  }, [courseId, dispatch]);

  const mineSet = useMemo(() => {
    const s = new Set();
    const walk = (arr) => {
      (arr || []).forEach((c) => {
        if (currentUserId && c.userId === currentUserId) s.add(c.id);
        if (Array.isArray(c.replies)) walk(c.replies);
      });
    };
    walk(comments);
    return s;
  }, [comments, currentUserId]);

  const onCreateRoot = async () => {
    if (!isLoggedIn) return;
    const text = newText.trim();
    if (!text) return;

    dispatch(clearCommentsError({ courseId }));
    await dispatch(createCourseComment({ courseId, content: text }));
    setNewText("");
  };

  const onReply = async (parentId, content) => {
    if (!isLoggedIn) return;
    dispatch(clearCommentsError({ courseId }));
    await dispatch(replyCourseComment({ courseId, parentId, content }));
  };

  const onEdit = async (commentId, content) => {
    if (!isLoggedIn) return;
    dispatch(clearCommentsError({ courseId }));
    await dispatch(updateCourseComment({ courseId, commentId, content }));
  };

  const onDelete = async (commentId) => {
    if (!isLoggedIn) return;
    if (!window.confirm("Xóa bình luận này?")) return;
    dispatch(clearCommentsError({ courseId }));
    await dispatch(deleteCourseComment({ courseId, commentId }));
  };

  const gotoPage = (p) => {
    dispatch(setCommentsPage({ courseId, page: p }));
    dispatch(fetchCourseComments({ courseId, page: p }));
  };

  const handlePrev = () => {
    if (!canPrev) return;
    gotoPage(page - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    gotoPage(page + 1);
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Bình luận khóa học</h3>
          <p className={styles.subTitle}>
            Góp ý, hỏi đáp hoặc báo lỗi nội dung để teacher cải thiện.
          </p>
        </div>

        <div className={styles.count}>
          {totalElements.toLocaleString("vi-VN")} bình luận
        </div>
      </div>

      <div className={styles.composer}>
        <textarea
          className={styles.textarea}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={
            isLoggedIn
              ? "Viết bình luận cho khóa học..."
              : "Đăng nhập để bình luận."
          }
          disabled={!isLoggedIn || posting}
        />
        <div className={styles.composerActions}>
          <div className={styles.hint}>
            {newText.length}/1000
            {!isLoggedIn && (
              <span className={styles.loginHint}> • cần đăng nhập</span>
            )}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onCreateRoot}
            disabled={!isLoggedIn || posting || !newText.trim()}
          >
            {posting ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>Đang tải bình luận…</div>
        ) : comments.length === 0 ? (
          <div className={styles.empty}>
            Chưa có bình luận nào. Hãy là người đầu tiên góp ý cho teacher nhé.
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              isMine={mineSet.has(c.id)}
              mineSet={mineSet}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* ✅ Pagination: mũi tên ở giữa */}
      <div className={styles.pagination}>
        <button
          type="button"
          className={styles.pageArrow}
          disabled={!canPrev || loading}
          onClick={handlePrev}
          aria-label="Trang trước"
        >
          ←
        </button>

        <span className={styles.pageInfo}>
          Trang {page + 1} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          className={styles.pageArrow}
          disabled={!canNext || loading}
          onClick={handleNext}
          aria-label="Trang sau"
        >
          →
        </button>
      </div>
    </section>
  );
}
