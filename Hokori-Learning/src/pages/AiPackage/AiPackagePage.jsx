// src/pages/AiPackage/AiPackagePage.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAiPackages,
  fetchMyAiPackage,
  purchaseAiPackage,
  fetchAiQuota,
  resetCheckout,
  setNeedsSync,
} from "../../redux/features/aiPackageSlice";
import AiPackageCard from "./components/AiPackageCard";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import styles from "./AiPackagePage.module.scss";

/* ================= AUTH HELPER =================
   Vì state.user của mày có thể là object dù chưa login,
   nên check theo token/id thay vì `if (!user)`.
================================================= */
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

const AiPackagePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user);

  const {
    packages,
    packagesStatus,
    packagesError,
    myPackage,
    myPackageStatus,
    myPackageError,
    checkoutStatus,
  } = useSelector((state) => state.aiPackage);

  const isLoggedIn = useMemo(() => isLoggedInUser(user), [user]);

  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  useEffect(() => {
    // Public list luôn fetch
    dispatch(fetchAiPackages());

    // My package + quota chỉ fetch khi login (tránh 401 làm UI fail bậy)
    if (isLoggedIn) {
      dispatch(fetchMyAiPackage());
      dispatch(fetchAiQuota());
    }
  }, [dispatch, isLoggedIn]);

  const syncAfterSuccess = async () => {
    if (!isLoggedIn) return;
    await Promise.all([
      dispatch(fetchMyAiPackage()).unwrap(),
      dispatch(fetchAiQuota()).unwrap(),
    ]);
    dispatch(setNeedsSync(false));
  };

  const handlePurchase = async (packageId) => {
    if (!isLoggedIn) {
      toast.info("Đăng nhập để mua gói AI.");
      navigate("/login", { replace: false });
      return;
    }

    if (hasActivePackage) {
      toast.info(
        `Bạn đang sử dụng gói ${myPackage.packageName}. Vui lòng dùng hết hoặc đợi gói hết hạn để mua gói mới.`
      );
      return;
    }

    try {
      dispatch(resetCheckout());

      const checkout = await dispatch(purchaseAiPackage(packageId)).unwrap();
      dispatch(setNeedsSync(true));

      // PAID PACKAGE → redirect sang cổng thanh toán
      if (checkout?.paymentLink) {
        window.location.href = checkout.paymentLink;
        return;
      }

      // FREE PACKAGE → kích hoạt ngay
      toast.success(checkout?.description || "Gói AI đã được kích hoạt!");
      await syncAfterSuccess();
    } catch (err) {
      // err có thể là string/object tùy rejectWithValue
      const msg =
        (typeof err === "string" && err) ||
        err?.message ||
        err?.error ||
        err?.status ||
        "Thanh toán gói AI thất bại";
      toast.error(msg);
    }
  };

  const renderMyPackage = () => {
    if (!isLoggedIn) {
      return (
        <div className={styles.currentPackageBox}>
          <h3>Gói AI hiện tại</h3>
          <p>Bạn chưa đăng nhập. Đăng nhập để xem gói AI và quota của bạn.</p>
          <button
            className={styles.loginBtn}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      );
    }

    if (myPackageStatus === "loading") return <p>Đang tải gói AI hiện tại...</p>;

    if (myPackageStatus === "failed") {
      return (
        <div className={styles.currentPackageBox}>
          <h3>Gói AI hiện tại</h3>
          <p className={styles.expired}>
            Không thể tải gói AI hiện tại.{" "}
            {typeof myPackageError === "string" ? myPackageError : ""}
          </p>
        </div>
      );
    }

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
    if (packagesStatus === "loading") return <p>Đang tải danh sách gói AI...</p>;

    if (packagesStatus === "failed") {
      return (
        <p className={styles.expired}>
          Không thể tải danh sách gói AI.{" "}
          {typeof packagesError === "string" ? packagesError : ""}
        </p>
      );
    }

    if (!packages || packages.length === 0)
      return <p>Hiện chưa có gói AI nào.</p>;

    // Nếu BE lỡ trả cả inactive, FE sẽ ẩn bớt để đúng nghiệp vụ “public chỉ thấy gói đang bán”
    const activePackages = packages.filter((p) => p?.isActive !== false);

    if (activePackages.length === 0) return <p>Hiện chưa có gói AI nào đang bán.</p>;

    const disableButtons = checkoutStatus === "loading";

    return (
      <div className={styles.packageList}>
        {activePackages.map((pkg, index) => (
          <AiPackageCard
            key={pkg.id}
            pkg={pkg}
            highlight={index === 1}
            onPurchase={handlePurchase}
            disabled={disableButtons}
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
