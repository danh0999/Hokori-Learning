import React, { useEffect, useState } from "react";
import s from "./Withdrawals.module.scss";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";

// MOCK DATA
const MOCK_WITHDRAWALS = [
  {
    id: 1,
    teacherName: "Nguyễn Văn A",
    email: "teacherA@example.com",
    amount: 1500000,
    bank: "MB Bank",
    bankNumber: "123456789",
    createdAt: "2025-10-10T09:30:00Z",
    status: "PENDING",
  },
  {
    id: 2,
    teacherName: "Trần Thị B",
    email: "teacherB@example.com",
    amount: 2200000,
    bank: "Vietcombank",
    bankNumber: "987654321",
    createdAt: "2025-10-12T13:15:00Z",
    status: "APPROVED",
  },
];

const STATUS_LABEL = {
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

// ====== Confirm Modal ======
const ConfirmModal = ({ open, title, desc, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>{title}</h2>
        <p className={s.modalDesc}>{desc}</p>
        <div className={s.modalActions}>
          <button onClick={onCancel} className={s.btnGhost}>Hủy</button>
          <button onClick={onConfirm} className={s.btnPrimary}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

export default function Withdrawals() {
  const [data, setData] = useState(MOCK_WITHDRAWALS);
  const [loading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");

  // Confirm modal config
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    onConfirm: null,
  });

  // TODO(API): GET /api/admin/withdrawals
  useEffect(() => {}, []);

  const filtered = data.filter((w) => {
    return statusFilter === "ALL" || w.status === statusFilter;
  });

  const askApprove = (item) => {
    setConfirm({
      open: true,
      title: "Duyệt yêu cầu rút tiền",
      desc: `Bạn có chắc muốn duyệt yêu cầu rút ${item.amount.toLocaleString()}₫ của "${item.teacherName}"?`,
      onConfirm: () => handleApprove(item),
    });
  };

  const handleApprove = (item) => {
    // TODO(API): PUT /api/admin/withdrawals/{id}/approve
    setData((prev) =>
      prev.map((w) =>
        w.id === item.id ? { ...w, status: "APPROVED" } : w
      )
    );
    toast.success("Duyệt yêu cầu rút tiền thành công");
    setConfirm({ open: false });
  };

  const askReject = (item) => {
    setConfirm({
      open: true,
      title: "Từ chối yêu cầu rút tiền",
      desc: `Bạn có chắc muốn từ chối yêu cầu rút tiền của "${item.teacherName}"?`,
      onConfirm: () => handleReject(item),
    });
  };

  const handleReject = (item) => {
    // TODO(API): PUT /api/admin/withdrawals/{id}/reject
    setData((prev) =>
      prev.map((w) =>
        w.id === item.id ? { ...w, status: "REJECTED" } : w
      )
    );
    toast.success("Đã từ chối yêu cầu rút tiền");
    setConfirm({ open: false });
  };

  const columns = [
    { header: "Giáo viên", accessor: "teacherName" },
    { header: "Email", accessor: "email" },
    {
      header: "Số tiền",
      render: (row) => row.amount.toLocaleString() + "₫",
    },
    {
      header: "Ngân hàng",
      render: (r) => `${r.bank} - ${r.bankNumber}`,
    },
    {
      header: "Ngày yêu cầu",
      render: (r) => new Date(r.createdAt).toLocaleString("vi-VN"),
    },
    {
      header: "Trạng thái",
      render: (r) => {
        const cls =
          r.status === "APPROVED"
            ? `${s.status} ${s.approved}`
            : r.status === "REJECTED"
            ? `${s.status} ${s.rejected}`
            : `${s.status} ${s.pending}`;

        return <span className={cls}>{STATUS_LABEL[r.status]}</span>;
      },
    },
    {
      header: "Thao tác",
      render: (r) => (
        <div className={s.actions}>
          {r.status === "PENDING" && (
            <>
              <button className={s.actionApprove} onClick={() => askApprove(r)}>
                Duyệt
              </button>
              <button className={s.actionReject} onClick={() => askReject(r)}>
                Từ chối
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Yêu cầu rút tiền</h1>

        <select
          className={s.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>

      <div className={s.tableWrap}>
        <DataTable data={filtered} columns={columns} loading={loading} />
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        desc={confirm.desc}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
}
