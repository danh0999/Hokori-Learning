// components/quiz/QuizList.jsx
import React from "react";
import { Button, Card, List, Space } from "antd";
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
  return (
    <div className={styles.wrap}>
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
                      · {qz.questions?.length || 0} questions
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
                  Edit
                </Button>
                <Button size="small" danger onClick={() => onRemove?.(qz.id)}>
                  Remove
                </Button>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
