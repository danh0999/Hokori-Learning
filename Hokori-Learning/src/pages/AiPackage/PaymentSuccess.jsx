// src/pages/AiPackage/PaymentSuccess.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  fetchMyAiPackage,
  fetchAiQuota,
} from "../../redux/features/aiPackageSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function PaymentSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    async function sync() {
      try {
        await dispatch(fetchMyAiPackage());
        await dispatch(fetchAiQuota());
        toast.success("Thanh toán thành công! Gói AI đã được cập nhật.");
      } finally {
        navigate("/dashboard");
      }
    }
    sync();
  }, [dispatch, navigate]);

  return <div>Đang xác nhận thanh toán...</div>;
}
