import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  fetchMyAiPackage,
  fetchAiQuota,
  setNeedsSync,
} from "../../redux/features/aiPackageSlice";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../configs/axios";
import { toast } from "react-toastify";

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // PayOS params
  const orderCode = params.get("orderCode");
  const statusParam = params.get("status");
  const codeParam = params.get("code");
  const cancelParam = params.get("cancel");

  const timerRef = useRef(null);
  const aliveRef = useRef(true);
  const handledRef = useRef(false); // tránh xử lý success 2 lần

  useEffect(() => {
    aliveRef.current = true;

    if (!orderCode) {
      toast.error("Không tìm thấy mã đơn hàng.");
      navigate("/");
      return () => {
        aliveRef.current = false;
      };
    }

    // ===============================
    // PAYOS QUICK SUCCESS CHECK
    // ===============================
    const isPayOSSuccess =
      (statusParam && statusParam.toUpperCase() === "PAID") ||
      codeParam === "00";

    const isPayOSCancel =
      cancelParam === "true" ||
      statusParam?.toUpperCase() === "CANCELLED";

    const syncStoreAndGo = async (to) => {
      try {
        await Promise.all([
          dispatch(fetchMyAiPackage()).unwrap(),
          dispatch(fetchAiQuota()).unwrap(),
        ]);
        dispatch(setNeedsSync(false));
      } catch {
        // ignore sync error
      }

      if (aliveRef.current) navigate(to);
    };

    // ===============================
    // CASE 1: PAYOS CONFIRM SUCCESS
    // ===============================
    if (isPayOSSuccess && !handledRef.current) {
      handledRef.current = true;

      toast.success("Thanh toán thành công! Gói AI đã được kích hoạt.");
      syncStoreAndGo("/dashboard");
      return () => {
        aliveRef.current = false;
      };
    }

    // ===============================
    // CASE 2: PAYOS CANCEL
    // ===============================
    if (isPayOSCancel) {
      toast.error("Thanh toán đã bị hủy.");
      navigate("/ai-packages");
      return () => {
        aliveRef.current = false;
      };
    }

    // ===============================
    // CASE 3: VERIFY BACKEND (POLL)
    // ===============================
    let retryCount = 0;
    const MAX_RETRY = 10;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const checkPayment = async () => {
      try {
        const res = await api.get(`/payment/order/${orderCode}`);
        const payment = res?.data?.data;

        if (!payment) throw new Error("Không có dữ liệu thanh toán");

        if (payment.status === "PAID") {
          if (!handledRef.current) {
            handledRef.current = true;
            toast.success("Thanh toán thành công! Gói AI đã được kích hoạt.");
            await syncStoreAndGo("/dashboard");
          }
          return;
        }

        if (
          payment.status === "FAILED" ||
          payment.status === "CANCELLED"
        ) {
          toast.error("Thanh toán không thành công.");
          navigate("/ai-packages");
          return;
        }

        // PENDING → retry
        retryCount++;
        if (retryCount >= MAX_RETRY) {
          toast.info(
            "Thanh toán đang được xử lý. Vui lòng kiểm tra lại trong giây lát."
          );
          await syncStoreAndGo("/dashboard");
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
  }, [orderCode, statusParam, codeParam, cancelParam, dispatch, navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3>Đang xác nhận thanh toán...</h3>
      <p>Vui lòng không đóng trang này.</p>
    </div>
  );
}
