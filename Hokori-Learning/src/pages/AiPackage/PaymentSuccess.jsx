// src/pages/AiPackage/PaymentSuccess.jsx
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchMyAiPackage, fetchAiQuota, setNeedsSync } from "../../redux/features/aiPackageSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../configs/axios";
import { toast } from "react-toastify";

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const orderCode = params.get("orderCode") || params.get("code");

  const timerRef = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    if (!orderCode) {
      toast.error("Không tìm thấy mã đơn hàng.");
      navigate("/");
      return () => {
        aliveRef.current = false;
      };
    }

    let retryCount = 0;
    const MAX_RETRY = 10;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const syncStoreAndGo = async (to) => {
      // đảm bảo store đã update xong rồi mới navigate
      await Promise.all([
        dispatch(fetchMyAiPackage()).unwrap(),
        dispatch(fetchAiQuota()).unwrap(),
      ]);
      dispatch(setNeedsSync(false));

      // chuyển trang sau khi sync xong
      if (aliveRef.current) navigate(to);
    };

    const checkPayment = async () => {
      try {
        const res = await api.get(`/payment/order/${orderCode}`);
        const payment = res?.data?.data;

        if (!payment) throw new Error("Không có dữ liệu thanh toán");

        if (payment.status === "PAID") {
          toast.success("Thanh toán thành công! Gói AI đã được kích hoạt.");
          await syncStoreAndGo("/dashboard");
          return;
        }

        if (payment.status === "FAILED" || payment.status === "CANCELLED") {
          toast.error("Thanh toán không thành công.");
          await syncStoreAndGo("/ai-packages");
          return;
        }

        // PENDING → retry
        retryCount++;
        if (retryCount >= MAX_RETRY) {
          toast.info("Thanh toán đang được xử lý. Vui lòng kiểm tra lại sau.");
          // vẫn cố sync 1 lần để UI cập nhật nếu BE đã kịp ghi nhận
          try {
            await syncStoreAndGo("/dashboard");
          } catch {
            if (aliveRef.current) navigate("/dashboard");
          }
          return;
        }

        clearTimer();
        timerRef.current = setTimeout(checkPayment, 2500);
      } catch {
        toast.error("Không thể xác minh thanh toán.");
        navigate("/");
      }
    };

    checkPayment();

    return () => {
      aliveRef.current = false;
      clearTimer();
    };
  }, [orderCode, dispatch, navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3>Đang xác nhận thanh toán...</h3>
      <p>Vui lòng không đóng trang này.</p>
    </div>
  );
}
