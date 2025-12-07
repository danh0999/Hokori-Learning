// src/pages/AiPackage/AiPackagePage.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAiPackages,
  fetchMyAiPackage,
  purchaseAiPackage,
  fetchAiQuota,
} from "../../redux/features/aiPackageSlice";
import AiPackageCard from "./components/AiPackageCard";
import { toast } from "react-toastify";

import styles from "./AiPackagePage.module.scss";

const AiPackagePage = () => {
  const dispatch = useDispatch();

  const { packages, packagesStatus, myPackage, myPackageStatus } = useSelector(
    (state) => state.aiPackage
  );

  useEffect(() => {
    dispatch(fetchAiPackages());
    dispatch(fetchMyAiPackage());
    dispatch(fetchAiQuota());
  }, [dispatch]);

  const handlePurchase = (packageId) => {
    dispatch(purchaseAiPackage(packageId))
      .unwrap()
      .then((checkout) => {
        if (!checkout?.paymentLink) {
          // FREE PACKAGE
          toast.success(checkout?.description || "Gói AI đã được kích hoạt!");
          dispatch(fetchMyAiPackage());
          dispatch(fetchAiQuota());
        } else {
          // PAID PACKAGE
          window.location.href = checkout.paymentLink;
        }
      })
      .catch((err) => {
        const msg = err?.message || err?.status || "Thanh toán gói AI thất bại";
        toast.error(msg);
      });
  };

  const renderMyPackage = () => {
    if (myPackageStatus === "loading")
      return <p>Đang tải gói AI hiện tại...</p>;
    if (!myPackage || !myPackage.hasPackage)
      return <p>Bạn chưa có gói AI nào đang hoạt động.</p>;

    return (
      <div className={styles.currentPackageBox}>
        <h3>Gói AI hiện tại</h3>
        <p>
          <strong>{myPackage.packageName}</strong>
        </p>
        <p>
          Ngày mua:{" "}
          {myPackage.purchasedAt &&
            new Date(myPackage.purchasedAt).toLocaleDateString("vi-VN")}
        </p>
        <p>
          Hết hạn:{" "}
          {myPackage.expiresAt &&
            new Date(myPackage.expiresAt).toLocaleDateString("vi-VN")}
        </p>
        {myPackage.isExpired && (
          <p className={styles.expired}>Gói này đã hết hạn</p>
        )}
      </div>
    );
  };

  const renderPackageList = () => {
    if (packagesStatus === "loading")
      return <p>Đang tải danh sách gói AI...</p>;
    if (!packages || packages.length === 0)
      return <p>Hiện chưa có gói AI nào.</p>;

    return (
      <div className={styles.packageList}>
        {packages.map((pkg, index) => (
          <AiPackageCard
            key={pkg.id}
            pkg={pkg}
            highlight={index === 1} // ví dụ Pro là card thứ 2
            onPurchase={handlePurchase}
            myPackage={myPackage}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <h1>Gói AI</h1>

      <section className={styles.section}>{renderMyPackage()}</section>

      <section className={styles.section}>
        <h2>Chọn gói để tiếp tục sử dụng AI</h2>
        {renderPackageList()}
      </section>
    </div>
  );
};

export default AiPackagePage;
