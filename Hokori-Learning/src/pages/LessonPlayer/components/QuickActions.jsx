import React from "react";
import styles from "./QuickActions.module.scss";
import { Button } from  "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";

const QuickActions = ({ lessonId }) => {
  const navigate = useNavigate();

  // danh sách action có thể có thêm sau (flashcard, ghi chú,...)
  const actions = [
    { label: "Tệp đính kèm", to: null },
    { label: "Quiz nhanh", to: "/quiz" },
    { label: "Flashcard", to: null },
    { label: "Ghi chú của tôi", to: null },
  ];

  return (
    <div className={styles.quickGrid}>
      {actions.map((action) => (
        <Button
          key={action.label}
          content={action.label}
          className={styles.card}
          to={action.to}
          onClick={
            !action.to
              ? () => alert(`Tính năng "${action.label}" đang phát triển.`)
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default QuickActions;
