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

  const orderCode = params.get("orderCode");
  const statusParam = params.get("status");
  const codeParam = params.get("code");
  const cancelParam = params.get("cancel");

  const aliveRef = useRef(true);
  const handledRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;

    if (!orderCode) {
      toast.error("Không tìm thấy mã đơn hàng.");
      navigate("/");
      return;
    }

    // ✅ NGUỒN SỰ THẬT TẠM THỜI = PAYOS REDIRECT
    const isPayOSSuccess =
      statusParam?.toUpperCase() === "PAID" || codeParam === "00";

    const isPayOSCancel =
      cancelParam === "true" ||
      statusParam?.toUpperCase() === "CANCELLED";

    const syncAndGo = async (to) => {
      try {
        await Promise.all([
          dispatch(fetchMyAiPackage()).unwrap(),
          dispatch(fetchAiQuota()).unwrap(),
        ]);
        dispatch(setNeedsSync(false));
      } catch {
        // ignore
      }
      if (aliveRef.current) navigate(to);
    };

    // =======================
    // CASE 1: PAYOS SUCCESS
    // =======================
    if (isPayOSSuccess && !handledRef.current) {
      handledRef.current = true;

      toast.success("Thanh toán thành công! Gói AI đã được kích hoạt.");
      syncAndGo("/dashboard");
      return;
    }

    // =======================
    // CASE 2: PAYOS CANCEL
    // =======================
    if (isPayOSCancel) {
      toast.error("Thanh toán đã bị hủy.");
      navigate("/ai-packages");
      return;
    }

    // =======================
    // CASE 3: FALLBACK CHECK (KHÔNG DÙNG STATUS)
    // =======================
    api
      .get(`/payment/order/${orderCode}`)
      .then(() => {
        toast.info(
          "Thanh toán đang được xử lý. Vui lòng kiểm tra lại trong giây lát."
        );
        syncAndGo("/dashboard");
      })
      .catch(() => {
        toast.error("Không thể xác minh thanh toán.");
        navigate("/");
      });

    return () => {
      aliveRef.current = false;
    };
  }, [orderCode, statusParam, codeParam, cancelParam, dispatch, navigate]);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h3>Đang xác nhận thanh toán...</h3>
      <p>Vui lòng không đóng trang này.</p>
    </div>
  );
}
