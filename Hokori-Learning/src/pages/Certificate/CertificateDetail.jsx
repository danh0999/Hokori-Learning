import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../configs/axios";
import styles from "./CertificateDetail.module.scss";
import { buildFileUrl } from "../../utils/fileUrl";

const CertificateDetail = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  // Lấy thông tin user từ Redux (nếu có)
  const currentUser = useSelector((state) => state.auth?.user);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError("");

        // GET /api/learner/certificates/{certificateId}
        const res = await api.get(`/learner/certificates/${certificateId}`);
        const data = res.data?.data ?? res.data; // theo spec trong file .md

        setCertificate(data);
      } catch (err) {
        console.error("Không thể tải certificate:", err);
        setError("Không tìm thấy chứng chỉ hoặc bạn không có quyền truy cập.");
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  // ====== STATES UI ======
  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Đang tải chứng chỉ...</div>
      </main>
    );
  }

  if (error || !certificate) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <p>{error || "Không thể tải chứng chỉ."}</p>
          <button type="button" onClick={() => navigate("/my-courses")}>
            ← Quay lại Khóa học của tôi
          </button>
        </div>
      </main>
    );
  }

  // ====== DATA HIỂN THỊ ======
  // Prefer API-provided fields; fall back to user info if missing
  const learnerName =
    certificate.learnerName ||
    currentUser?.displayName ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Hokori Learner";

  const courseTitle = certificate.courseTitle || "Completed Course";

  const completedDate = certificate.completedAt
    ? new Date(certificate.completedAt).toLocaleDateString()
    : "";

  const bgStyle = certificate.coverImagePath
    ? {
        backgroundImage: `url(${buildFileUrl(certificate.coverImagePath)})`,
      }
    : {};

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
      </div>
      <section className={styles.certificate} style={bgStyle}>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Certificate of Completion</h1>

          <p className={styles.subtitle}>This certifies that</p>
          <p className={styles.learnerName}>{learnerName}</p>

          <p className={styles.subtitle}>has successfully completed</p>
          <p className={styles.courseTitle}>{courseTitle}</p>

          {completedDate && (
            <span className={styles.date}>Completed on {completedDate}</span>
          )}

          <div className={styles.footer}>
            Certificate ID: <strong>{certificate.certificateNumber}</strong>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CertificateDetail;
