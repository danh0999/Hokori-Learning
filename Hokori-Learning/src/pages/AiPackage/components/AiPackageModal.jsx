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

export default function AiPackageModal({ onClose }) {
  const dispatch = useDispatch();

  const { packages, packagesStatus, myPackage, checkoutStatus } = useSelector(
    (state) => state.aiPackage
  );

  const loadingCheckout = checkoutStatus === "loading";

  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  const activePackageId =
    hasActivePackage && (myPackage.packageId || myPackage.id || null);

  /* ===============================
      AUTO LOAD PACKAGES WHEN OPEN
  =============================== */
  useEffect(() => {
    if (!packages || packages.length === 0) {
      dispatch(fetchAiPackages());
    }
  }, [dispatch, packages]);

  /* ===============================
      HÀM ĐÓNG THỰC SỰ
      - Nếu parent truyền onClose -> dùng local state
      - Nếu không -> dùng Redux closeModal()
  =============================== */
  const doClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      dispatch(closeModal());
    }
  };

  /* ===============================
      HANDLE CLOSE (button + overlay)
  =============================== */
  const handleClose = () => {
    // Nếu đang checkout mà người dùng đóng thì hỏi lại cho chắc
    if (loadingCheckout) {
      const ok = window.confirm(
        "Thanh toán đang được xử lý. Bạn chắc chắn muốn đóng?"
      );
      if (!ok) return;
    }
    doClose();
  };

  /* ===============================
      HANDLE CHECKOUT
      RULE: đang có gói active -> KHÔNG cho mua thêm
  =============================== */
  const handleCheckout = (pkg) => {
    if (loadingCheckout) return;

    // Business rule: đã có gói đang hoạt động -> không mua thêm
    if (hasActivePackage) {
      toast.info(
        `Bạn đang sử dụng gói ${myPackage.packageName}.\nVui lòng dùng hết hoặc đợi gói hết hạn để mua gói mới.`
      );
      return;
    }

    const packageId = pkg.id;

    dispatch(purchaseAiPackage(packageId))
      .unwrap()
      .then((checkout) => {
        // Gói FREE / kích hoạt ngay
        if (!checkout?.paymentLink) {
          toast.success("Gói AI đã được kích hoạt!");
          dispatch(fetchMyAiPackage());
          dispatch(fetchAiQuota());
          doClose();
          return;
        }

        // Gói trả phí -> redirect PayOS
        window.location.href = checkout.paymentLink;
      })
      .catch(() => toast.error("Không thể thực hiện thanh toán."));
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // chặn bubble
      >
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
            <p>Đang tải danh sách gói AI...</p>
          )}

          {packagesStatus === "succeeded" && packages?.length === 0 && (
            <p>Không có gói nào khả dụng.</p>
          )}

          {packagesStatus !== "loading" &&
            packages &&
            packages.length > 0 &&
            packages.map((pkg) => {
              const isActive = activePackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`${styles.card} ${
                    pkg.displayOrder === 2 ? styles.pro : ""
                  }`}
                >
                  {pkg.displayOrder === 2 && (
                    <span className={styles.best}>BEST</span>
                  )}

                  <h3>{pkg.name}</h3>
                  <p>{pkg.durationDays} ngày sử dụng</p>

                  <ul>
                    <li>{pkg.grammarQuota} lượt kiểm tra chính tả</li>
                    <li>{pkg.kaiwaQuota} lượt Kaiwa</li>
                    <li>{pkg.pronunQuota} lượt phát âm</li>
                  </ul>

                  <div className={styles.price}>
                    {pkg.priceCents.toLocaleString("vi-VN")}đ
                  </div>

                  {hasActivePackage ? (
                    isActive ? (
                      <Button content="Đang sử dụng" disabled />
                    ) : (
                      <Button content="Không khả dụng" disabled />
                    )
                  ) : (
                    <Button
                      content={
                        loadingCheckout ? "Đang xử lý..." : `Mua ${pkg.name}`
                      }
                      onClick={() => handleCheckout(pkg)}
                      disabled={loadingCheckout}
                    />
                  )}
                </div>
              );
            })}
        </div>

        <button onClick={handleClose} className={styles.close}>
          Đóng
        </button>
      </div>
    </div>
  );
}
