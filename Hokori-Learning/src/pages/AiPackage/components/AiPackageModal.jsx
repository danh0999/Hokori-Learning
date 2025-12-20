import React, { useEffect } from "react";
import styles from "./AiPackageModal.module.scss";
import { Button } from "../../../components/Button/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  purchaseAiPackage,
  closeModal,
  fetchMyAiPackage,
  fetchAiPackages,
} from "../../../redux/features/aiPackageSlice";
import { toast } from "react-toastify";

export default function AiPackageModal() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const {
    showModal,
    packages,
    packagesStatus,
    myPackage,
    checkoutStatus,
  } = useSelector((state) => state.aiPackage);

  const loadingCheckout = checkoutStatus === "loading";

  const hasPackage = myPackage && myPackage.hasPackage;
  const hasActivePackage = hasPackage && !myPackage.isExpired;

  useEffect(() => {
    if (showModal && user) {
      dispatch(fetchMyAiPackage());
      dispatch(fetchAiPackages());
    }
  }, [showModal, user, dispatch]);

  if (!showModal) return null;

  /* ================= NOT LOGIN ================= */
  if (!user) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h2>Bạn cần đăng nhập</h2>
          <p>Đăng nhập để xem và mua gói AI.</p>

          <div className={styles.actions}>
            <button
              className={styles.primary}
              onClick={() =>
                (window.location.href = "/login")
              }
            >
              Đăng nhập
            </button>

            <button
              className={styles.ghost}
              onClick={() => dispatch(closeModal())}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= HELPERS ================= */
  const formatPrice = (v) =>
    v ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";

  const handleCheckout = async (pkgId) => {
    if (hasActivePackage) {
      toast.info(
        `Bạn đang sử dụng gói ${myPackage.packageName}. Vui lòng đợi hết hạn.`
      );
      return;
    }

    try {
      const checkout = await dispatch(purchaseAiPackage(pkgId)).unwrap();

      if (checkout?.paymentLink) {
        window.location.href = checkout.paymentLink;
      } else {
        toast.success("Kích hoạt gói AI thành công!");
        dispatch(fetchMyAiPackage());
        dispatch(closeModal());
      }
    } catch {
      toast.error("Không thể tạo đơn thanh toán.");
    }
  };

  /* ================= RENDER PACKAGE CARD ================= */
  const renderPackageCard = (pkg, highlight = false) => (
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
          <strong>{pkg.totalRequests}</strong> lượt AI (dùng chung)
        </li>
        <li>Sử dụng cho tất cả tính năng AI</li>
      </ul>

      <div className={styles.price}>{formatPrice(pkg.priceCents)} đ</div>

      <Button
        content={`Mua ${pkg.name}`}
        onClick={() => handleCheckout(pkg.id)}
        disabled={loadingCheckout}
      />
    </div>
  );

  /* ================= MAIN MODAL ================= */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Gói AI Hokori</h2>

        {hasActivePackage && (
          <div className={styles.activeNotice}>
            <p>
              Bạn đang sử dụng gói{" "}
              <strong>{myPackage.packageName}</strong>.
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
              <p className={styles.error}>
                Không thể tải danh sách gói AI.
              </p>
            )}

            {packagesStatus === "succeeded" &&
              packages?.map((pkg, idx) =>
                renderPackageCard(pkg, idx === 1)
              )}
          </div>
        )}

        <button
          className={styles.close}
          onClick={() => dispatch(closeModal())}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
