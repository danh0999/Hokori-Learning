import React from "react";
import styles from "./JLPTCard.module.scss";
import { MdPeople } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { CiCircleCheck } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
const JLPTCard = ({ test }) => {
  // test = 1 item join giữa JLPT_Event và JLPT_Test
  // event_id, title, level, status, description, duration_min, max_participants
  const navigate = useNavigate();
  const handleStartTest = () => {
    // Điều hướng tới route con /jlpt/test/:testId
    navigate(`/jlpt/test/${test.test_id}`);
  };
  return (
    <div className={styles.card}>
      {/* Header: tiêu đề đề thi + cấp độ N? */}
      <div className={styles.cardHeader}>
        <h3>{test.title}</h3>
        <span className={styles.levelTag}>{test.level}</span>
      </div>

      {/* Nội dung mô tả ngắn */}
      {test.description && <p className={styles.desc}>{test.description}</p>}

      {/* Thông tin chi tiết */}
      <div className={styles.infoGroup}>
        <div className={styles.infoItem}>
          <IoMdTime />
          <span>{test.duration_min} phút</span>
        </div>

        <div className={styles.infoItem}>
          <MdPeople />
          <span>Tối đa {test.max_participants} người</span>
        </div>

        <div className={styles.infoItem}>
          <CiCircleCheck />
          <span>Trạng thái: {test.status}</span>
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
