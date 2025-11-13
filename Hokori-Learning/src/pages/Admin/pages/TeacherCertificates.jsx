import React, { useState } from "react";
import s from "./TeacherCertificates.module.scss";
import { toast } from "react-toastify";

// ===================== MOCK DATA =====================
const MOCK_CERTS = [
  {
    id: 1,
    teacherName: "Nguyễn Văn A",
    email: "a@example.com",
    level: "N2",
    fileUrl: "/mock/n2-cert.jpg",
    moderatorNote: "Hồ sơ hợp lệ.",
    submittedAt: "2025-11-10T08:30",
    status: "PENDING",
  },
  {
    id: 2,
    teacherName: "Trần Thị B",
    email: "b@example.com",
    level: "N3",
    fileUrl: "/mock/n3-cert.png",
    moderatorNote: "",
    submittedAt: "2025-11-12T10:00",
    status: "PENDING",
  },
];

// =====================================================
// 📌 Modal xem chứng chỉ chi tiết
// =====================================================
const ViewModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết chứng chỉ</h2>

        <div className={s.modalContent}>
          <div className={s.infoBlock}>
            <p><strong>Giáo viên:</strong> {data.teacherName}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Trình độ:</strong> {data.level}</p>
            <p><strong>Ghi chú moderator:</strong> {data.moderatorNote || "—"}</p>
            <p><strong>Ngày gửi:</strong> {new Date(data.submittedAt).toLocaleString("vi-VN")}</p>
          </div>

          <div className={s.previewBlock}>
            <p><strong>Chứng chỉ:</strong></p>
            <img src={data.fileUrl} alt="certificate" className={s.previewImage}/>
          </div>
        </div>

        <div className={s.modalActions}>
          <button onClick={onClose} className={s.btnGhost}>Đóng</button>
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
          <button className={s.btnGhost} onClick={onClose}>Hủy</button>
          <button className={s.btnDanger} onClick={submit}>Từ chối</button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 📌 Main Page
// =====================================================
export default function TeacherCertificates() {
  const [certs, setCerts] = useState(MOCK_CERTS);

  const [viewData, setViewData] = useState(null);
  const [rejectData, setRejectData] = useState(null);

  const approve = (item) => {
    setCerts((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, status: "APPROVED" } : c
      )
    );
    toast.success("Duyệt chứng chỉ thành công!");
  };

  const reject = (item, reason) => {
    setCerts((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, status: "REJECTED", rejectReason: reason } : c
      )
    );
    toast.success("Đã từ chối chứng chỉ!");
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Duyệt chứng chỉ giáo viên</h1>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Giáo viên</th>
              <th>Email</th>
              <th>Cấp độ</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td>{c.teacherName}</td>
                <td>{c.email}</td>
                <td>{c.level}</td>
                <td>{new Date(c.submittedAt).toLocaleString("vi-VN")}</td>
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
                      <button className={s.btnPrimary} onClick={() => approve(c)}>
                        Duyệt
                      </button>
                      <button className={s.btnDanger} onClick={() => setRejectData(c)}>
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
      <ViewModal open={!!viewData} data={viewData} onClose={() => setViewData(null)} />

      <RejectModal
        open={!!rejectData}
        onClose={() => setRejectData(null)}
        onConfirm={(reason) => {
          reject(rejectData, reason);
          setRejectData(null);
        }}
      />
    </div>
  );
}
