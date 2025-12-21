import React, { useEffect } from "react";
import styles from "./AiPackageModal.module.scss";
import { Button } from "../../../components/Button/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  purchaseAiPackage,
  closeModal,
  fetchMyAiPackage,
  fetchAiPackages,
  fetchAiQuota,
  resetCheckout,
  setNeedsSync,
} from "../../../redux/features/aiPackageSlice";
import { toast } from "react-toastify";

/* ================= AUTH HELPER ================= */
const isLoggedInUser = (user) => {
  if (!user) return false;
  return Boolean(
    user?.accessToken ||
      user?.token ||
      user?.jwt ||
      user?.user?.id ||
      user?.data?.id ||
      user?.profile?.id
  );
};

export default function AiPackageModal() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const isLoggedIn = isLoggedInUser(user);

  const { showModal, packages, packagesStatus, myPackage, checkoutStatus } =
    useSelector((state) => state.aiPackage);

  const loadingCheckout = checkoutStatus === "loading";

  const hasPackage = myPackage && myPackage.hasPackage;
  const hasActivePackage = hasPackage && !myPackage.isExpired;

  useEffect(() => {
    if (!showModal) return;

    // Public list luôn fetch (modal mở ra phải thấy gói)
    dispatch(fetchAiPackages());

    // MyPackage/quota chỉ fetch khi login
    if (isLoggedIn) {
      dispatch(fetchMyAiPackage());
      dispatch(fetchAiQuota());
    }
  }, [showModal, isLoggedIn, dispatch]);

  if (!showModal) return null;

  /* ================= NOT LOGIN ================= */
  if (!isLoggedIn) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "2.4rem 2.6rem 2.2rem",
            width: "520px",
            maxWidth: "92%",
            borderRadius: "26px",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
            animation: "fadeUp 0.32s ease",
          }}
        >
          <h2>Bạn cần đăng nhập</h2>

          <p
            style={{
              fontSize: "0.95rem",
              color: "#6b7280",
              lineHeight: 1.5,
              marginBottom: "1.8rem",
            }}
          >
            Đăng nhập để mua gói AI và sử dụng các tính năng AI.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            {/* LOGIN BUTTON */}
            <button
              onClick={() => (window.location.href = "/login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 30px rgba(37,99,235,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 24px rgba(37,99,235,0.3)";
              }}
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff",
                padding: "11px 26px",
                borderRadius: "14px",
                fontSize: "0.95rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(37,99,235,0.3)",
                transition: "all 0.22s ease",
              }}
            >
              Đăng nhập
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => dispatch(closeModal())}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "transparent";
              }}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                color: "#374151",
                padding: "11px 24px",
                borderRadius: "14px",
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= HELPERS ================= */
  const formatPrice = (v) => {
    if (v === null || v === undefined) return "0";
    const num = Number(v);
    if (Number.isNaN(num)) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const syncAfterSuccess = async () => {
    await Promise.all([
      dispatch(fetchMyAiPackage()).unwrap(),
      dispatch(fetchAiQuota()).unwrap(),
    ]);
    dispatch(setNeedsSync(false));
  };

  const handleCheckout = async (pkgId) => {
    if (hasActivePackage) {
      toast.info(
        `Bạn đang sử dụng gói ${myPackage.packageName}. Vui lòng đợi hết hạn.`
      );
      return;
    }

    try {
      dispatch(resetCheckout());

      const checkout = await dispatch(purchaseAiPackage(pkgId)).unwrap();
      dispatch(setNeedsSync(true));

      // PAID: redirect sang payment gateway
      if (checkout?.paymentLink) {
        window.location.href = checkout.paymentLink;
        return;
      }

      // FREE: kích hoạt ngay → sync store rồi đóng modal
      toast.success(checkout?.description || "Kích hoạt gói AI thành công!");
      await syncAfterSuccess();
      dispatch(closeModal());
    } catch (err) {
      const msg =
        (typeof err === "string" && err) ||
        err?.message ||
        err?.error ||
        "Không thể tạo đơn thanh toán.";
      toast.error(msg);
    }
  };

  /* ================= RENDER PACKAGE CARD ================= */
  const renderPackageCard = (pkg, highlight = false) => {
    // nếu BE trả isActive, chỉ hiển thị gói đang bán trong modal
    if (pkg?.isActive === false) return null;

    return (
      <div
        key={pkg.id}
        className={`${styles.card} ${highlight ? styles.pro : ""}`}
      >
        {highlight && <span className={styles.best}>BEST</span>}

        <h3>{pkg.name}</h3>
        <p className={styles.duration}>{pkg.durationDays} ngày</p>

        {pkg.description && (
          <p className={styles.description}>{pkg.description}</p>
        )}

        <ul className={styles.features}>
          <li>
            <strong>{pkg.totalRequests}</strong> lượt sử dụng AI cho phân tích,
            luyện nói và hội thoại
          </li>
        </ul>

        <div className={styles.price}>{formatPrice(pkg.priceCents)} đ</div>

        <Button
          content={`Mua ${pkg.name}`}
          onClick={() => handleCheckout(pkg.id)}
          disabled={loadingCheckout}
        />
      </div>
    );
  };

  /* ================= MAIN MODAL ================= */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Gói AI Hokori</h2>

        {hasActivePackage && (
          <div className={styles.activeNotice}>
            <p>
              Bạn đang sử dụng gói <strong>{myPackage.packageName}</strong>.
            </p>
            <p>Vui lòng đợi gói hết hạn để mua gói mới.</p>
          </div>
        )}

        {!hasActivePackage && (
          <div className={styles.packageList}>
            {packagesStatus === "loading" && (
              <p className={styles.loading}>Đang tải gói AI...</p>
            )}

            {packagesStatus === "failed" && (
              <p className={styles.error}>Không thể tải danh sách gói AI.</p>
            )}

            {packagesStatus === "succeeded" &&
              packages?.map((pkg, idx) => renderPackageCard(pkg, idx === 1))}
          </div>
        )}

        <button className={styles.close} onClick={() => dispatch(closeModal())}>
          Đóng
        </button>
      </div>
    </div>
  );
}
