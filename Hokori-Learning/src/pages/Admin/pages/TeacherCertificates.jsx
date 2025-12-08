// TeacherCertificates.jsx
import React, { useEffect, useState } from "react";
import s from "./TeacherCertificates.module.scss";
import { toast } from "react-toastify";
import api from "../../../configs/axios.js";
// Helper: build absolute URL cho file chứng chỉ
const buildFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;

  const apiBase = api.defaults.baseURL || "";
  const rootBase = apiBase.replace(/\/api\/?$/, "");

  return rootBase + fileUrl; // ví dụ: https://api.hokori-backend.org + /files/certificates/4/xxx.jpg
};
// =====================================================
// 📌 Modal xem chứng chỉ chi tiết
// =====================================================
const ViewModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      // BE đang trả "YYYY-MM-DD" → convert sang ngày VN
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết hồ sơ giáo viên</h2>

        <div className={s.modalContent}>
          {/* Thông tin cơ bản của giáo viên / request */}
          <div className={s.infoBlock}>
            <p>
              <strong>Giáo viên:</strong>{" "}
              {data.teacherName || `User #${data.userId}`}
            </p>
            <p>
              <strong>Email:</strong> {data.email || "—"}
            </p>
            <p>
              <strong>Ngày gửi:</strong>{" "}
              {data.submittedAt
                ? new Date(data.submittedAt).toLocaleString("vi-VN")
                : "—"}
            </p>
          </div>

          {/* Danh sách các chứng chỉ trong hồ sơ này */}
          <div className={s.previewBlock}>
            <p>
              <strong>Danh sách chứng chỉ</strong>
            </p>

            {!data.items || data.items.length === 0 ? (
              <p>Không có chứng chỉ nào trong hồ sơ này.</p>
            ) : (
              <div className={s.certList}>
                {data.items.map((item) => (
                  <div key={item.id} className={s.certItem}>
                    <p className={s.certTitle}>{item.title || "Chứng chỉ"}</p>

                    {item.credentialId && (
                      <p>
                        <strong>Credential ID:</strong> {item.credentialId}
                      </p>
                    )}

                    <p>
                      <strong>Ngày cấp:</strong> {formatDate(item.issueDate)}
                    </p>

                    <p>
                      <strong>Ngày hết hạn:</strong>{" "}
                      {formatDate(item.expiryDate)}
                    </p>

                    {item.note && (
                      <p>
                        <strong>Ghi chú:</strong> {item.note}
                      </p>
                    )}
                    {item.fileUrl && (
                      <div className={s.certImageBlock}>
                        <img
                          src={buildFileUrl(item.fileUrl)}
                          alt={item.title || "Certificate image"}
                          className={s.certImage}
                        />
                        <button
                          type="button"
                          className={s.btnSmall}
                          onClick={() =>
                            window.open(
                              buildFileUrl(item.fileUrl),
                              "_blank",
                              "noopener"
                            )
                          }
                        >
                          Xem ảnh
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.modalActions}>
          <button onClick={onClose} className={s.btnGhost}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 📌 Modal từ chối
// =====================================================
const RejectModal = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!reason.trim()) return toast.error("Vui lòng nhập lý do từ chối!");
    onConfirm(reason);
    setReason("");
  };

  return (
    <div className={s.modalOverlay}>
      <div className={s.modalSmall}>
        <h2 className={s.modalTitle}>Từ chối chứng chỉ</h2>
        <textarea
          className={s.textarea}
          placeholder="Nhập lý do từ chối..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onClose}>
            Hủy
          </button>
          <button className={s.btnDanger} onClick={submit}>
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 📌 Main Page
// =====================================================
export default function TeacherCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewData, setViewData] = useState(null);
  const [rejectData, setRejectData] = useState(null);

  // ------------------ GET list hồ sơ PENDING ------------------
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/teacher-approval/requests", {
        params: { status: "PENDING" }, // lấy danh sách chờ duyệt
      });

      const list = res.data?.data || [];

      const mapped = list.map((req) => {
        const firstItem = (req.items && req.items[0]) || {};
        return {
          id: req.id,
          userId: req.userId,
          teacherName: req.teacherName || firstItem.teacherName,
          email: req.email || firstItem.email,
          level: firstItem.level || firstItem.title,
          submittedAt: req.submittedAt,
          status: req.status, // PENDING / APPROVED / REJECTED
          moderatorNote: req.note,
          note: req.message || null, // nếu BE có message
          // ⭐ QUAN TRỌNG: giữ nguyên mảng items để modal dùng
          items: req.items || [],
        };
      });

      setCerts(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách hồ sơ giáo viên!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ------------------ POST decision APPROVED ------------------
  const approve = async (item) => {
    try {
      await api.post(`/admin/teacher-approval/requests/${item.id}/decision`, {
        action: "APPROVED", // theo swagger: APPROVED hoặc REJECTED
        note: "",
      });

      // update local state
      setCerts((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: "APPROVED" } : c))
      );
      toast.success("Duyệt chứng chỉ thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Duyệt chứng chỉ thất bại!");
    }
  };

  // ------------------ POST decision REJECTED ------------------
  const reject = async (item, reason) => {
    try {
      await api.post(`/admin/teacher-approval/requests/${item.id}/decision`, {
        action: "REJECTED",
        note: reason,
      });

      setCerts((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, status: "REJECTED", rejectReason: reason }
            : c
        )
      );
      toast.success("Đã từ chối chứng chỉ!");
    } catch (err) {
      console.error(err);
      toast.error("Từ chối chứng chỉ thất bại!");
    }
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Duyệt chứng chỉ giáo viên</h1>

      {loading && <p>Đang tải danh sách hồ sơ...</p>}

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Giáo viên</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {certs.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Không có hồ sơ nào đang chờ duyệt.
                </td>
              </tr>
            )}

            {certs.map((c) => (
              <tr key={c.id}>
                <td>{c.teacherName || `User #${c.userId}`}</td>
                <td>
                  {c.submittedAt
                    ? new Date(c.submittedAt).toLocaleString("vi-VN")
                    : "—"}
                </td>
                <td>
                  <span
                    className={`${s.badge} ${
                      c.status === "PENDING"
                        ? s.pending
                        : c.status === "APPROVED"
                        ? s.approved
                        : s.rejected
                    }`}
                  >
                    {c.status === "PENDING"
                      ? "Chờ duyệt"
                      : c.status === "APPROVED"
                      ? "Đã duyệt"
                      : "Từ chối"}
                  </span>
                </td>

                <td className={s.actions}>
                  <button className={s.btnSmall} onClick={() => setViewData(c)}>
                    Xem
                  </button>

                  {c.status === "PENDING" && (
                    <>
                      <button
                        className={s.btnPrimary}
                        onClick={() => approve(c)}
                      >
                        Duyệt
                      </button>
                      <button
                        className={s.btnDanger}
                        onClick={() => setRejectData(c)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ViewModal
        open={!!viewData}
        data={viewData}
        onClose={() => setViewData(null)}
      />

      <RejectModal
        open={!!rejectData}
        onClose={() => setRejectData(null)}
        onConfirm={async (reason) => {
          if (!rejectData) return;
          await reject(rejectData, reason);
          setRejectData(null);
        }}
      />
    </div>
  );
}
