// src/pages/JLPT/components/JLPTCard.jsx
import styles from "./JLPTCard.module.scss";
import { CiCircleCheck } from "react-icons/ci";
import { IoMdTime } from "react-icons/io";
import { MdPeople } from "react-icons/md";
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

  const startTime = event.startTime
    ? new Date(event.startTime).toLocaleString()
    : null;

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
        {startTime && (
          <div className={styles.infoItem}>
            <IoMdTime />
            <span>Bắt đầu: {startTime}</span>
          </div>
        )}

        <div className={styles.infoItem}>
          <CiCircleCheck />
          <span>Trạng thái: {status}</span>
        </div>

        <div className={styles.infoItem}>
          <MdPeople />
          <span>
            Người tham gia: {event.currentParticipants || 0}
            {event.maxParticipants
              ? ` / ${event.maxParticipants}`
              : ""}
          </span>
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
