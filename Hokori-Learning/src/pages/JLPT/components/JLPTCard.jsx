// src/pages/JLPT/components/JLPTCard.jsx
import styles from "./JLPTCard.module.scss";
import { IoMdTime } from "react-icons/io";
import { CiCircleCheck } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

const JLPTCard = ({ event }) => {
  const navigate = useNavigate();

  const handleViewTests = () => {
    navigate(`/jlpt/events/${event.id}`);
  };

  const title = event.title || `Sự kiện JLPT ${event.level || ""}`;
  const description = event.description || "";
  const level = event.level || "";
  const status = event.status || "OPEN";

  const formatDate = (iso) => {
    if (!iso) return "Chưa có";
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <h3>{title}</h3>
        {level && <span className={styles.levelTag}>{level}</span>}
      </div>

      {/* Description */}
      {description && <p className={styles.desc}>{description}</p>}

      {/* Info */}
      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>Bắt đầu: {formatDate(event.startAt)}</span>
        </div>

        <div className={styles.infoItem}>
          <IoMdTime />
          <span>Kết thúc: {formatDate(event.endAt)}</span>
        </div>

        <div className={styles.infoItem}>
          <CiCircleCheck />
          <span>Trạng thái: {status}</span>
        </div>
      </div>

      {/* CTA */}
      <button className={styles.actionBtn} onClick={handleViewTests}>
        Xem các đề thi
      </button>
    </div>
  );
};

export default JLPTCard;
