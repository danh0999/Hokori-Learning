import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import styles from "./AiIntroductionPage.module.scss";
import ScrollToTopButton from "../../components/SrcollToTopButton/ScrollToTopButton";

import { GiBrain } from "react-icons/gi";
import { FaMicrophoneAlt } from "react-icons/fa";
import { IoChatbubbles } from "react-icons/io5";

//  Redux action mở modal gói AI
import {
  openModal,
  fetchMyAiPackage,
} from "../../redux/features/aiPackageSlice";

export default function AiIntroductionPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* =========================
     REDUX STATE
  ========================= */
  const user = useSelector((state) => state.user);
  const myPackage = useSelector((state) => state.aiPackage.myPackage);

  /* =========================
     MEMO
  ========================= */
  const youtubeSrc = useMemo(
    () => "https://www.youtube.com/embed/CIQE4QhPsG8?si=jvgTLeGqWiykBHpo",
    []
  );

  /* =========================
     HANDLERS
  ========================= */

  //  Mua gói AI (chuẩn flow hiện tại)
  const handleBuyNow = async () => {
    // 1️ Chưa đăng nhập → login
    if (!user) {
      navigate("/login");
      return;
    }

    // 2️ Nếu chưa load thông tin gói → fetch trước
    if (!myPackage) {
      await dispatch(fetchMyAiPackage());
    }

    // 3️ Mở modal (state lúc này đã đúng)
    dispatch(openModal());
  };

  // Chuyển sang dùng công cụ (nếu cần)
  const handleGoTools = () => {
    navigate("/ai-kaiwa");
  };

  return (
    <div className={styles.page}>
      {/* =========================
          HERO
      ========================= */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          HOKORI AI • Japanese Learning Assistant
        </div>

        <h1 className={styles.heroTitle}>
          AI Hokori — Hệ thống hỗ trợ học tiếng Nhật bằng trí tuệ nhân tạo
        </h1>

        <p className={styles.heroDesc}>
          Học tiếng Nhật không chỉ là nhớ từ vựng hay ngữ pháp. Người học cần{" "}
          <b>phản hồi chính xác</b>, <b>kịp thời</b> và <b>cá nhân hoá</b> —
          điều mà lớp học truyền thống hoặc các công cụ rời rạc rất khó đáp ứng.
          <br />
          <br />
          AI Hokori được thiết kế để giúp bạn cải thiện <b>phát âm</b>,{" "}
          <b>cấu trúc câu</b> và <b>khả năng hội thoại</b> một cách rõ ràng, có
          định hướng và phù hợp theo trình độ JLPT.
        </p>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleBuyNow}
          >
            Mua gói AI ngay
          </button>

          <a className={styles.secondaryBtn} href="#video">
            Xem minh hoạ
          </a>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>N5 → N1</div>
            <div className={styles.statLabel}>Theo trình độ JLPT</div>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statItem}>
            <div className={styles.statNumber}>3 nhóm năng lực</div>
            <div className={styles.statLabel}>Nói • Phân tích • Hội thoại</div>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statItem}>
            <div className={styles.statNumber}>Tập trung “phản hồi”</div>
            <div className={styles.statLabel}>Không chỉ đáp án đúng</div>
          </div>
        </div>
      </section>

      {/* =========================
          VIDEO
      ========================= */}
      <section id="video" className={styles.videoSection}>
        <div className={styles.sectionHead}>
          <h2>Minh hoạ AI Hokori hoạt động trong thực tế</h2>
          <p>
            Video bên dưới mô tả cách AI Hokori hỗ trợ người học: từ luyện nói,
            phân tích lỗi cho đến gợi ý cải thiện.
          </p>
        </div>

        <div className={styles.videoCard}>
          <div className={styles.videoWrapper}>
            <iframe
              src={youtubeSrc}
              title="AI Hokori Tutorial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* =========================
          VALUE
      ========================= */}
      <section className={styles.valueSection}>
        <div className={styles.sectionHead}>
          <h2>AI Hokori hỗ trợ bạn học tiếng Nhật như thế nào?</h2>
          <p>
            Thay vì đưa ra câu trả lời “đúng/sai” một cách khô khan, Hokori tập
            trung vào việc <b>giúp bạn hiểu lỗi</b> và{" "}
            <b>cải thiện từng bước</b>.
          </p>
        </div>

        <div className={styles.valueList}>
          <div className={styles.valueItem}>
            <div className={styles.valueIcon}>
              <FaMicrophoneAlt />
            </div>
            <div className={styles.valueContent}>
              <h3>Luyện nói & phát âm có phản hồi</h3>
              <p>
                AI đánh giá độ chính xác phát âm, ngữ điệu và mức độ tự nhiên
                trong từng câu nói. Bạn biết rõ mình sai ở đâu và luyện lại theo
                hướng dẫn.
              </p>
            </div>
          </div>

          <div className={styles.valueItem}>
            <div className={styles.valueIcon}>
              <GiBrain />
            </div>
            <div className={styles.valueContent}>
              <h3>Phân tích câu tiếng Nhật theo cấu trúc</h3>
              <p>
                Hệ thống nhận diện ngữ pháp, từ vựng và mức độ JLPT của câu bạn
                nhập. Giúp bạn hiểu bản chất thay vì chỉ nhớ đáp án.
              </p>
            </div>
          </div>

          <div className={styles.valueItem}>
            <div className={styles.valueIcon}>
              <IoChatbubbles />
            </div>
            <div className={styles.valueContent}>
              <h3>Hội thoại AI theo ngữ cảnh</h3>
              <p>
                Thực hành giao tiếp theo tình huống đời sống và công việc. AI
                phản hồi ngay và gợi ý cách diễn đạt tự nhiên hơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          WHY BUY
      ========================= */}
      <section className={styles.whySection}>
        <div className={styles.sectionHead}>
          <h2>Vì sao người học chọn mua AI Hokori?</h2>
          <p>
            Người tự học thường gặp 3 vấn đề: <b>không biết mình sai ở đâu</b>,{" "}
            <b>không có phản hồi kịp thời</b> và <b>khó duy trì luyện tập</b>.
            AI Hokori được xây dựng để giải quyết trực tiếp những điểm đó.
          </p>
        </div>

        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyTitle}>Phản hồi rõ ràng</div>
            <div className={styles.whyDesc}>
              Không chỉ “đúng/sai”, AI chỉ ra lỗi cụ thể và hướng cải thiện.
            </div>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyTitle}>Cá nhân hoá theo JLPT</div>
            <div className={styles.whyDesc}>
              Mức độ phản hồi phù hợp từ N5 đến N1, tránh quá dễ hoặc quá khó.
            </div>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyTitle}>Tăng hiệu quả luyện tập</div>
            <div className={styles.whyDesc}>
              Luyện nói – phân tích – hội thoại trong một hệ thống thống nhất.
            </div>
          </div>
        </div>
      </section>

      <ScrollToTopButton />
    </div>
  );
}
