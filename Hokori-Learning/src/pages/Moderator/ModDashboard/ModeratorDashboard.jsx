import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Spin,
  List,
  Button,
  Drawer,
  Tree,
  Typography,
  Input,
  Select,
  Space,
  Tag,
  Empty,
  Avatar,
  Rate,
  Popconfirm,
  message,
  Divider,
} from "antd";
import api from "../../../configs/axios.js";
import { buildFileUrl } from "../../../utils/fileUrl.js";
import styles from "./ModeratorDashboard.module.scss";

const { Title, Text } = Typography;
const { Search } = Input;

const PAGE_SIZE = 9;
const COMMENT_PAGE_SIZE = 5;
const FEEDBACK_PAGE_SIZE = 5;
const getFileUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // axios baseURL: http://localhost:8080/api  => fileBase: http://localhost:8080
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const ModeratorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(null);
  const [courseTree, setCourseTree] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(undefined);

  // preview node
  const [selectedNode, setSelectedNode] = useState(null);

  // comments
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);

  // ✅ NEW: trạng thái bật/tắt comments của course (mặc định bật)
  const [courseCommentsEnabled, setCourseCommentsEnabled] = useState(true);
  const [togglingCourseComments, setTogglingCourseComments] = useState(false);
  const [togglingCommentId, setTogglingCommentId] = useState(null);

  // feedback state
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [feedbackSummaryLoading, setFeedbackSummaryLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const commentTotalPages = Math.max(
    1,
    Math.ceil(commentsTotal / COMMENT_PAGE_SIZE)
  );
  const feedbackTotalPages = Math.max(
    1,
    Math.ceil((feedbacks?.length || 0) / FEEDBACK_PAGE_SIZE)
  );

  /* ---------------- Fetch courses ---------------- */
  const fetchCourses = async (
    pageIndex = 0,
    keyword = "",
    level = undefined
  ) => {
    try {
      setLoading(true);

      const params = {
        page: pageIndex,
        size: PAGE_SIZE,
      };

      // tuỳ BE: keyword/search/q
      if (keyword?.trim()) params.keyword = keyword.trim();
      if (level) params.level = level;

      const res = await api.get("/courses", { params });

      const data = res.data || {};
      const list = Array.isArray(data.content) ? data.content : [];

      setCourses(list);
      setTotalElements(data.totalElements || list.length);
      setPage(pageIndex);
    } catch (e) {
      console.error("Failed to fetch courses", e);
      setCourses([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCourses(0, searchTerm, selectedLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedLevel]);

  /* ---------------- Fetch comments ---------------- */
  const fetchCourseComments = async (courseId, pageIndex = 0) => {
    if (!courseId) return;
    try {
      setCommentsLoading(true);
      const res = await api.get(`/courses-public/${courseId}/comments`, {
        params: { page: pageIndex, size: COMMENT_PAGE_SIZE },
      });

      const data = res.data || {};
      const list = Array.isArray(data.content) ? data.content : [];

      setComments(list);
      setCommentsTotal(data.totalElements || list.length);
      setCommentsPage(pageIndex);
    } catch (e) {
      console.error("Failed to fetch comments", e);
      setComments([]);
      setCommentsTotal(0);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ====== MODERATOR APIs: enable/disable comments ======
  const disableCourseComments = async (courseId) => {
    if (!courseId) return;
    try {
      setTogglingCourseComments(true);
      await api.put(`/moderator/courses/${courseId}/disable-comments`);
      setCourseCommentsEnabled(false);
      message.success("Đã tắt chức năng bình luận cho khóa học.");
    } catch (e) {
      console.error("disableCourseComments failed", e);
      message.error(e?.response?.data?.message || "Tắt bình luận thất bại.");
    } finally {
      setTogglingCourseComments(false);
    }
  };

  const enableCourseComments = async (courseId) => {
    if (!courseId) return;
    try {
      setTogglingCourseComments(true);
      await api.put(`/moderator/courses/${courseId}/enable-comments`);
      setCourseCommentsEnabled(true);
      message.success("Đã bật chức năng bình luận cho khóa học.");
    } catch (e) {
      console.error("enableCourseComments failed", e);
      message.error(e?.response?.data?.message || "Bật bình luận thất bại.");
    } finally {
      setTogglingCourseComments(false);
    }
  };

  const disableOneComment = async (courseId, commentId) => {
    if (!courseId || !commentId) return;
    try {
      setTogglingCommentId(commentId);
      await api.put(
        `/moderator/courses/${courseId}/comments/${commentId}/disable`
      );
      message.success("Đã ẩn bình luận.");

      // ✅ FE-only: giữ comment trong list và set trạng thái disabled
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: "DISABLED",
                disabled: true,
                enabled: false,
                isDisabled: true,
              }
            : c
        )
      );
    } catch (e) {
      console.error("disableOneComment failed", e);
      message.error(e?.response?.data?.message || "Ẩn bình luận thất bại.");
    } finally {
      setTogglingCommentId(null);
    }
  };

  const restoreOneComment = async (courseId, commentId) => {
    if (!courseId || !commentId) return;
    try {
      setTogglingCommentId(commentId);
      await api.put(
        `/moderator/courses/${courseId}/comments/${commentId}/restore`
      );
      message.success("Đã khôi phục bình luận.");

      // ✅ FE-only: set lại trạng thái visible
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: "VISIBLE",
                disabled: false,
                enabled: true,
                isDisabled: false,
              }
            : c
        )
      );
    } catch (e) {
      console.error("restoreOneComment failed", e);
      message.error(
        e?.response?.data?.message || "Khôi phục bình luận thất bại."
      );
    } finally {
      setTogglingCommentId(null);
    }
  };

  // ===== Feedback APIs =====
  const fetchFeedbackSummary = async (courseId) => {
    if (!courseId) return;
    try {
      setFeedbackSummaryLoading(true);
      const res = await api.get(`/courses/${courseId}/feedbacks/summary`);
      const payload = res.data || {};
      const data = payload.data ?? payload;
      setFeedbackSummary(data);
    } catch (e) {
      console.error("Failed to fetch feedback summary", e);
      setFeedbackSummary(null);
    } finally {
      setFeedbackSummaryLoading(false);
    }
  };

  const fetchFeedbacks = async (courseId) => {
    if (!courseId) return;
    try {
      setFeedbackLoading(true);
      const res = await api.get(`/courses/${courseId}/feedbacks`);
      const payload = res.data || {};
      const list = payload.data ?? payload;
      setFeedbacks(Array.isArray(list) ? list : []);
      setFeedbackPage(0);
    } catch (e) {
      console.error("Failed to fetch feedback list", e);
      setFeedbacks([]);
      setFeedbackPage(0);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const deleteFeedback = async (courseId, feedbackId) => {
    if (!courseId || !feedbackId) return;
    try {
      setDeletingFeedbackId(feedbackId);
      await api.delete(`/courses/${courseId}/feedbacks/${feedbackId}`);
      message.success("Đã xóa feedback.");
      await Promise.all([
        fetchFeedbacks(courseId),
        fetchFeedbackSummary(courseId),
      ]);
    } catch (e) {
      console.error("Failed to delete feedback", e);
      message.error(e?.response?.data?.message || "Xóa feedback thất bại.");
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  /* ---------------- Fetch tree ---------------- */
  const fetchCourseTree = async (courseId, title) => {
    try {
      setTreeLoading(true);
      setSelectedCourseId(courseId);
      setSelectedCourseTitle(title);
      setSelectedNode(null);

      const res = await api.get(`/courses/${courseId}/tree`);
      setCourseTree(res.data);
      setOpenDrawer(true);

      // ✅ reset trạng thái comments course mỗi lần mở drawer (mặc định bật)
      setCourseCommentsEnabled(true);

      // load comments + feedback
      fetchCourseComments(courseId, 0);
      fetchFeedbackSummary(courseId);
      fetchFeedbacks(courseId);
    } catch (e) {
      console.error("Failed to fetch course tree", e);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(0);
  }, []);

  /* ---------------- Level options ---------------- */
  const levelOptions = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    const levels = Array.from(
      new Set(list.map((c) => c.level).filter(Boolean))
    );
    return levels.map((lv) => ({ label: lv, value: lv }));
  }, [courses]);

  /* ---------------- Filter current page ---------------- */
  const filteredCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    return list.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const lvl = c.level;

      if (searchTerm && !title.includes(searchTerm.trim().toLowerCase()))
        return false;
      if (selectedLevel && lvl !== selectedLevel) return false;
      return true;
    });
  }, [courses, searchTerm, selectedLevel]);

  /* ---------------- Tree build ---------------- */
  const buildTreeData = (course) => {
    if (!course) return [];
    const chapters = course.chapters || [];
    return [
      {
        title: course.title,
        key: `course-${course.id}`,
        nodeType: "course",
        nodeData: course,
        children: chapters.map((ch) => ({
          title: `${ch.title}`,
          key: `chapter-${ch.id}`,
          nodeType: "chapter",
          nodeData: ch,
          children: (ch.lessons || []).map((les) => ({
            title: ` ${les.title}`,
            key: `lesson-${les.id}`,
            nodeType: "lesson",
            nodeData: les,
            children: (les.sections || []).map((sec) => ({
              title: ` ${sec.title} `,
              key: `section-${sec.id}`,
              nodeType: "section",
              nodeData: sec,
            })),
          })),
        })),
      },
    ];
  };

  const handleTreeSelect = (keys, info) => {
    if (!info || !info.node) return;
    const { nodeType, nodeData } = info.node;
    setSelectedNode({ nodeType, data: nodeData });
  };

  /* ---------------- Preview panel (giữ nguyên của bạn) ---------------- */
  const renderContentPreview = () => {
    if (!selectedNode) {
      return (
        <div style={{ padding: 12 }}>
          <Text type="secondary">Chọn một phần bên trái để xem preview.</Text>
        </div>
      );
    }
    const { nodeType, data } = selectedNode;

    if (nodeType === "course") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>{data.title}</Title>
          <p>
            <b>Cấp độ:</b> {data.level}
          </p>
          <p>
            <b>Giá:</b> {data.priceCents} {data.currency}
          </p>
          <p>
            <b>Trạng thái:</b> {data.status}
          </p>
          <p>
            <b>Giáo viên:</b> {data.teacherName}
          </p>
          <p>
            <b>Phụ đề:</b> {data.subtitle}
          </p>
          {data.description && (
            <p>
              <b>Mô tả:</b> {data.description}
            </p>
          )}
        </div>
      );
    }

    if (nodeType === "chapter") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>Chapter: {data.title}</Title>
          {data.summary && (
            <p>
              <b>Tóm tắt:</b> {data.summary}
            </p>
          )}
          <p>
            <b>Số bài:</b> {(data.lessons || []).length}
          </p>
        </div>
      );
    }

    if (nodeType === "lesson") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>Bài học: {data.title}</Title>
          <p>
            <b>Số phần:</b> {(data.sections || []).length}
          </p>
        </div>
      );
    }

    if (nodeType === "section") {
      const contents = data.contents || [];
      const mainAsset =
        contents.find((c) => c.contentFormat === "ASSET" && c.primaryContent) ||
        contents.find((c) => c.contentFormat === "ASSET");

      const richTexts = contents.filter(
        (c) => c.contentFormat === "RICH_TEXT" && c.richText
      );

      let assetBlock = null;
      if (mainAsset && mainAsset.filePath) {
        const url = buildFileUrl(mainAsset.filePath);
        const ext = mainAsset.filePath.split(".").pop()?.toLowerCase() || "";

        if (["mp4", "webm", "ogg"].includes(ext)) {
          assetBlock = (
            <>
              <Text strong>Video:</Text>
              <video
                src={url}
                style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                controls
              />
            </>
          );
        } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          assetBlock = (
            <>
              <Text strong>Hình ảnh:</Text>
              <img
                src={url}
                alt="section-asset"
                style={{
                  width: "100%",
                  marginTop: 8,
                  borderRadius: 8,
                  objectFit: "contain",
                  maxHeight: 350,
                }}
              />
            </>
          );
        } else {
          assetBlock = (
            <>
              <Text strong>File asset:</Text>
              <div style={{ marginTop: 8 }}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              </div>
            </>
          );
        }
      }

      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>{data.title}</Title>
          <p>
            <b>{data.studyType}</b>
          </p>

          {assetBlock && (
            <div style={{ marginTop: 12, marginBottom: 16 }}>{assetBlock}</div>
          )}

          {richTexts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text strong>Nội dung:</Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                  background: "#fafafa",
                  whiteSpace: "pre-wrap",
                }}
              >
                {richTexts.map((c) => (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    {c.richText}
                  </div>
                ))}
              </div>
            </div>
          )}

          {contents.length === 0 && (
            <Text type="secondary">
              Section này hiện chưa có nội dung (contents trống).
            </Text>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: 12 }}>
        <Text type="secondary">Không có nội dung preview.</Text>
      </div>
    );
  };

  /* ---------------- Comments helpers ---------------- */
  const isCommentDisabled = (cmt) => {
    // hỗ trợ nhiều shape khác nhau từ BE
    if (!cmt) return false;
    if (typeof cmt.disabled === "boolean") return cmt.disabled;
    if (typeof cmt.isDisabled === "boolean") return cmt.isDisabled;
    if (typeof cmt.enabled === "boolean") return !cmt.enabled;
    const s = String(cmt.status || "").toUpperCase();
    return s === "DISABLED" || s === "HIDDEN";
  };

  const renderReplies = (replies) => {
    if (!Array.isArray(replies) || replies.length === 0) return null;
    return (
      <div
        style={{
          marginTop: 6,
          paddingLeft: 32,
          borderLeft: "2px solid #f0f0f0",
        }}
      >
        {replies.map((r, idx) => {
          const content =
            typeof r === "string" ? r : r.content || JSON.stringify(r);
          const author = typeof r === "string" ? "" : r.authorName || "Reply";
          return (
            <div key={idx} style={{ marginBottom: 8 }}>
              <Text strong>{author}</Text>
              <div>{content}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------- Render comments card (✅ ĐÃ GẮN UI) ---------------- */
  const renderCommentsCard = () => {
    if (!selectedCourseId) {
      return (
        <Card title="Comments" size="small">
          <Text type="secondary">Chọn một course để xem comments.</Text>
        </Card>
      );
    }

    return (
      <Card
        title="Comments"
        size="small"
        extra={
          <Space size={8} wrap>
            <Tag color={courseCommentsEnabled ? "green" : "red"}>
              {courseCommentsEnabled ? "Enabled" : "Disabled"}
            </Tag>

            <Button
              size="small"
              onClick={() =>
                fetchCourseComments(selectedCourseId, commentsPage)
              }
              loading={commentsLoading}
            >
              Tải lại
            </Button>

            {!courseCommentsEnabled ? (
              <Popconfirm
                title="Bật lại bình luận cho khóa học này?"
                okText="Bật"
                cancelText="Hủy"
                onConfirm={() => enableCourseComments(selectedCourseId)}
              >
                <Button
                  size="small"
                  type="primary"
                  loading={togglingCourseComments}
                >
                  Bật bình luận
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="Tắt bình luận cho khóa học này? Learner sẽ không comment được nữa."
                okText="Tắt"
                cancelText="Hủy"
                onConfirm={() => disableCourseComments(selectedCourseId)}
              >
                <Button size="small" danger loading={togglingCourseComments}>
                  Tắt bình luận
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {commentsLoading ? (
          <Spin size="small" />
        ) : comments.length === 0 ? (
          <Empty
            description="Chưa có bình luận nào cho khóa học này."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={comments}
              renderItem={(cmt) => {
                const disabled = isCommentDisabled(cmt);

                return (
                  <List.Item
                    key={cmt.id}
                    actions={[
                      disabled ? (
                        <Popconfirm
                          key="restore"
                          title="Khôi phục bình luận này?"
                          okText="Khôi phục"
                          cancelText="Hủy"
                          onConfirm={() =>
                            restoreOneComment(selectedCourseId, cmt.id)
                          }
                        >
                          <Button
                            size="small"
                            type="primary"
                            loading={togglingCommentId === cmt.id}
                          >
                            Khôi phục
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Popconfirm
                          key="hide"
                          title="Ẩn bình luận này?"
                          okText="Ẩn"
                          cancelText="Hủy"
                          onConfirm={() =>
                            disableOneComment(selectedCourseId, cmt.id)
                          }
                        >
                          <Button
                            size="small"
                            danger
                            loading={togglingCommentId === cmt.id}
                          >
                            Ẩn bình luận
                          </Button>
                        </Popconfirm>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        cmt.avatarUrl ? (
                          <Avatar src={getFileUrl(cmt.avatarUrl)} />
                        ) : (
                          <Avatar>{(cmt.authorName || "?")[0]}</Avatar>
                        )
                      }
                      title={
                        <Space size={8} wrap>
                          <Text strong>{cmt.authorName}</Text>

                          <Tag color={disabled ? "red" : "green"}>
                            {disabled ? "Disabled" : "Visible"}
                          </Tag>

                          <Text
                            type="secondary"
                            className={styles.commentMetaTime}
                          >
                            {cmt.createdAt &&
                              new Date(cmt.createdAt).toLocaleString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <div style={{ opacity: disabled ? 0.6 : 1 }}>
                          {cmt.content}
                        </div>
                      }
                    />

                    {renderReplies(cmt.replies)}
                  </List.Item>
                );
              }}
            />

            {commentTotalPages > 1 && (
              <div className={styles.paginationBar}>
                <Button
                  size="small"
                  disabled={commentsPage === 0}
                  onClick={() =>
                    commentsPage > 0 &&
                    fetchCourseComments(selectedCourseId, commentsPage - 1)
                  }
                >
                  Trước
                </Button>

                <span style={{ fontSize: 12 }}>
                  Page <b>{commentsPage + 1}</b> / {commentTotalPages}
                </span>

                <Button
                  size="small"
                  disabled={commentsPage + 1 >= commentTotalPages}
                  onClick={() =>
                    commentsPage + 1 < commentTotalPages &&
                    fetchCourseComments(selectedCourseId, commentsPage + 1)
                  }
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  /* ---------------- Render Feedback card (giữ nguyên của bạn) ---------------- */
  const renderFeedbackCard = () => {
    if (!selectedCourseId) {
      return (
        <Card title="Feedback" size="small">
          <Text type="secondary">Chọn một course để xem feedback.</Text>
        </Card>
      );
    }

    const avg = feedbackSummary?.ratingAvg ?? 0;
    const count = feedbackSummary?.ratingCount ?? 0;

    const startIndex = feedbackPage * FEEDBACK_PAGE_SIZE;
    const endIndex = startIndex + FEEDBACK_PAGE_SIZE;
    const pageItems = (feedbacks || []).slice(startIndex, endIndex);

    return (
      <Card
        title="Feedback (rating + comment)"
        size="small"
        extra={
          <Space>
            <Button
              size="small"
              onClick={() => {
                fetchFeedbackSummary(selectedCourseId);
                fetchFeedbacks(selectedCourseId);
              }}
            >
              Tải lại
            </Button>
          </Space>
        }
      >
        {feedbackSummaryLoading ? (
          <Spin size="small" />
        ) : (
          <div style={{ marginBottom: 10 }}>
            <Space align="center" size={10} wrap>
              <Text strong>Điểm trung bình:</Text>
              <Rate disabled allowHalf value={Number(avg) || 0} />
              <Tag color="blue">{(Number(avg) || 0).toFixed(2)}</Tag>
              <Text type="secondary">({count} lượt đánh giá)</Text>
            </Space>
          </div>
        )}

        <Divider style={{ margin: "10px 0" }} />

        {feedbackLoading ? (
          <Spin size="small" />
        ) : feedbacks.length === 0 ? (
          <Empty
            description="Chưa có feedback nào."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={pageItems}
              renderItem={(fb) => {
                const avatarUrl = fb.learnerAvatarUrl
                  ? getFileUrl(fb.learnerAvatarUrl)
                  : null;

                const createdAt = fb.createdAt
                  ? new Date(fb.createdAt).toLocaleString()
                  : null;

                return (
                  <List.Item
                    key={fb.id}
                    actions={[
                      <Popconfirm
                        key="del"
                        title="Xóa feedback này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() =>
                          deleteFeedback(selectedCourseId, fb.id)
                        }
                      >
                        <Button
                          danger
                          size="small"
                          loading={deletingFeedbackId === fb.id}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        avatarUrl ? (
                          <Avatar src={avatarUrl} />
                        ) : (
                          <Avatar>{(fb.learnerName || "?")[0]}</Avatar>
                        )
                      }
                      title={
                        <Space size={10} wrap>
                          <Text strong>{fb.learnerName || "Learner"}</Text>
                          <Rate
                            disabled
                            allowHalf
                            value={Number(fb.rating) || 0}
                          />
                          {createdAt && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {createdAt}
                            </Text>
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {fb.comment ? (
                            fb.comment
                          ) : (
                            <Text type="secondary">—</Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            {feedbackTotalPages > 1 && (
              <div className={styles.paginationBar}>
                <Button
                  size="small"
                  disabled={feedbackPage === 0}
                  onClick={() => setFeedbackPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </Button>

                <span style={{ fontSize: 12 }}>
                  Page <b>{feedbackPage + 1}</b> / {feedbackTotalPages}
                </span>

                <Button
                  size="small"
                  disabled={feedbackPage + 1 >= feedbackTotalPages}
                  onClick={() =>
                    setFeedbackPage((p) =>
                      Math.min(feedbackTotalPages - 1, p + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Title level={3} className={styles.title}>
          Moderator – Những khóa học công khai
        </Title>

        <Tag color="blue" className={styles.pageTag}>
          Page {page + 1} • {Array.isArray(courses) ? courses.length : 0} /{" "}
          {totalElements} courses
        </Tag>
      </div>

      <div className={styles.filterBar}>
        <Search
          className={styles.search}
          placeholder="Search by course title"
          allow_toggle="true"
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(value) => setSearchTerm(value)}
        />

        <Select
          className={styles.select}
          allowClear
          placeholder="Filter by level"
          options={levelOptions}
          value={selectedLevel}
          onChange={setSelectedLevel}
        />

        <Button onClick={() => fetchCourses(page, searchTerm, selectedLevel)}>
          Tải lại
        </Button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <Spin size="large" />
        ) : filteredCourses.length === 0 ? (
          <Empty description="Không tìm thấy khóa học nào" />
        ) : (
          <>
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={filteredCourses}
              pagination={false}
              renderItem={(course) => (
                <List.Item className={styles.listItem}>
                  <Card
                    hoverable
                    className={styles.courseCard}
                    bodyStyle={{ padding: 0 }}
                    cover={
                      <div className={styles.cover}>
                        {course.coverImagePath ? (
                          <img
                            src={buildFileUrl(course.coverImagePath)}
                            alt={course.title}
                            className={styles.coverImg}
                          />
                        ) : (
                          <span className={styles.noCover}>No cover image</span>
                        )}
                      </div>
                    }
                  >
                    <div className={styles.courseCardBody}>
                      <div className={styles.courseMeta}>
                        <Text className={styles.courseTitle}>
                          {course.title}
                        </Text>

                        <p className={styles.metaRow}>
                          <b>Trình độ:</b> {course.level || "—"}
                        </p>
                        <p className={styles.metaRow}>
                          <b>Giá:</b> {course.priceCents} {course.currency}
                        </p>
                        <p className={styles.metaRow}>
                          <b>Trạng thái:</b> {course.status}
                        </p>
                        <p className={styles.metaRow}>
                          <b>Giáo viên:</b> {course.teacherName}
                        </p>
                      </div>

                      <div className={styles.cardActions}>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() =>
                            fetchCourseTree(course.id, course.title)
                          }
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />

            {totalPages > 1 && (
              <div className={styles.paginationBar}>
                <Button
                  size="small"
                  disabled={page === 0}
                  onClick={() =>
                    page > 0 &&
                    fetchCourses(page - 1, searchTerm, selectedLevel)
                  }
                >
                  Trước
                </Button>
                <span>
                  Trang <b>{page + 1}</b> / {totalPages}
                </span>

                <Button
                  size="small"
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    page + 1 < totalPages &&
                    fetchCourses(page + 1, searchTerm, selectedLevel)
                  }
                >
                  Tiếp
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Drawer
        title={`Chi tiết khóa học: ${selectedCourseTitle || ""}`}
        open={openDrawer}
        width={1000}
        onClose={() => setOpenDrawer(false)}
      >
        {treeLoading ? (
          <Spin size="large" />
        ) : !courseTree ? (
          <Empty description="Không có dữ liệu cây khóa học" />
        ) : (
          <div className={styles.drawerGrid}>
            <Card title="Khóa học" size="small" className={styles.treeCard}>
              <div className={styles.treeScroll}>
                <Tree
                  treeData={buildTreeData(courseTree)}
                  defaultExpandAll
                  onSelect={handleTreeSelect}
                />
              </div>
            </Card>

            <div className={styles.rightCol}>
              <Card title="Xem trước" size="small">
                {renderContentPreview()}
              </Card>

              {renderFeedbackCard()}

              {/* ✅ Comments đã có nút Enable/Disable + Hide/Restore */}
              {renderCommentsCard()}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ModeratorDashboard;
