import React, { useEffect, useState } from "react";
import { List, Button, Input, Spin, Empty, message } from "antd";
import api from "../../../../../configs/axios.js";
import styles from "../styles.module.scss";

const { TextArea } = Input;

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function CourseFeedbackTab({ courseId, isActive }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [comments, setComments] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 20, total: 0 });

  const [newContent, setNewContent] = useState("");

  // id của comment đang được reply (có thể là root hoặc reply)
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchComments = async (page = 0) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`courses-public/${courseId}/comments`, {
        params: { page, size: 20 },
      });

      const data = res.data?.data ?? res.data;
      const content = data.content || [];
      setComments(content);
      setPageInfo({
        page: data.number ?? page,
        size: data.size ?? 20,
        total: data.totalElements ?? content.length,
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải feedback của học viên.");
    } finally {
      setLoading(false);
    }
  };

  // chỉ load khi tab Feedback đang active
  useEffect(() => {
    if (!courseId || !isActive) return;
    fetchComments(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isActive]);

  // Teacher tạo comment root cho khoá học
  const handleCreateRootComment = async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      await api.post(`teacher/courses/${courseId}/comments`, {
        content: trimmed,
      });
      setNewContent("");
      await fetchComments(pageInfo.page);
      message.success("Đã gửi comment.");
    } catch (err) {
      console.error(err);
      message.error("Không gửi được comment.");
    } finally {
      setSending(false);
    }
  };

  // Teacher reply vào 1 comment (root hoặc reply)
  const handleSendReply = async (parentId) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      await api.post(`teacher/courses/${courseId}/comments/${parentId}/reply`, {
        content: trimmed,
      });
      setReplyText("");
      setReplyingId(null);
      await fetchComments(pageInfo.page);
      message.success("Đã trả lời học viên.");
    } catch (err) {
      console.error(err);
      message.error("Không gửi được reply.");
    } finally {
      setSending(false);
    }
  };

  const toggleReplyBox = (id) => {
    if (replyingId === id) {
      setReplyingId(null);
      setReplyText("");
    } else {
      setReplyingId(id);
      setReplyText("");
    }
  };

  // render box reply chung cho cả root & reply
  const renderReplyBox = (parentId) => {
    if (replyingId !== parentId) return null;
    return (
      <div className={styles.feedbackReplyBox}>
        <TextArea
          rows={2}
          placeholder="Trả lời học viên…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <div className={styles.feedbackReplyActions}>
          <Button
            type="primary"
            size="small"
            onClick={() => handleSendReply(parentId)}
            loading={sending}
            disabled={!replyText.trim()}
          >
            Gửi
          </Button>
          <Button
            size="small"
            onClick={() => {
              setReplyingId(null);
              setReplyText("");
            }}
          >
            Huỷ
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.feedbackWrap}>
      <div className={styles.feedbackHeader}>
        <div>
          <h3 className={styles.feedbackTitle}>Feedback từ học viên</h3>
          <p className={styles.feedbackSubtitle}>
            Xem comment của learner và trả lời trực tiếp.
          </p>
        </div>
        <span className={styles.feedbackCount}>
          {pageInfo.total
            ? `${pageInfo.total} comment(s)`
            : "Chưa có feedback nào"}
        </span>
      </div>

      {/* Teacher comment root */}
      <div className={styles.feedbackNew}>
        <TextArea
          rows={3}
          placeholder="Viết ghi chú / phản hồi chung cho khoá học (comment của teacher)…"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className={styles.feedbackNewActions}>
          <Button
            type="primary"
            size="small"
            onClick={handleCreateRootComment}
            loading={sending}
            disabled={!newContent.trim()}
          >
            Gửi comment
          </Button>
        </div>
      </div>

      {/* List comment learner */}
      {loading ? (
        <div className={styles.feedbackLoading}>
          <Spin />
        </div>
      ) : !comments.length ? (
        <Empty description="Chưa có comment nào cho khoá học này." />
      ) : (
        <List
          className={styles.feedbackList}
          dataSource={comments}
          renderItem={(c) => (
            <List.Item key={c.id} className={styles.feedbackItem}>
              <div className={styles.feedbackItemMain}>
                {/* Comment root */}
                <div className={styles.feedbackItemHeader}>
                  <span className={styles.feedbackAuthor}>
                    {c.authorName || c.createdByName || "Learner"}
                  </span>
                  <span className={styles.feedbackMeta}>
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <div className={styles.feedbackContent}>{c.content}</div>

                <div className={styles.feedbackActions}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => toggleReplyBox(c.id)}
                  >
                    Trả lời
                  </Button>
                </div>

                {/* reply box cho comment root */}
                {renderReplyBox(c.id)}

                {/* Replies */}
                {Array.isArray(c.replies) && c.replies.length > 0 && (
                  <div className={styles.feedbackReplies}>
                    {c.replies.map((r) => (
                      <div key={r.id} className={styles.feedbackReplyItem}>
                        <div className={styles.feedbackItemHeader}>
                          <span className={styles.feedbackAuthor}>
                            {r.authorName || r.createdByName || "Teacher"}
                          </span>
                          <span className={styles.feedbackMeta}>
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                        <div className={styles.feedbackContent}>
                          {r.content}
                        </div>

                        <div className={styles.feedbackActions}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => toggleReplyBox(r.id)}
                          >
                            Trả lời
                          </Button>
                        </div>

                        {/* reply box cho từng reply */}
                        {renderReplyBox(r.id)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
