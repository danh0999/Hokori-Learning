import React, { useEffect, useState } from "react";
import s from "./SystemLogs.module.scss";
import DataTable from "../components/DataTable";
// import { toast } from "react-toast-toastify";
import { FiSearch } from "react-icons/fi";

// ============================
// Modal xem chi tiết log
// ============================
const LogDetailModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết Log</h2>

        <div className={s.modalBlock}>
          <p><strong>Mức độ:</strong> {data.level}</p>
          <p><strong>Tác nhân:</strong> {data.actor}</p>
          <p><strong>Hành động:</strong> {data.action}</p>
          <p><strong>Chi tiết:</strong> {data.details}</p>
          <p><strong>Thời gian:</strong> {data.time}</p>
          <p><strong>IP:</strong> {data.ip || "Không có"}</p>
        </div>

        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  /**
   * TODO(API):
   * GET /api/admin/system/logs
   * Response mẫu:
   * [
   *   { id, actor, action, details, level, time, ip }
   * ]
   */
  useEffect(() => {
    // TODO: fetch logs từ backend
    setLogs([
      {
        id: 1,
        actor: "admin@hokori.com",
        action: "UPDATE_USER",
        details: "Cập nhật role của user #103",
        level: "INFO",
        time: "2025-11-13 08:15",
        ip: "192.168.1.10",
      },
      {
        id: 2,
        actor: "moderator01@hokori.com",
        action: "REJECT_COURSE",
        details: "Từ chối khóa học #203 vì nội dung vi phạm",
        level: "WARNING",
        time: "2025-11-13 09:30",
        ip: null,
      },
      {
        id: 3,
        actor: "system",
        action: "ERROR_AI_SERVICE",
        details: "AI package server timeout",
        level: "ERROR",
        time: "2025-11-13 10:12",
        ip: null,
      },
    ]);
  }, []);

  const [detail, setDetail] = useState(null);

  const filtered = logs.filter((l) => {
    const matchKeyword =
      !keyword ||
      l.details.toLowerCase().includes(keyword.toLowerCase()) ||
      l.actor.toLowerCase().includes(keyword.toLowerCase());

    const matchLevel = levelFilter === "ALL" || l.level === levelFilter;

    return matchKeyword && matchLevel;
  });

  const columns = [
    {
      header: "Tác nhân",
      accessor: "actor",
    },
    {
      header: "Hành động",
      accessor: "action",
    },
    {
      header: "Mức độ",
      render: (row) => (
        <span
          className={
            row.level === "INFO"
              ? `${s.level} ${s.info}`
              : row.level === "WARNING"
              ? `${s.level} ${s.warning}`
              : `${s.level} ${s.error}`
          }
        >
          {row.level}
        </span>
      ),
    },
    {
      header: "Thời gian",
      accessor: "time",
    },
    {
      header: "Chi tiết",
      render: (row) => (
        <button className={s.btnSmall} onClick={() => setDetail(row)}>
          Xem
        </button>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <h1 className={s.title}>System Logs</h1>

      {/* FILTER BAR */}
      <div className={s.filters}>
        <div className={s.searchBox}>
          <FiSearch />
          <input
            placeholder="Tìm kiếm theo nội dung / tác nhân..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          className={s.select}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="ALL">Tất cả mức độ</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>

      {/* TABLE */}
      <div className={s.tableWrap}>
        <DataTable columns={columns} data={filtered} loading={loading} />
      </div>

      {/* MODAL */}
      <LogDetailModal
        open={!!detail}
        data={detail}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
