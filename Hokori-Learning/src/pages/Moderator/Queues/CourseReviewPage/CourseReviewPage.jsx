import React, { useEffect, useState } from "react";
import {
  Descriptions,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Alert,
  message,
  Progress,
  Divider,
} from "antd";
import { ArrowLeftOutlined, RobotOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import styles from "./CourseReviewPage.module.scss";

// ⚠️ chỉnh path cho đúng
import api from "../../../../configs/axios.js";
// ⚠️ chỉnh path cho đúng tới CourseCurriculumView
import CourseCurriculumView from "../../../Teacher/Courses/CourseCurriculumView/CourseCurriculumView.jsx";

const { Text, Title, Paragraph } = Typography;

function formatPriceFromCourse(course) {
  if (!course) return "—";
  const { priceCents } = course || {};
  if (typeof priceCents !== "number") return "—";
  const amount = priceCents;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    console.log(e);
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }
}

const getSafetyStatusColor = (status) => {
  switch ((status || "").toUpperCase()) {
    case "SAFE":
      return "green";
    case "WARNING":
      return "gold";
    case "UNSAFE":
      return "red";
    default:
      return "default";
  }
};

const formatScore10 = (score) => {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  const s = Math.max(0, Math.min(1, score)); // clamp 0–1
  return Math.round(s * 100) / 10; // 0.0 – 10.0
};

export default function CourseReviewPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();

  const initialCourse = location.state?.course || null;

  const [course, setCourse] = useState(initialCourse);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const res = await api.get(`/moderator/courses/${courseId}/detail`);
        const payload = res.data;
        const detailData = payload?.data ?? payload;

        if (!isMounted) return;

        setDetail(detailData);
        if (!course) setCourse(detailData);
      } catch (err) {
        console.error("Failed to load moderator course detail:", err);
        if (!isMounted) return;
        setDetailError(
          err?.response?.data?.message ||
            "Không tải được nội dung chi tiết khoá học."
        );
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const status = course?.status || "PENDING_APPROVAL";
  const statusColor =
    status === "PENDING_APPROVAL"
      ? "gold"
      : status === "PUBLISHED"
      ? "green"
      : status === "DRAFT"
      ? "default"
      : "default";

  const statusLabel =
    status === "PENDING_APPROVAL"
      ? "Pending approval"
      : status === "PUBLISHED"
      ? "Published"
      : status === "DRAFT"
      ? "Draft"
      : status;

  const priceLabel = formatPriceFromCourse(course);

  const handleApprove = async () => {
    try {
      await api.put(`/moderator/courses/${courseId}/approve`);
      message.success("Đã approve & publish khóa học.");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Approve khóa học thất bại."
      );
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/moderator/courses/${courseId}/reject`);
      message.success("Đã reject khóa học.");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Reject khóa học thất bại."
      );
    }
  };

  const handleAiReview = async () => {
    if (!courseId) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await api.get(`/moderator/courses/${courseId}/ai-check`);
      const payload = res.data;
      const reviewData = payload?.data ?? payload;

      setAiReview(reviewData);
    } catch (err) {
      console.error("AI review error:", err);

      const status = err?.response?.status;

      if (status === 503) {
        setAiError("AI service hiện không khả dụng. Vui lòng thử lại sau.");
      } else if (status === 400) {
        setAiError(
          "Course không ở trạng thái PENDING_APPROVAL, không thể AI check."
        );
      } else if (status === 404) {
        setAiError("Không tìm thấy course để AI check.");
      } else if (status === 401 || status === 403) {
        setAiError(
          "Bạn không có quyền sử dụng AI check. Vui lòng đăng nhập lại."
        );
      } else {
        setAiError(
          err?.response?.data?.message ||
            "Không gọi được AI review. Kiểm tra endpoint / cấu hình."
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={styles.reviewPageWrapper}>
      {/* TOP BAR */}
      <div className={styles.reviewHeaderBar}>
        <Space size={12}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="text"
          />
          <div>
            <Title level={4} className={styles.headerTitle}>
              Duyệt khóa #{courseId}
            </Title>
            <Text type="secondary" className={styles.headerSubtitle}>
              {course?.title || "—"}
              {course && (
                <>
                  {" · "}
                  Teacher: {course.teacherName || `User #${course.userId}`}
                </>
              )}
            </Text>
          </div>
        </Space>

        <Space>
          <Button
            icon={<RobotOutlined />}
            onClick={handleAiReview}
            loading={aiLoading}
          >
            AI review nội dung khóa học
          </Button>
          <Button type="primary" onClick={handleApprove}>
            Duyệt &amp; Xuất bản
          </Button>
          <Button danger onClick={handleReject}>
            Từ chối
          </Button>
        </Space>
      </div>

      {/* BODY 2 CỘT */}
      <div className={styles.reviewPageContent}>
        {/* LEFT: FULL CURRICULUM */}
        <div className={styles.reviewMainColumn}>
          <Descriptions
            bordered
            column={2}
            size="small"
            labelStyle={{ width: 160, fontWeight: 500 }}
            className={styles.metaBlock}
          >
            <Descriptions.Item label="Mã khoá học">
              #{course?.id || courseId}
            </Descriptions.Item>
            <Descriptions.Item label="Giáo viên">
              {course?.teacherName || `User #${course?.userId}` || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề" span={2}>
              <Text strong>{course?.title || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tình trạng">
              <Tag color={statusColor}>{statusLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              {course?.level || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá (VND)">
              {priceLabel}
            </Descriptions.Item>
          </Descriptions>

          {detailError && (
            <Alert
              type="error"
              message="Không tải được curriculum chi tiết"
              description={detailError}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div className={styles.curriculumBlock}>
            <div className={styles.blockHeader}>
              <h3>Xem trước nội dung khoá học</h3>
              <Paragraph type="secondary">
                Xem trước đầy đủ như màn Curriculum của Teacher (chapter,
                lesson, content, video, quiz, flashcard…).
              </Paragraph>
            </div>

            <CourseCurriculumView
              courseMeta={course || detail}
              courseTree={detail}
              loading={loadingDetail}
            />
          </div>
        </div>

        {/* RIGHT: AI REVIEW */}
        <div className={styles.reviewSideColumn}>
          <div className={styles.detailBox}>
            <h3 className={styles.sideTitle}>
              <RobotOutlined style={{ marginRight: 6 }} />
              AI review
            </h3>

            {aiLoading && (
              <div className={styles.aiLoading}>
                <Spin />
              </div>
            )}

            {aiError && (
              <Alert
                type="error"
                message="AI review error"
                description={aiError}
                showIcon
              />
            )}

            {!aiLoading && !aiError && !aiReview && (
              <Text type="secondary">
                Bấm nút “AI review nội dung khóa học” ở trên để nhận nhận xét về
                nội dung, cấu trúc, độ phù hợp với học viên…
              </Text>
            )}

            {!aiLoading && aiReview && (
              <div className={styles.aiReviewBox}>
                {(() => {
                  const safety = aiReview.safetyCheck || {};
                  const levelMatch = aiReview.levelMatch || {};
                  const overview = aiReview.contentOverview || {};
                  const pedagogy = aiReview.pedagogicalQuality || null;
                  const langAcc = aiReview.languageAccuracy || null;
                  const grammarProg = aiReview.grammarProgression || null;

                  const overallScore10 =
                    typeof aiReview.overallScore10 === "number"
                      ? aiReview.overallScore10
                      : formatScore10(safety.score);

                  const hasIssues =
                    safety.hasIssues === true ||
                    (Array.isArray(aiReview.warnings) &&
                      aiReview.warnings.length > 0);

                  // xử lý trường hợp Gemini lỗi dài dòng (nếu BE còn trả)
                  const rawLevelSummary = levelMatch.summary;
                  const levelSummary =
                    rawLevelSummary &&
                    rawLevelSummary.includes("Failed to call Gemini API")
                      ? "Không thể đánh giá chi tiết level vì dịch vụ AI phụ (Gemini) trên server chưa được bật. Các phần khác vẫn được kiểm tra bình thường."
                      : rawLevelSummary;

                  const pedagogyScore10 = pedagogy
                    ? formatScore10(pedagogy.score)
                    : null;
                  const langScore10 = langAcc
                    ? formatScore10(langAcc.score)
                    : null;
                  const grammarScore10 = grammarProg
                    ? formatScore10(grammarProg.score)
                    : null;

                  return (
                    <>
                      {/* Header: course + thời gian + overall score */}
                      <div className={styles.aiHeaderRow}>
                        <div className={styles.aiHeaderMain}>
                          <Paragraph strong className={styles.aiCourseTitle}>
                            {aiReview.courseTitle ||
                              course?.title ||
                              `Course #${courseId}`}
                          </Paragraph>
                          <Text type="secondary">
                            Checked at:{" "}
                            {aiReview.checkedAt
                              ? new Date(aiReview.checkedAt).toLocaleString(
                                  "vi-VN"
                                )
                              : "—"}
                          </Text>
                        </div>

                        {overallScore10 !== null && (
                          <div className={styles.aiScoreBlock}>
                            <Text strong>Overall score</Text>
                            <Progress
                              percent={(overallScore10 / 10) * 100}
                              format={() => `${overallScore10}/10`}
                              size="small"
                              status={hasIssues ? "exception" : "normal"}
                            />
                          </div>
                        )}
                      </div>

                      <Divider />

                      {/* Content overview (nếu BE có build sau này) */}
                      {(overview.totalChapters ||
                        overview.totalLessons ||
                        overview.totalQuizzes ||
                        overview.estimatedStudyHours) && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Tổng quan nội dung
                          </div>
                          <div className={styles.aiOverviewRow}>
                            <div className={styles.aiOverviewItem}>
                              <Text type="secondary">Chapters</Text>
                              <div className={styles.aiOverviewValue}>
                                {overview.totalChapters ?? 0}
                              </div>
                            </div>
                            <div className={styles.aiOverviewItem}>
                              <Text type="secondary">Lessons</Text>
                              <div className={styles.aiOverviewValue}>
                                {overview.totalLessons ?? 0}
                              </div>
                            </div>
                            <div className={styles.aiOverviewItem}>
                              <Text type="secondary">Quizzes</Text>
                              <div className={styles.aiOverviewValue}>
                                {overview.totalQuizzes ?? 0}
                              </div>
                            </div>
                            <div className={styles.aiOverviewItem}>
                              <Text type="secondary">Est. hours</Text>
                              <div className={styles.aiOverviewValue}>
                                {overview.estimatedStudyHours ?? 0}
                              </div>
                            </div>
                          </div>
                          {overview.summary && (
                            <Paragraph style={{ marginTop: 8 }}>
                              {overview.summary}
                            </Paragraph>
                          )}
                        </div>
                      )}

                      {/* Safety check */}
                      {aiReview.safetyCheck && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Kiểm tra an toàn nội dung
                          </div>
                          <Space direction="vertical" size={4}>
                            <Space>
                              <Tag color={getSafetyStatusColor(safety.status)}>
                                {safety.status || "UNKNOWN"}
                              </Tag>
                              {overallScore10 !== null && (
                                <Text type="secondary">
                                  Safety score (scaled): {overallScore10}/10
                                </Text>
                              )}
                            </Space>
                            <Paragraph style={{ marginBottom: 0 }}>
                              {safety.summary}
                            </Paragraph>
                          </Space>
                        </div>
                      )}

                      {/* Level match */}
                      {aiReview.levelMatch && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Mức độ phù hợp trình độ
                          </div>
                          <Space direction="vertical" size={4}>
                            <Space wrap>
                              {levelMatch.declaredLevel && (
                                <Tag>
                                  Đang hướng tới: {levelMatch.declaredLevel}
                                </Tag>
                              )}
                              {levelMatch.detectedLevel && (
                                <Tag color="blue">
                                  Đã phát hiện: {levelMatch.detectedLevel}
                                </Tag>
                              )}
                              {typeof levelMatch.match === "boolean" && (
                                <Tag color={levelMatch.match ? "green" : "red"}>
                                  {levelMatch.match
                                    ? "Phù hợp level"
                                    : "Chưa phù hợp level"}
                                </Tag>
                              )}
                            </Space>
                            <Paragraph style={{ marginBottom: 0 }}>
                              {levelSummary}
                            </Paragraph>
                          </Space>
                        </div>
                      )}

                      {/* Pedagogical Quality */}
                      {pedagogy && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Chất lượng sư phạm
                          </div>
                          <Space
                            direction="vertical"
                            size={4}
                            className={styles.aiSubBlock}
                          >
                            {pedagogyScore10 !== null && (
                              <Progress
                                percent={(pedagogyScore10 / 10) * 100}
                                size="small"
                                format={() => `${pedagogyScore10}/10`}
                              />
                            )}
                            {pedagogy.summary && (
                              <Paragraph style={{ marginTop: 4 }}>
                                {pedagogy.summary}
                              </Paragraph>
                            )}

                            {Array.isArray(pedagogy.strengths) &&
                              pedagogy.strengths.length > 0 && (
                                <>
                                  <div className={styles.aiSubTitle}>
                                    Điểm mạnh về sư phạm
                                  </div>
                                  <ul className={styles.aiList}>
                                    {pedagogy.strengths.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </>
                              )}

                            {Array.isArray(pedagogy.weaknesses) &&
                              pedagogy.weaknesses.length > 0 && (
                                <>
                                  <div className={styles.aiSubTitle}>
                                    Hạn chế về sư phạm
                                  </div>
                                  <ul className={styles.aiList}>
                                    {pedagogy.weaknesses.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </>
                              )}

                            {Array.isArray(pedagogy.recommendations) &&
                              pedagogy.recommendations.length > 0 && (
                                <>
                                  <div className={styles.aiSubTitle}>
                                    Gợi ý cải thiện teaching
                                  </div>
                                  <ul className={styles.aiList}>
                                    {pedagogy.recommendations.map(
                                      (item, idx) => (
                                        <li key={idx}>{item}</li>
                                      )
                                    )}
                                  </ul>
                                </>
                              )}
                          </Space>
                        </div>
                      )}

                      {/* Language Accuracy */}
                      {langAcc && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Độ chính xác ngôn ngữ
                          </div>
                          {langScore10 !== null && (
                            <Progress
                              percent={(langScore10 / 10) * 100}
                              size="small"
                              format={() => `${langScore10}/10`}
                            />
                          )}

                          {langAcc.summary && (
                            <Paragraph style={{ marginTop: 4 }}>
                              {langAcc.summary}
                            </Paragraph>
                          )}

                          {/* Vietnamese errors */}
                          {Array.isArray(langAcc.vietnameseErrors) &&
                            langAcc.vietnameseErrors.length > 0 && (
                              <div className={styles.aiSubBlock}>
                                <div className={styles.aiSubTitle}>
                                  Lỗi tiếng Việt
                                </div>
                                <ul className={styles.aiErrorList}>
                                  {langAcc.vietnameseErrors.map(
                                    (errItem, idx) => (
                                      <li
                                        key={idx}
                                        className={styles.aiErrorItem}
                                      >
                                        {errItem.location && (
                                          <Text
                                            type="secondary"
                                            className={styles.aiErrorLocation}
                                          >
                                            Vị trí: {errItem.location}
                                          </Text>
                                        )}
                                        {errItem.text && (
                                          <Paragraph
                                            ellipsis={{ rows: 2 }}
                                            className={
                                              styles.aiErrorTextSnippet
                                            }
                                          >
                                            “{errItem.text}”
                                          </Paragraph>
                                        )}
                                        {errItem.error && (
                                          <Paragraph className={styles.aiError}>
                                            <b>Lỗi:</b> {errItem.error}
                                          </Paragraph>
                                        )}
                                        {errItem.suggestion && (
                                          <Paragraph
                                            className={styles.aiSuggestion}
                                          >
                                            <b>Gợi ý:</b> {errItem.suggestion}
                                          </Paragraph>
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Japanese errors nếu có trong tương lai */}
                          {Array.isArray(langAcc.japaneseErrors) &&
                            langAcc.japaneseErrors.length > 0 && (
                              <div className={styles.aiSubBlock}>
                                <div className={styles.aiSubTitle}>
                                  Lỗi tiếng Nhật
                                </div>
                                <ul className={styles.aiList}>
                                  {langAcc.japaneseErrors.map(
                                    (errItem, idx) => (
                                      <li key={idx}>
                                        {errItem.error ||
                                          JSON.stringify(errItem)}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Grammar progression */}
                      {grammarProg && (
                        <div className={styles.aiSection}>
                          <div className={styles.aiSectionTitle}>
                            Tiến trình ngữ pháp
                          </div>
                          <Space
                            direction="vertical"
                            size={4}
                            className={styles.aiSubBlock}
                          >
                            <Space>
                              <Tag
                                color={grammarProg.isLogical ? "green" : "red"}
                              >
                                {grammarProg.isLogical
                                  ? "Trình tự hợp lý"
                                  : "Trình tự chưa hợp lý"}
                              </Tag>
                              {grammarScore10 !== null && (
                                <Text type="secondary">
                                  Grammar score: {grammarScore10}/10
                                </Text>
                              )}
                            </Space>

                            {grammarProg.summary && (
                              <Paragraph style={{ marginTop: 4 }}>
                                {grammarProg.summary}
                              </Paragraph>
                            )}

                            {Array.isArray(grammarProg.issues) &&
                              grammarProg.issues.length > 0 && (
                                <>
                                  <div className={styles.aiSubTitle}>
                                    Vấn đề trong tiến trình ngữ pháp
                                  </div>
                                  <ul className={styles.aiIssueList}>
                                    {grammarProg.issues.map((issue, idx) => (
                                      <li
                                        key={idx}
                                        className={styles.aiIssueItem}
                                      >
                                        <div className={styles.aiIssueHeader}>
                                          <div
                                            className={
                                              styles.aiIssueHeaderTitle
                                            }
                                          >
                                            <Text strong>
                                              {issue.grammar || "Grammar point"}
                                            </Text>
                                          </div>
                                          {issue.severity && (
                                            <Tag
                                              color={
                                                issue.severity === "HIGH"
                                                  ? "red"
                                                  : issue.severity === "MEDIUM"
                                                  ? "gold"
                                                  : "default"
                                              }
                                            >
                                              {issue.severity}
                                            </Tag>
                                          )}
                                        </div>

                                        <div className={styles.aiIssueMeta}>
                                          {issue.currentLocation && (
                                            <Text type="secondary">
                                              Vị trí hiện tại:{" "}
                                              {issue.currentLocation}
                                            </Text>
                                          )}
                                          {issue.requiredPrerequisite && (
                                            <Text
                                              type="secondary"
                                              style={{
                                                display: "block",
                                              }}
                                            >
                                              Cần học trước:{" "}
                                              {issue.requiredPrerequisite}{" "}
                                              {issue.prerequisiteLocation &&
                                                `(${issue.prerequisiteLocation})`}
                                            </Text>
                                          )}
                                        </div>
                                        {issue.description && (
                                          <Paragraph
                                            className={
                                              styles.aiIssueDescription
                                            }
                                          >
                                            {issue.description}
                                          </Paragraph>
                                        )}
                                        {issue.potentialConfusion && (
                                          <Paragraph
                                            className={styles.aiIssueConfusion}
                                          >
                                            <b>Nguy cơ gây nhầm lẫn:</b>{" "}
                                            {issue.potentialConfusion}
                                          </Paragraph>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                            {Array.isArray(grammarProg.recommendations) &&
                              grammarProg.recommendations.length > 0 && (
                                <>
                                  <div className={styles.aiSubTitle}>
                                    Gợi ý cải thiện tiến trình
                                  </div>
                                  <ul className={styles.aiList}>
                                    {grammarProg.recommendations.map(
                                      (item, idx) => (
                                        <li key={idx}>{item}</li>
                                      )
                                    )}
                                  </ul>
                                </>
                              )}
                          </Space>
                        </div>
                      )}

                      {/* Global Recommendations */}
                      {Array.isArray(aiReview.recommendations) &&
                        aiReview.recommendations.length > 0 && (
                          <div className={styles.aiSection}>
                            <div className={styles.aiSectionTitle}>
                              Gợi ý tổng quan từ AI
                            </div>
                            <ul className={styles.aiList}>
                              {aiReview.recommendations.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Global Warnings */}
                      {Array.isArray(aiReview.warnings) &&
                        aiReview.warnings.length > 0 && (
                          <div className={styles.aiSection}>
                            <div className={styles.aiSectionTitle}>
                              Cảnh báo
                            </div>
                            <ul className={styles.aiList}>
                              {aiReview.warnings.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
