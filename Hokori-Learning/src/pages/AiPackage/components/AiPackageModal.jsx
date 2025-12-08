// src/pages/AiPackage/components/AiPackageModal.jsx
import React, { useEffect } from "react";
import styles from "./AiPackageModal.module.scss";
import { Button } from "../../../components/Button/Button";
import { useDispatch, useSelector } from "react-redux";

import {
  purchaseAiPackage,
  closeModal,
  fetchMyAiPackage,
  fetchAiQuota,
  fetchAiPackages,
} from "../../../redux/features/aiPackageSlice";
import { toast } from "react-toastify";

export default function AiPackageModal() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const { showModal, packages, packagesStatus, myPackage, checkoutStatus } =
    useSelector((state) => state.aiPackage);

  const loadingCheckout = checkoutStatus === "loading";

  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  const activePackageId =
    hasActivePackage && (myPackage.packageId || myPackage.id || null);

  /* ============================================================
     Hooks phải gọi KHÔNG điều kiện → đúng quy tắc React
     Chỉ fetch khi showModal === true và user đã login
  ============================================================ */
  useEffect(() => {
    if (showModal && user) {
      dispatch(fetchMyAiPackage());
      dispatch(fetchAiQuota());
      dispatch(fetchAiPackages());
    }
  }, [showModal, user, dispatch]);

  /* ============================================================
     Nếu modal chưa mở → return luôn (CHUẨN)
  ============================================================ */
  if (!showModal) return null;

  /* ============================================================
     Nếu chưa đăng nhập → modal thông báo đăng nhập
  ============================================================ */
  if (!user) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loginRequiredWrapper}>
            <h2 className={styles.loginRequiredTitle}>
              Bạn cần đăng nhập để xem và mua gói AI
            </h2>

            <p className={styles.loginRequiredSub}>
              Đăng nhập để sử dụng đầy đủ các tính năng AI Hokori.
            </p>

            <div className={styles.loginRequiredActions}>
              <button
                className={styles.loginRequiredBtn}
                onClick={() =>
                  (window.location.href = "/login?redirect=/ai-packages")
                }
              >
                Đăng nhập ngay
              </button>

              <button
                className={styles.loginRequiredClose}
                onClick={() => dispatch(closeModal())}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     Checkout xử lý thanh toán
  ============================================================ */
  const handleCheckout = async (pkgId) => {
    if (hasActivePackage) {
      toast.info(
        `Bạn đang sử dụng gói ${myPackage.packageName}. Vui lòng đợi hết hạn để mua gói mới.`
      );
      return;
    }

    try {
      const checkout = await dispatch(purchaseAiPackage(pkgId)).unwrap();

      if (!checkout.paymentLink) {
        toast.success("Gói AI được kích hoạt thành công!");

        dispatch(fetchMyAiPackage());
        dispatch(fetchAiQuota());
        dispatch(closeModal());
      } else {
        window.location.href = checkout.paymentLink;
      }
    } catch {
      toast.error("Không thể tạo đơn thanh toán. Vui lòng thử lại.");
    }
  };

  /* ============================================================
     Render từng gói AI
  ============================================================ */
  const renderPackageCard = (pkg, highlight = false) => {
    const isActive = activePackageId === pkg.id;

    const cardClass = [
      styles.card,
      highlight ? styles.pro : "",
      isActive ? styles.activeCard : "",
      hasActivePackage && !isActive ? styles.disabledCard : "",
    ].join(" ");

    return (
      <div key={pkg.id} className={cardClass}>
        {highlight && <span className={styles.best}>BEST</span>}

        <h3>{pkg.name}</h3>
        <p>{pkg.durationDays} ngày sử dụng</p>

        <ul>
          <li>{pkg.grammarQuota} lượt kiểm tra chính tả</li>
          <li>{pkg.kaiwaQuota} lượt Kaiwa</li>
          <li>{pkg.pronunQuota} lượt phát âm</li>
        </ul>

        <div className={styles.price}>
          {(pkg.priceCents / 100).toLocaleString("vi-VN")}đ
        </div>

        {!hasActivePackage ? (
          <Button
            content={`Mua ${pkg.name}`}
            onClick={() => handleCheckout(pkg.id)}
            disabled={loadingCheckout}
          />
        ) : isActive ? (
          <Button content="Đang sử dụng" disabled />
        ) : (
          <Button content="Không khả dụng" disabled />
        )}
      </div>
    );
  };

  /* ============================================================
     Render modal khi user đã login
  ============================================================ */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Mua gói AI để sử dụng đầy đủ tính năng</h2>

        {hasActivePackage && (
          <div className={styles.activeNotice}>
            <p>
              Bạn đang sử dụng gói <strong>{myPackage.packageName}</strong>.
            </p>
            <p>Vui lòng đợi gói hết hạn để mua gói mới.</p>
          </div>
        )}

        <div className={styles.packageList}>
          {packagesStatus === "loading" && (
            <p className={styles.loading}>Đang tải gói AI...</p>
          )}

          {packagesStatus === "failed" && (
            <p className={styles.error}>
              Không thể tải danh sách gói AI. Vui lòng thử lại sau.
            </p>
          )}

          {packagesStatus === "succeeded" &&
            packages &&
            packages.map((pkg, idx) => renderPackageCard(pkg, idx === 1))}
        </div>

        <button className={styles.close} onClick={() => dispatch(closeModal())}>
          Đóng
        </button>
      </div>
    </div>
  );
}
