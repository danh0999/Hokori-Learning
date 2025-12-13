// components/quiz/QuizList.jsx
import React from "react";
import { Popconfirm, Button, Card, List, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

export default function QuizList({
  value = [],
  onChange,
  onCreateNew,
  onImport,
  onEdit,
  onRemove,
}) {
  // 🔹 Helper: ưu tiên dùng totalQuestions từ BE, fallback sang mảng questions
  const getQuestionCount = (qz) => {
    if (typeof qz.totalQuestions === "number") {
      return qz.totalQuestions;
    }
    if (Array.isArray(qz.questions)) {
      return qz.questions.length;
    }
    return 0;
  };

  return (
    <div className={styles.wrap}>
      {/* Header có nút New quiz / Import nếu bạn muốn */}
      {(onCreateNew || onImport) && (
        <div className={styles.header}>
          {onCreateNew && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onCreateNew?.()}
            >
              New quiz
            </Button>
          )}
          {onImport && (
            <Button style={{ marginLeft: 8 }} onClick={() => onImport?.()}>
              Import from library
            </Button>
          )}
        </div>
      )}

      <Card>
        <List
          dataSource={value}
          locale={{ emptyText: "No quizzes yet" }}
          renderItem={(qz) => (
            <List.Item className={styles.item}>
              {/* bên trái: thông tin quiz */}
              <div className={styles.itemInfo}>
                <Space direction="vertical" size={0}>
                  <Space>
                    <b>{qz.title}</b>
                    <span className={styles.muted}>
                      · {getQuestionCount(qz)} câu
                    </span>
                  </Space>
                  {qz.description && (
                    <span className={styles.muted}>{qz.description}</span>
                  )}
                </Space>
              </div>

              {/* bên phải: nút hành động */}
              <div className={styles.actions}>
                <Button size="small" onClick={() => onEdit?.(qz)}>
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa quiz này?"
                  description="Quiz sẽ bị xóa (soft delete), toàn bộ câu hỏi sẽ mất."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={(e) => {
                    e?.stopPropagation?.();
                    onRemove?.(qz.id);
                  }}
                  onPopupClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="small"
                    danger
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
