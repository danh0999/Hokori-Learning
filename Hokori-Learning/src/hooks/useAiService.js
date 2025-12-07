// src/hooks/useAiService.js
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAiQuota,
  checkAIPermission,
  consumeAiServiceQuota,
} from "../redux/features/aiPackageSlice";
import { toast } from "react-toastify";

export default function useAiService() {
  const dispatch = useDispatch();
  const { myPackage } = useSelector((state) => state.aiPackage);

  // Helper: đang có gói active hay không
  const hasActivePackage =
    myPackage && myPackage.hasPackage && !myPackage.isExpired;

  /**
   * runService(serviceCode, apiCallFunction)
   * Ví dụ:
   *   runService("GRAMMAR", () => api.post("/ai/sentence-analysis", body))
   */
  const runService = async (serviceCode, apiCall) => {
    try {
      // ========== CASE A: User có gói AI đang active ==========
      if (hasActivePackage) {
        const res = await apiCall();
        // tuỳ BE: nếu cần gọi API trừ quota thủ công
        dispatch(consumeAiServiceQuota({ serviceType: serviceCode, amount: 1 }));
        return res;
      }

      // ========== CASE B: CHƯA CÓ GÓI → CHECK QUOTA FREE/TRIAL ==========
      const quotas = await dispatch(fetchAiQuota()).unwrap();
      const q = quotas?.[serviceCode] || { hasQuota: false };

      if (q.hasQuota) {
        const res = await apiCall();
        dispatch(consumeAiServiceQuota({ serviceType: serviceCode, amount: 1 }));
        return res;
      }

      // ========== CASE C: Hết quota ==========
      await dispatch(checkAIPermission(serviceCode)); // slice sẽ bật modal
      toast.info("Bạn đã hết lượt sử dụng. Vui lòng mua gói AI.");
      return null;
    } catch (e) {
      console.error("AI service error:", e);
      toast.error("Không thể xử lý yêu cầu AI.");
      return null;
    }
  };

  return { runService };
}
