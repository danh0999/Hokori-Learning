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
      {/* <div className={styles.header}>
        <h3 className={styles.title}>Quizzes</h3>
        <Space>
          <Button onClick={onImport}>Import</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
            New quiz
          </Button>
        </Space>
      </div> */}

      <Card>
        <List
          dataSource={value}
          locale={{ emptyText: "No quizzes yet" }}
          renderItem={(qz) => (
            <List.Item
              className={styles.item}
              actions={[
                <Button size="small" onClick={() => onEdit?.(qz)}>
                  Edit
                </Button>,
                <Button size="small" danger onClick={() => onRemove?.(qz.id)}>
                  Remove
                </Button>,
              ]}
            >
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
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
