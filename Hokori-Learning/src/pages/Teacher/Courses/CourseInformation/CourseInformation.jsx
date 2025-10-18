import React from "react";
import { useParams } from "react-router-dom";
import { Card, Tabs, Button, Tag, Space } from "antd";
import styles from "./styles.module.scss";

export default function CourseInformation() {
  const { id } = useParams();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Course #{id}</h1>
          <p className={styles.subtitle}>
            Edit content, manage media & assessments
          </p>
        </div>
        <Space>
          <Tag color="warning">Review</Tag>
          <Button>Save draft</Button>
          <Button type="primary">Submit for review</Button>
        </Space>
      </div>

      <Card>
        <Tabs
          items={[
            { key: "basic", label: "Basic", children: <div>Basic form…</div> },
            {
              key: "curriculum",
              label: "Curriculum",
              children: <div>Lessons builder…</div>,
            },
            {
              key: "media",
              label: "Media",
              children: <div>Videos/Files…</div>,
            },
            {
              key: "assess",
              label: "Assessments",
              children: <div>Quiz list…</div>,
            },
            {
              key: "flashcards",
              label: "Flashcards",
              children: <div>Flashcard set…</div>,
            },
            {
              key: "settings",
              label: "Settings",
              children: <div>Price, visibility…</div>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
