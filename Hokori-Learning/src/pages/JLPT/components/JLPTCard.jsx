// src/pages/JLPT/components/JLPTCard.jsx
import styles from "./JLPTCard.module.scss";
import { MdPeople } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { CiCircleCheck } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

const JLPTCard = ({ test }) => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    navigate(`/jlpt/test/${test.id}`);
  };

  // BE JlptTestResponse (ví dụ):
  // { id, eventId, level, durationMin, totalScore, resultNote, ... }
  const title = test.title || `JLPT ${test.level || ""} Mock Test`;
  const description = test.description || test.resultNote || "";
  const duration =
    test.durationMin ?? test.duration_min ?? test.duration ?? 0;
  const maxParticipants =
    test.maxParticipants ?? test.max_participants ?? null;
  const status = test.status || "ACTIVE";

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <h3>{title}</h3>
        <span className={styles.levelTag}>{test.level}</span>
      </div>

      {/* Mô tả */}
      {description && <p className={styles.desc}>{description}</p>}

      {/* Info */}
      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>{duration} phút</span>
        </div>

        {maxParticipants && (
          <div className={styles.infoItem}>
            <MdPeople />
            <span>Tối đa {maxParticipants} người</span>
          </div>
        )}

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
