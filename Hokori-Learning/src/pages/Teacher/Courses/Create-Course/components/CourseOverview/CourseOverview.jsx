// src/pages/Teacher/Courses/Create-Course/CourseOverview.jsx
import React from "react";
import { Card, Form, Input, Select, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

export default function CourseOverview({ value, onChange }) {
  const {
    title,
    subtitle,
    description,
    category,
    level,
    language,
    thumbnailUrl,
  } = value || {};

  const update = (patch) => {
    onChange?.({ ...value, ...patch });
  };

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Course Basics</div>
        <div className={styles.stepDesc}>
          This is what students see on the course page. Make it attractive and
          clear.
        </div>
      </div>

      <Form layout="vertical" className={styles.formGrid}>
        <Form.Item label="Course title" required>
          <Input
            placeholder="JLPT N5 Grammar Basics"
            value={title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </Form.Item>

        <Form.Item label="Short subtitle / headline">
          <Input
            placeholder="Master core N5 grammar in simple Vietnamese"
            value={subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
        </Form.Item>

        <Form.Item label="Description" required>
          <Input.TextArea
            rows={6}
            placeholder="What will students learn? Who is this course for?"
            value={description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Form.Item>

        <div className={styles.row2}>
          <Form.Item label="Category">
            <Select
              value={category}
              onChange={(v) => update({ category: v })}
              options={[
                { value: "JLPT N5", label: "JLPT N5" },
                { value: "JLPT N3 Listening", label: "JLPT N3 Listening" },
                { value: "Pronunciation", label: "Pronunciation" },
                { value: "Business Japanese", label: "Business Japanese" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Level">
            <Select
              value={level}
              onChange={(v) => update({ level: v })}
              options={[
                { value: "Beginner", label: "Beginner (N5~N4)" },
                { value: "Intermediate", label: "Intermediate (N3~N2)" },
                { value: "Advanced", label: "Advanced (N1/business)" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Language">
            <Select
              value={language}
              onChange={(v) => update({ language: v })}
              options={[
                { value: "Japanese", label: "Japanese" },
                { value: "Vietnamese", label: "Vietnamese" },
                { value: "English", label: "English" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item label="Thumbnail (preview image)" required>
          <div className={styles.thumbRow}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="thumb"
                className={styles.thumbPreview}
              />
            ) : (
              <div className={styles.thumbPlaceholder}>No thumbnail yet</div>
            )}

            <Upload
              beforeUpload={(file) => {
                const url = URL.createObjectURL(file);
                update({ thumbnailUrl: url });
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload thumbnail</Button>
            </Upload>
          </div>

          <div className={styles.hintText}>
            Recommended 1280x720, under 2MB.
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
}
