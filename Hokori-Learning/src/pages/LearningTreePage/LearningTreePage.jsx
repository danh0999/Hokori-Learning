// src/pages/LearningTreePage/LearningTreePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, Input, message } from "antd";
import { toast } from "react-toastify";

import api from "../../configs/axios";
import styles from "./LearningTreePage.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOndemandVideo } from "react-icons/md";
import { GiCardPick } from "react-icons/gi";
import { AiOutlineCheck } from "react-icons/ai";
import { AnimatePresence, motion } from "framer-motion";

const slugify = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatDateTime = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
};
// helper build file url (giống bạn dùng)
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

function StarRating({ value = 0, onChange, readOnly = false, size = "md" }) {
  const [hover, setHover] = useState(null);
  const display = hover ?? value;

  return (
    <div
      className={`${styles.starRow} ${size === "sm" ? styles.starRowSm : ""}`}
      onMouseLeave={() => setHover(null)}
      aria-label="Star rating"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const active = starValue <= display;
        return (
          <button
            key={starValue}
            type="button"
            className={`${styles.starBtn} ${active ? styles.starActive : ""} ${
              readOnly ? styles.starReadOnly : ""
            }`}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onClick={() => !readOnly && onChange?.(starValue)}
            disabled={readOnly}
            aria-label={`${starValue} sao`}
            title={`${starValue} sao`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function LearningTreePage() {
  // /learn/:courseId/:slug/home/chapter/:chapterIndex
  const { courseId, chapterIndex } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // collapse lesson trong panel bên phải
  const [openLessons, setOpenLessons] = useState(new Set());

  // ===== FEEDBACK STATE =====
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({ ratingAvg: 0, ratingCount: 0 });

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState("");

  // ===== REPORT / FLAG COURSE =====
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [alreadyFlagged, setAlreadyFlagged] = useState(false);
  const [flagType, setFlagType] = useState("INAPPROPRIATE_CONTENT");

  // ✅ ĐÚNG field từ BE
  const courseStatus = data?.courseStatus;

  // nếu BE có canFlag thì dùng, không có thì fallback true
  const canFlag = data?.canFlag ?? true;

  // các trạng thái KHÔNG nên cho learner báo cáo thêm
  const disallowFlagStatuses = new Set([
    "FLAGGED",
    "REJECTED",
    "PENDING_APPROVAL",
  ]);

  const isFlagDisabledByStatus = disallowFlagStatuses.has(courseStatus);

  const canShowFlagButton =
    !!canFlag && !alreadyFlagged && !isFlagDisabledByStatus;

  // token check giống CourseHero
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const isGuest = !token;

  const fetchFeedbacks = async () => {
    try {
      setFbLoading(true);
      setFbError("");
      setPostMsg("");

      const [sumRes, listRes] = await Promise.all([
        api.get(`/courses/${courseId}/feedbacks/summary`),
        api.get(`/courses/${courseId}/feedbacks`),
      ]);

      const sum = sumRes?.data?.data ?? sumRes?.data ?? {};
      const list = listRes?.data?.data ?? listRes?.data ?? [];

      setSummary({
        ratingAvg: Number(sum.ratingAvg ?? 0),
        ratingCount: Number(sum.ratingCount ?? 0),
      });
      setFeedbacks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setFbError("Không thể tải đánh giá khóa học.");
    } finally {
      setFbLoading(false);
    }
  };

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/learner/courses/${courseId}/learning-tree`);
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Không thể tải tiến độ học tập");
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [courseId]);

  // load feedback song song (không phụ thuộc learning-tree)
  useEffect(() => {
    if (!courseId) return;
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // khi đổi chapterIndex trên URL → reset lesson đang mở
  useEffect(() => {
    setOpenLessons(new Set());
  }, [chapterIndex]);

  const numericChapterIndex = useMemo(
    () => Number(chapterIndex),
    [chapterIndex]
  );

  const chapters = data?.chapters ?? [];

  // Chapter trial orderIndex = 0 → bỏ khi chọn default
  const nonTrialChapters = chapters.filter((ch) => ch.orderIndex > 0);
  // ===== TRIAL CHAPTER GUARD =====
  const trialChapter = useMemo(
    () => chapters.find((ch) => Number(ch.orderIndex) === 0),
    [chapters]
  );

  // Nếu course chỉ có trial chapter => đá thẳng sang trial page
  useEffect(() => {
    if (!data) return;

    if (nonTrialChapters.length === 0 && trialChapter?.chapterId) {
      navigate(`/course/${courseId}/trial-lesson/${trialChapter.chapterId}`, {
        replace: true,
      });
    }
  }, [
    data,
    nonTrialChapters.length,
    trialChapter?.chapterId,
    navigate,
    courseId,
  ]);

  const activeChapter = useMemo(() => {
    if (!chapters.length) return null;

    if (!Number.isNaN(numericChapterIndex)) {
      const found = nonTrialChapters.find(
        (ch) => ch.orderIndex === numericChapterIndex
      );
      if (found) return found;
    }

    // nếu param không hợp lệ → lấy chapter đầu tiên KHÔNG phải trial
    if (nonTrialChapters.length > 0) return nonTrialChapters[0];

    // fallback: chapter[0]
    return chapters[0];
  }, [chapters, numericChapterIndex, nonTrialChapters]);

  const courseSlug = useMemo(
    () => (data ? slugify(data.courseTitle) : ""),
    [data]
  );

  useEffect(() => {
    if (!data) return;
    if (numericChapterIndex === 0 && nonTrialChapters.length > 0) {
      navigate(
        `/learn/${courseId}/${courseSlug}/home/chapter/${nonTrialChapters[0].orderIndex}`,
        { replace: true }
      );
    }
  }, [
    data,
    numericChapterIndex,
    nonTrialChapters,
    navigate,
    courseId,
    courseSlug,
  ]);

  const handleModuleClick = (chapter) => {
    if (!data || !courseSlug) return;
    if (!chapter || Number(chapter.orderIndex) <= 0) return; // chặn trial
    navigate(
      `/learn/${courseId}/${courseSlug}/home/chapter/${chapter.orderIndex}`
    );
  };

  const toggleLesson = (id) => {
    setOpenLessons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Điều hướng khi bấm vào content → qua trang Player hoặc Quiz
  const handleContentClick = (
    lessonId,
    content,
    chapterOrderIndex,
    sectionId
  ) => {
    if (!courseSlug) return;

    // Nếu là QUIZ content, navigate đến quiz page
    if (content.contentFormat === "QUIZ" && sectionId) {
      navigate(
        `/learn/${courseId}/${courseSlug}/lesson/${lessonId}/content/0`,
        {
          state: {
            chapterOrderIndex,
            openQuiz: true,
            quizSectionId: sectionId,
          },
        }
      );
      return;
    }

    // Content thường
    navigate(
      `/learn/${courseId}/${courseSlug}/lesson/${lessonId}/content/${content.contentId}`,
      {
        state: {
          chapterOrderIndex,
          contentFormat: content.contentFormat,
        },
      }
    );
  };

  const handleSubmitFeedback = async () => {
    setPostMsg("");
    setFbError("");

    const rating = clamp(Number(myRating || 0), 0, 5);
    const comment = (myComment || "").trim();

    if (rating <= 0) {
      setPostMsg("Bạn chưa chọn số sao.");
      return;
    }
    if (comment.length === 0) {
      setPostMsg("Bạn chưa nhập nhận xét.");
      return;
    }

    try {
      setPosting(true);
      await api.post(`/courses/${courseId}/feedbacks`, {
        rating,
        comment,
      });

      setPostMsg("Đã gửi đánh giá!");
      // refresh list + summary
      await fetchFeedbacks();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        "Gửi đánh giá thất bại.";
      setPostMsg(msg);
    } finally {
      setPosting(false);
    }
  };

  const openFlagModal = () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để báo cáo khóa học.");
      navigate("/login");
      return;
    }
    setFlagReason("");
    setFlagType("INAPPROPRIATE_CONTENT");
    setFlagModalOpen(true);
  };

  const handleSubmitFlag = async () => {
    const reason = flagReason.trim();
    if (!reason) {
      message.warning("Vui lòng nhập lý do báo cáo khóa học.");
      return;
    }

    setFlagSubmitting(true);
    try {
      await api.post(`/courses/${courseId}/flag`, {
        flagType,
        reason,
      });

      toast.success("Đã gửi báo cáo đến bộ phận kiểm duyệt. Cảm ơn bạn!");
      setFlagModalOpen(false);
      setAlreadyFlagged(true);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể gửi báo cáo. Vui lòng thử lại sau."
      );
    } finally {
      setFlagSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error || !data) return <div className={styles.error}>{error}</div>;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* ===== HEADER GIỮ PROGRESS ===== */}
        <section className={styles.header}>
          <img
            className={styles.cover}
            src={buildFileUrl(data.coverImagePath)}
            alt="Course Cover"
          />

          <div className={styles.headerInfo}>
            <h1
              className={styles.courseTitleLink}
              onClick={() => navigate(`/course/${courseId}`)}
              onKeyDown={(e) =>
                e.key === "Enter" && navigate(`/course/${courseId}`)
              }
              role="link"
              tabIndex={0}
              title="Xem chi tiết khóa học"
            >
              {data.courseTitle}
            </h1>

            <p>{data.courseSubtitle}</p>
            <p>{data.teacherName}</p>

            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
              <span>{data.progressPercent}% hoàn thành</span>
            </div>
            <div className={styles.headerActions}>
              {courseStatus === "FLAGGED" && (
                <div className={styles.flaggedNotice}>
                  <b>Khóa học đang được rà soát và cập nhật nội dung</b>.
                  <br />
                  Cảm ơn bạn đã thông cảm trong thời gian này.
                </div>
              )}

              {courseStatus === "REJECTED" && (
                <div className={styles.flaggedNotice}>
                  <b>Bản cập nhật gần nhất đã bị từ chối</b>.
                  <br />
                  Khóa học đang chờ giáo viên chỉnh sửa và gửi lại.
                </div>
              )}

              {canShowFlagButton && (
                <button
                  type="button"
                  className={styles.flagBtn}
                  onClick={openFlagModal}
                  title="Báo cáo khóa học"
                >
                  🚩 Báo cáo
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===== MAIN 2 CỘT NHƯ COURSERA ===== */}
        <section className={styles.mainLayout}>
          {/* === CỘT TRÁI: MODULE (CHAPTER LIST) === */}
          <aside className={styles.moduleSidebar}>
            <h2 className={styles.sidebarTitle}>Nội dung khóa học</h2>

            <div className={styles.moduleList}>
              {nonTrialChapters.map((ch) => {
                const isActive =
                  activeChapter && ch.chapterId === activeChapter.chapterId;
                const isTrial = ch.orderIndex === 0;

                return (
                  <button
                    key={ch.chapterId}
                    type="button"
                    className={`${styles.moduleItem} ${
                      isActive ? styles.moduleItemActive : ""
                    } ${isTrial ? styles.moduleItemTrial : ""}`}
                    onClick={() => handleModuleClick(ch)}
                  >
                    <span className={styles.moduleLeftBar} />
                    <div className={styles.moduleContent}>
                      <div className={styles.moduleTopRow}>
                        <span className={styles.moduleName}>{ch.title}</span>
                        <span className={styles.modulePercent}>
                          {ch.progressPercent}%
                        </span>
                      </div>
                      <div className={styles.moduleStats}>
                        <span>
                          {ch.lessons?.length || 0} bài học •{" "}
                          {ch.progressPercent}% hoàn thành
                        </span>
                      </div>
                    </div>
                    {ch.progressPercent >= 100 && (
                      <AiOutlineCheck className={styles.moduleDoneIcon} />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* === CỘT PHẢI: PANEL LESSON CỦA CHAPTER ĐANG CHỌN === */}
          <section className={styles.chapterPanel}>
            {activeChapter ? (
              <>
                <div className={styles.chapterHeaderRow}>
                  <div>
                    <h2 className={styles.chapterTitle}>
                      {activeChapter.title}
                    </h2>
                    {activeChapter.summary && (
                      <p className={styles.chapterSummary}>
                        {activeChapter.summary}
                      </p>
                    )}
                  </div>

                  <div className={styles.chapterProgressBadge}>
                    {activeChapter.progressPercent}% hoàn thành
                  </div>
                </div>

                <div className={styles.lessonList}>
                  {activeChapter.lessons?.map((ls) => (
                    <div key={ls.lessonId} className={styles.lessonCard}>
                      {/* LESSON HEADER */}
                      <button
                        type="button"
                        className={styles.lessonHeader}
                        onClick={() => toggleLesson(ls.lessonId)}
                      >
                        <div className={styles.lessonTitleBlock}>
                          <span className={styles.lessonArrow}>
                            {openLessons.has(ls.lessonId) ? (
                              <FiChevronDown />
                            ) : (
                              <FiChevronRight />
                            )}
                          </span>
                          <span className={styles.lessonTitleText}>
                            {ls.title}
                          </span>
                        </div>

                        <div className={styles.lessonMeta}>
                          {ls.totalDurationSec > 0 && (
                            <span>
                              {Math.round(ls.totalDurationSec / 60)} phút nội
                              dung
                            </span>
                          )}
                          {ls.sections?.some(
                            (s) => s.studyType === "QUIZ" && s.quizId
                          ) && <span>Bài quiz kèm theo</span>}
                        </div>

                        {ls.isCompleted && (
                          <AiOutlineCheck className={styles.lessonDoneIcon} />
                        )}
                      </button>

                      {/* LESSON BODY: SECTION + CONTENT */}
                      <AnimatePresence initial={false}>
                        {openLessons.has(ls.lessonId) && (
                          <motion.div
                            className={styles.sectionList}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {ls.sections?.map((sec) => (
                              <div
                                key={sec.sectionId}
                                className={styles.sectionBlock}
                              >
                                <p className={styles.sectionName}>
                                  {sec.title}
                                </p>

                                <ul className={styles.contentList}>
                                  {sec.contents?.map((ct) => (
                                    <li
                                      key={ct.contentId}
                                      className={`${styles.contentItem} ${
                                        ct.isCompleted
                                          ? styles.contentCompleted
                                          : ""
                                      }`}
                                      onClick={() =>
                                        handleContentClick(
                                          ls.lessonId,
                                          ct,
                                          activeChapter.orderIndex,
                                          sec.sectionId
                                        )
                                      }
                                    >
                                      <span
                                        className={styles.contentIconWrapper}
                                      >
                                        {ct.contentFormat === "ASSET" && (
                                          <MdOndemandVideo />
                                        )}
                                        {ct.contentFormat === "RICH_TEXT" && (
                                          <IoDocumentTextOutline />
                                        )}
                                        {ct.contentFormat ===
                                          "FLASHCARD_SET" && <GiCardPick />}
                                        {ct.contentFormat === "QUIZ" && (
                                          <GiCardPick />
                                        )}
                                      </span>

                                      <span className={styles.contentMainText}>
                                        {ct.contentFormat === "ASSET" &&
                                          "Video bài giảng"}
                                        {ct.contentFormat === "RICH_TEXT" &&
                                          "Nội dung bài đọc"}
                                        {ct.contentFormat === "FLASHCARD_SET" &&
                                          "Từ vựng"}
                                        {ct.contentFormat === "QUIZ" &&
                                          "Bài quiz"}
                                      </span>

                                      {ct.isCompleted && (
                                        <AiOutlineCheck
                                          className={styles.contentDoneIcon}
                                        />
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.placeholder}>
                <h2>Bắt đầu học</h2>
                <p>Khóa học này chưa có chương nào.</p>
              </div>
            )}
          </section>
        </section>
        {/* ===== FEEDBACK SECTION ===== */}
        <section className={styles.feedbackSection}>
          <div className={styles.feedbackHeader}>
            <h2 className={styles.feedbackTitle}>Đánh giá khóa học</h2>

            <button
              type="button"
              className={styles.refreshBtn}
              onClick={fetchFeedbacks}
              disabled={fbLoading}
              title="Tải lại đánh giá"
            >
              {fbLoading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>

          {fbError && <div className={styles.feedbackError}>{fbError}</div>}

          <div className={styles.feedbackSummary}>
            <div className={styles.summaryLeft}>
              <div className={styles.avgScore}>
                {Number(summary.ratingAvg || 0).toFixed(1)}
              </div>
              <div className={styles.avgMeta}>
                <StarRating
                  value={Math.round(summary.ratingAvg || 0)}
                  readOnly
                  size="sm"
                />
                <div className={styles.countText}>
                  {summary.ratingCount || 0} đánh giá
                </div>
              </div>
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.myFeedbackBox}>
                <div className={styles.myFeedbackTitle}>
                  Viết đánh giá của bạn
                </div>

                <StarRating value={myRating} onChange={setMyRating} />

                <textarea
                  className={styles.commentBox}
                  rows={3}
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về khóa học..."
                />

                <div className={styles.feedbackActions}>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={handleSubmitFeedback}
                    disabled={posting}
                  >
                    {posting ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>

                  {postMsg && (
                    <div className={styles.postMsg} title={postMsg}>
                      {postMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.feedbackList}>
            {fbLoading && feedbacks.length === 0 ? (
              <div className={styles.feedbackEmpty}>Đang tải đánh giá...</div>
            ) : feedbacks.length === 0 ? (
              <div className={styles.feedbackEmpty}>
                Chưa có đánh giá nào. Hãy là người đầu tiên!
              </div>
            ) : (
              feedbacks.map((fb) => (
                <div
                  key={fb.id ?? `${fb.userId}-${fb.createdAt}`}
                  className={styles.feedbackItem}
                >
                  <div className={styles.feedbackAvatar}>
                    <Avatar url={fb.learnerAvatarUrl} name={fb.learnerName} />
                  </div>

                  <div className={styles.feedbackContent}>
                    <div className={styles.feedbackTopRow}>
                      <div className={styles.feedbackName}>
                        {fb.learnerName || "Người học"}
                      </div>
                      <div className={styles.feedbackTime}>
                        {formatDateTime(fb.createdAt)}
                      </div>
                    </div>

                    <StarRating
                      value={Number(fb.rating || 0)}
                      readOnly
                      size="sm"
                    />

                    {fb.comment && (
                      <div className={styles.feedbackComment}>{fb.comment}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <Modal
        title="Báo cáo khóa học"
        open={flagModalOpen}
        onOk={handleSubmitFlag}
        onCancel={() => setFlagModalOpen(false)}
        okText="Gửi báo cáo"
        cancelText="Hủy"
        confirmLoading={flagSubmitting}
      >
        <p>Hãy chọn loại báo cáo:</p>

        <select
          value={flagType}
          onChange={(e) => setFlagType(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            marginBottom: "12px",
            border: "1px solid #d1d5db",
          }}
        >
          <option value="INAPPROPRIATE_CONTENT">Nội dung không phù hợp</option>
          <option value="COPYRIGHT_VIOLATION">Vi phạm bản quyền</option>
          <option value="MISLEADING_INFO">Thông tin sai lệch</option>
          <option value="SPAM">Spam</option>
          <option value="HARASSMENT">Quấy rối</option>
          <option value="OTHER">Khác</option>
        </select>

        <p>Lý do báo cáo:</p>
        <Input.TextArea
          rows={4}
          value={flagReason}
          onChange={(e) => setFlagReason(e.target.value)}
          placeholder="Nhập lý do..."
        />
      </Modal>
    </main>
  );
}
