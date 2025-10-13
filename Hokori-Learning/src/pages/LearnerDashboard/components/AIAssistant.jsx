import React from "react";
import { FaRobot } from "react-icons/fa";
import styles from "./AIAssistant.module.scss";

const AIAssistant = ({ message, onChat }) => {
  return (
    <section className="card">
      <div className={styles.header}>
        <FaRobot className={styles.icon} />
        <h3>Trợ lý AI</h3>
      </div>

      <div className={styles.tip}>
        <p>{message}</p>
      </div>

      <button className={styles.btn} onClick={onChat}>Trò chuyện với AI</button>
    </section>
  );
};

export default AIAssistant;
