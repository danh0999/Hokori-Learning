// src/pages/CourseDetail/components/CourseHero.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal, Input } from "antd";
import { toast } from "react-toastify";

import { addToCart } from "../../../redux/features/cartSlice";
import { buildFileUrl } from "../../../utils/fileUrl";
import api from "../../../configs/axios";

const formatMoney = (value) => (Number(value) || 0).toLocaleString("vi-VN");

const slugify = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const CourseHero = ({ course }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy cart items từ Redux
  const cartItems = useSelector((state) => state.cart?.items || []);

  // ====== MAP FIELD TỪ COURSE ======
  const {
    id,
    title,
    subtitle,
    description,
    level,
    priceCents,
    currency,
    isEnrolled,
    canFlag,
    status, // BE trả về để biết có được flag hay không
    rating: ratingFromApi,
    studentCount,
    tags: tagsFromApi,
    teacherName: teacherNameFromApi,
    coverImagePath,
    videoUrl,
  } = course;

  /* ================= STATE FLAG COURSE ================ */
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [alreadyFlagged, setAlreadyFlagged] = useState(false);
  const [flagType, setFlagType] = useState("INAPPROPRIATE_CONTENT");
  const isCourseFlagged = status === "FLAGGED";
  const canShowFlagButton = !!canFlag && !alreadyFlagged && !isCourseFlagged;

  /* ================= RATING SUMMARY TỪ FEEDBACK API ================ */
  const [ratingSummary, setRatingSummary] = useState({
    ratingAvg: Number(ratingFromApi) || 0,
    ratingCount: Number(studentCount) || 0,
  });

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    const fetchRatingSummary = async () => {
      try {
        const res = await api.get(`/courses/${id}/feedbacks/summary`);
        const data = res?.data || {};
        if (!ignore) {
          setRatingSummary({
            ratingAvg: Number(data.ratingAvg) || 0,
            ratingCount: Number(data.ratingCount) || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch rating summary", err);
        // lỗi thì cứ dùng default từ course
      }
    };

    fetchRatingSummary();

    return () => {
      ignore = true;
    };
  }, [id]);

  // Nếu chưa có course thì return sớm tránh destructuring undefined
  if (!course) return <div>Loading...</div>;

  const rating = ratingSummary.ratingAvg || 0;
  const students = ratingSummary.ratingCount || 0;

  // ====== GIÁ KHÔNG DÙNG DISCOUNT ======
  const currentPrice = Number(priceCents ?? 0); // PayOS: giữ nguyên VND, KHÔNG chia 100
  const isFree = currentPrice === 0;
  const enrolled = !!isEnrolled;

  const tags = Array.isArray(tagsFromApi) ? tagsFromApi : [];
  const teacherName = teacherNameFromApi || "Giảng viên Hokori";

  // Object để gửi cho cart API / Redux
  const courseForCart = {
    courseId: id, // BE dùng courseId
    id, // phòng khi cartSlice cũ dùng id
    title,
    courseTitle: title,
    shortDesc: subtitle || description || "",
    price: currentPrice,
    priceCents: currentPrice,
    quantity: 1,
    teacherName: teacherName,
    level,
    coverImagePath,
  };

  // --- LẤY TOKEN ĐỂ CHECK GUEST ---
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const isGuest = !token;

  // Check course đã có trong giỏ hàng chưa (cartSlice map với API: item.courseId)
  const isInCart = cartItems.some((item) => item.courseId === id);

  /* ================= HANDLERS ================ */

  // 1. “Vào học ngay” khi đã sở hữu → giống MyCourses
  const handleGoToLearning = () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để vào học.");
      navigate("/login");
      return;
    }

    const slug = slugify(title || "");
    // bỏ trial => mặc định nhảy vào chapter orderIndex = 1
    navigate(`/learn/${id}/${slug}/home/chapter/1`);
  };

  // 2. Đăng ký khóa **miễn phí**
  const handleEnrollFree = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học.");
      navigate("/login");
      return;
    }

    try {
      await api.post(`/learner/courses/${id}/enroll`);
      toast.success(
        "Đăng ký thành công! Khóa học đã được thêm vào danh sách Khóa học của tôi."
      );

      navigate("/my-courses");
    } catch (err) {
      console.error(err);
      toast.error("Không thể đăng ký khóa học. Vui lòng thử lại.");
    }
  };

  // 3. Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để thêm khóa học vào giỏ.");
      navigate("/login");
      return;
    }

    // Nếu đã có trong giỏ rồi thì không gọi API nữa
    if (isInCart) {
      toast.info("Khóa học đã có trong giỏ hàng.", { autoClose: 1500 });
      return;
    }

    try {
      await dispatch(addToCart(courseForCart)).unwrap();
      // Redux sẽ cập nhật cart.items → isInCart = true → nút tự disable
    } catch (err) {
      console.error(err);
      message.error("Không thể thêm khóa học vào giỏ hàng.");
    }
  };

  // 4. Mua ngay
  const handleBuyNow = async () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để mua khóa học.");
      navigate("/login");
      return;
    }

    // Nếu đã có trong giỏ → chỉ chuyển sang trang giỏ hàng
    if (isInCart) {
      navigate("/cart");
      return;
    }

    try {
      await dispatch(addToCart(courseForCart)).unwrap();
      navigate("/cart");
    } catch (err) {
      console.error(err);
      message.error("Không thể thêm khóa học vào giỏ hàng.");
    }
  };

  // 5. FLAG COURSE (REPORT)
  const openFlagModal = () => {
    if (isGuest) {
      toast.error("Vui lòng đăng nhập để báo cáo khóa học.");
      navigate("/login");
      return;
    }
    setFlagReason("");
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
      await api.post(`/courses/${id}/flag`, {
        flagType,
        reason,
      });

      toast.success(
        "Đã gửi báo cáo đến bộ phận kiểm duyệt. Cảm ơn bạn đã đóng góp!"
      );
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

  /* ============== TÍNH NÚT HIỂN THỊ ============== */

  let primaryLabel = "";
  let primaryAction = () => {};
  let showSecondaryCartBtn = false;

  if (enrolled) {
    primaryLabel = "Vào học ngay";
    primaryAction = handleGoToLearning;
    showSecondaryCartBtn = false;
  } else if (isFree) {
    primaryLabel = "Đăng ký học miễn phí";
    primaryAction = handleEnrollFree;
    showSecondaryCartBtn = false;
  } else {
    primaryLabel = "Mua khóa học ngay";
    primaryAction = handleBuyNow;
    showSecondaryCartBtn = true;
  }

  return (
    <section className="hero-section">
      <div className="container">
        {/* Video / Cover */}
        <div className="video-preview">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : coverImagePath ? (
            <img
              src={buildFileUrl(coverImagePath)}
              alt={title}
              className="cover-image"
            />
          ) : (
            <div className="overlay">
              <i className="fa-solid fa-play play-icon"></i>
              <p>Preview video</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="info">
          <div className="tags">
            {level && <span>{level}</span>}
            {tags.map((tag, idx) => (
              <span key={idx}>{tag}</span>
            ))}
            {enrolled && <span className="tag-owned">Đã sở hữu</span>}
          </div>

          <h1>{title}</h1>
          <p className="desc">
            {subtitle || description || "Mô tả khóa học đang cập nhật."}
          </p>

          <div className="rating">
            <div className="stars">
              {Array(5)
                .fill(0)
                .map((_, i) => {
                  const starValue = i + 1;

                  if (students === 0) {
                    // Chưa có đánh giá → show sao rỗng
                    return <i key={i} className="fa-regular fa-star"></i>;
                  }

                  return starValue <= Math.round(rating) ? (
                    <i key={i} className="fa-solid fa-star"></i> // sao vàng
                  ) : (
                    <i key={i} className="fa-regular fa-star"></i>
                  ); // sao rỗng
                })}
            </div>

            {students === 0 ? (
              <span>Chưa có đánh giá</span>
            ) : (
              <span>
                {rating.toFixed(1)} ({students.toLocaleString("vi-VN")} lượt
                đánh giá)
              </span>
            )}
          </div>

          <div className="teacher">
            <div>
              <p>{teacherName}</p>
              <span>Giảng viên</span>
            </div>
          </div>

          {/* PRICE */}
          {!isFree && (
            <div className="price">
              <span className="current">
                {formatMoney(currentPrice)} {currency || "VND"}
              </span>
            </div>
          )}
          {isFree && (
            <div className="price price--free">
              <span className="current">Miễn phí</span>
            </div>
          )}

          {/* BUTTONS */}
          <div className="buttons">
            <button className="btn-primary" onClick={primaryAction}>
              {primaryLabel}
            </button>

            {showSecondaryCartBtn && (
              <button
                className="btn-secondary"
                onClick={handleAddToCart}
                disabled={isInCart}
              >
                <i className="fa-solid fa-cart-shopping"></i>{" "}
                {isInCart ? "Đã có trong giỏ" : "Thêm vào giỏ hàng"}
              </button>
            )}
            {isCourseFlagged && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fff7e6",
                  border: "1px solid #ffd591",
                  color: "#ad6800",
                  fontSize: 14,
                }}
              >
                <b>Khóa học đang được rà soát và cập nhật nội dung</b>.
                <br />
                Cảm ơn bạn đã thông cảm trong thời gian này.
              </div>
            )}
            {alreadyFlagged && !isCourseFlagged && (
              <div className="info-note">
                ✔️ Bạn đã gửi báo cáo cho khóa học này.
              </div>
            )}

            {canShowFlagButton && (
              <button
                className="btn-flag"
                type="button"
                onClick={openFlagModal}
              >
                <i className="fa-regular fa-flag"></i> Báo cáo khóa học
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL FLAG COURSE */}
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
    </section>
  );
};

export default CourseHero;
