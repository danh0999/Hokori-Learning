// src/pages/JLPT/components/JLPTCard.jsx
import styles from "./JLPTCard.module.scss";
import { MdPeople } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { CiCircleCheck } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

const JLPTCard = ({ event }) => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    navigate(`/jlpt/test/${event.id}`); 
  };

  // BE trả event: { id, title, level, description, status, ... }
  const title = event.title || `JLPT ${event.level || ""} Mock Test`;
  const description = event.description || "";
  const level = event.level || "";
  const status = event.status || "ACTIVE";

  // Vì EVENT chưa có duration, đặt tạm nếu muốn giữ UI
  const duration = event.durationMin || event.duration || 120;

  // BE cũng chưa có maxParticipants → dùng fallback cho đẹp UI:


  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <h3>{title}</h3>
        <span className={styles.levelTag}>{level}</span>
      </div>

      {/* Mô tả */}
      {description && <p className={styles.desc}>{description}</p>}

      {/* Info */}
      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>{duration} phút</span>
        </div>

     
        <div className={styles.infoItem}>
          <CiCircleCheck />
          <span>Trạng thái: {status}</span>
        </div>
      </div>

      {/* CTA */}
      <button className={styles.actionBtn} onClick={handleStartTest}>
        Bắt đầu thi thử
      </button>
    </div>
  );
};

export default JLPTCard;
