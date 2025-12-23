import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../configs/axios";
import styles from "./CourseCompletionPage.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

export default function CourseCompletionPage() {
  const { courseId, slug } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.user || state.auth?.user);
  const currentUserId = currentUser?.id || currentUser?.userId || null;

  const [loading, setLoading] = useState(true);

  // certificate
  const [certificate, setCertificate] = useState(null);
  const [certError, setCertError] = useState("");

  // feedback list + my feedback
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  const myFeedback = useMemo(() => {
    if (!currentUserId) return null;
    return (
      (feedbacks || []).find(
        (f) => Number(f.userId) === Number(currentUserId)
      ) || null
    );
  }, [feedbacks, currentUserId]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setCertError("");
        setSaveMsg("");

        const cid = Number(courseId);

        const [certRes, fbRes, sumRes] = await Promise.allSettled([
          api.get(`/learner/certificates/course/${cid}`),
          api.get(`/courses/${cid}/feedbacks`),
          api.get(`/courses/${cid}/feedbacks/summary`),
        ]);

        // certificate
        if (certRes.status === "fulfilled") {
          const cert = certRes.value.data?.data ?? certRes.value.data;
          setCertificate(cert || null);
        } else {
          // nếu chưa có cert (404) thì chỉ show warning nhẹ
          if (certRes.reason?.response?.status === 404) {
            setCertificate(null);
            setCertError(
              "Chưa có chứng chỉ cho khóa học này (có thể do chưa đạt điều kiện phát hành)."
            );
          } else {
            setCertificate(null);
            setCertError("Không thể tải chứng chỉ. Vui lòng thử lại.");
          }
        }

        // feedbacks
        if (fbRes.status === "fulfilled") {
          const list = fbRes.value.data?.data ?? fbRes.value.data;
          setFeedbacks(Array.isArray(list) ? list : []);
        } else {
          setFeedbacks([]);
        }

        // summary
        if (sumRes.status === "fulfilled") {
          const sum = sumRes.value.data?.data ?? sumRes.value.data;
          setFeedbackSummary(sum || null);
        } else {
          setFeedbackSummary(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [courseId]);

  // fill form nếu đã feedback trước đó
  useEffect(() => {
    if (!myFeedback) return;
    setRating(Number(myFeedback.rating || 5));
    setComment(String(myFeedback.comment || ""));
  }, [myFeedback]);

  const handleSubmitFeedback = async () => {
    try {
      setSaving(true);
      setSaveMsg("");

      const cid = Number(courseId);
      const payload = {
        rating: Number(rating),
        comment: String(comment || "").trim(),
      };

      // ✅ API này BE note: nếu đã feedback thì update
      await api.post(`/courses/${cid}/feedbacks`, payload);

      setSaveMsg("Đã gửi đánh giá thành công.");

      // refetch feedbacks + summary
      const [fbRes, sumRes] = await Promise.all([
        api.get(`/courses/${cid}/feedbacks`),
        api.get(`/courses/${cid}/feedbacks/summary`),
      ]);

      const list = fbRes.data?.data ?? fbRes.data;
      setFeedbacks(Array.isArray(list) ? list : []);

      const sum = sumRes.data?.data ?? sumRes.data;
      setFeedbackSummary(sum || null);
    } catch (err) {
      console.error(err);
      setSaveMsg("Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewCertificate = () => {
    if (!certificate?.id) return;
    navigate(`/certificates/${certificate.id}`);
  };

  const handleBackToMyCourses = () => navigate("/my-courses");
  const handleBackToCourseHome = () =>
    navigate(`/learn/${courseId}/${slug}/home/chapter/1`);

  const coverUrl = certificate?.coverImagePath
    ? buildFileUrl(certificate.coverImagePath)
    : "";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🎉 Hoàn thành khóa học</h1>
            <p className={styles.subtitle}>
              Bạn có thể để lại đánh giá và xem chứng chỉ của mình tại đây.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.secondaryBtn}
              onClick={handleBackToCourseHome}
              type="button"
            >
              Về trang khóa học
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={handleBackToMyCourses}
              type="button"
            >
              Khóa học của tôi
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : (
          <div className={styles.grid}>
            {/* LEFT: Certificate */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Chứng chỉ</h2>

              {certificate?.id ? (
                <div className={styles.certificateBox}>
                  <div
                    className={styles.certificatePreview}
                    style={
                      coverUrl
                        ? { backgroundImage: `url(${coverUrl})` }
                        : undefined
                    }
                  >
                    <div className={styles.certificateOverlay}>
                      <div className={styles.certificateCourseTitle}>
                        {certificate.courseTitle || "Course"}
                      </div>
                      <div className={styles.certificateMeta}>
                        <span>Mã: {certificate.certificateNumber}</span>
                        {certificate.issuedAt && (
                          <span>
                            Ngày cấp:{" "}
                            {new Date(certificate.issuedAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className={styles.primaryBtn}
                    onClick={handleViewCertificate}
                    type="button"
                  >
                    Xem chứng chỉ
                  </button>
                </div>
              ) : (
                <div className={styles.emptyBox}>
                  <p>{certError || "Chưa có chứng chỉ."}</p>
                </div>
              )}
            </section>

            {/* RIGHT: Feedback */}
            <section className={styles.card}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>Đánh giá khóa học</h2>

                <div className={styles.summary}>
                  <span>
                    Trung bình:{" "}
                    <strong>{feedbackSummary?.ratingAvg ?? 0}</strong>
                  </span>
                  <span>
                    Lượt đánh giá:{" "}
                    <strong>{feedbackSummary?.ratingCount ?? 0}</strong>
                  </span>
                </div>
              </div>

              {myFeedback && (
                <div className={styles.infoBanner}>
                  Bạn đã đánh giá trước đó — gửi lại sẽ cập nhật đánh giá.
                </div>
              )}

              <div className={styles.formRow}>
                <label className={styles.label}>Rating</label>
                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);

                    return (
                      <span
                        key={star}
                        className={`${styles.star} ${
                          active ? styles.active : ""
                        }`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>Comment</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bạn thấy khóa học thế nào?"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.primaryBtn}
                  onClick={handleSubmitFeedback}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "Đang gửi..." : "Gửi đánh giá"}
                </button>

                {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
