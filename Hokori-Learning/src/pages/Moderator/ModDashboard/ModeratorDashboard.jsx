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

const ModeratorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0); // 0-based cho BE
  const [totalElements, setTotalElements] = useState(0);

  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(null);
  const [courseTree, setCourseTree] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(undefined);

  // preview node (chapter / lesson / section)
  const [selectedNode, setSelectedNode] = useState(null);

  // comments state (giữ nguyên logic cũ của bạn)
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);

  // ===== Feedback state (NEW) =====
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [feedbackSummaryLoading, setFeedbackSummaryLoading] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(0); // local pagination (client-side)
  const [deletingFeedbackId, setDeletingFeedbackId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const commentTotalPages = Math.max(
    1,
    Math.ceil(commentsTotal / COMMENT_PAGE_SIZE)
  );

  // Feedback total pages (client-side)
  const feedbackTotalPages = Math.max(
    1,
    Math.ceil((feedbacks?.length || 0) / FEEDBACK_PAGE_SIZE)
  );

  /* ---------------- Fetch PUBLIC courses (pagination) ---------------- */
  const fetchCourses = async (pageIndex = 0) => {
    try {
      setLoading(true);
      const res = await api.get("/courses", {
        params: { page: pageIndex, size: PAGE_SIZE },
      });

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

  /* ---------------- Fetch comments for a course ---------------- */
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

  // ===== Feedback APIs (NEW) =====
  const fetchFeedbackSummary = async (courseId) => {
    if (!courseId) return;
    try {
      setFeedbackSummaryLoading(true);
      const res = await api.get(`/courses/${courseId}/feedbacks/summary`);
      const payload = res.data || {};
      const data = payload.data ?? payload; // support both shapes
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

      // refresh list + summary
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

  /* ---------------- Fetch full tree of one course ---------------- */
  const fetchCourseTree = async (courseId, title) => {
    try {
      setTreeLoading(true);
      setSelectedCourseId(courseId);
      setSelectedCourseTitle(title);
      setSelectedNode(null);

      const res = await api.get(`/courses/${courseId}/tree`);
      setCourseTree(res.data);
      setOpenDrawer(true);

      // load comments + feedback luôn
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

      if (searchTerm && !title.includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      if (selectedLevel && lvl !== selectedLevel) return false;
      return true;
    });
  }, [courses, searchTerm, selectedLevel]);

  /* ---------------- Tree: course → chapters → lessons → sections ---------------- */
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

  /* ---------------- Preview panel ---------------- */
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

    // Section: gom toàn bộ contents của 1 section thành 1 preview
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

  /* ---------------- Render comments ---------------- */
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

  const renderCommentsCard = () => {
    if (!selectedCourseId) {
      return (
        <Card title="Comments" size="small">
          <Text type="secondary">Chọn một course để xem comments.</Text>
        </Card>
      );
    }

    return (
      <Card title="Comments" size="small">
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
              renderItem={(cmt) => (
                <List.Item key={cmt.id}>
                  <List.Item.Meta
                    avatar={
                      cmt.avatarUrl ? (
                        <Avatar src={buildFileUrl(cmt.avatarUrl)} />
                      ) : (
                        <Avatar>{(cmt.authorName || "?")[0]}</Avatar>
                      )
                    }
                    title={
                      <Space direction="horizontal" size={8}>
                        <Text strong>{cmt.authorName}</Text>
                        <Text
                          type="secondary"
                          className={styles.commentMetaTime}
                        >
                          {cmt.createdAt &&
                            new Date(cmt.createdAt).toLocaleString()}
                        </Text>
                      </Space>
                    }
                    description={cmt.content}
                  />
                  {renderReplies(cmt.replies)}
                </List.Item>
              )}
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
                  Prev
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
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  // ===== Render Feedback card (NEW) =====
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
              Reload
            </Button>
          </Space>
        }
      >
        {/* Summary */}
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

        {/* List */}
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
                  ? buildFileUrl(fb.learnerAvatarUrl)
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

      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <Search
          className={styles.search}
          placeholder="Search by course title"
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

        <Button onClick={() => fetchCourses(page)}>Reload</Button>
      </div>

      {/* COURSE LIST + CUSTOM PAGINATION */}
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
                  onClick={() => page > 0 && fetchCourses(page - 1)}
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
                    page + 1 < totalPages && fetchCourses(page + 1)
                  }
                >
                  Tiếp
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRAWER: TREE + PREVIEW + FEEDBACK + COMMENTS */}
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

              {renderCommentsCard()}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ModeratorDashboard;
