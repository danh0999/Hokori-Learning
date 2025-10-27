// src/pages/Teacher/Courses/Create-Course/PublishStep.jsx
import React from "react";
import { Card, Button } from "antd";
import styles from "./styles.module.scss";

export default function PublishStep({
  courseBasics,
  sections,
  price,
  canPublish,
  onSubmit,
}) {
  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Review & Submit</div>
        <div className={styles.stepDesc}>
          Check everything before submitting for review.
        </div>
      </div>

      <div className={styles.reviewBlock}>
        <div className={styles.row}>
          <div className={styles.label}>Title</div>
          <div className={styles.value}>{courseBasics.title || "—"}</div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Description</div>
          <div className={styles.value}>{courseBasics.description || "—"}</div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Category / Level</div>
          <div className={styles.value}>
            {courseBasics.category} · {courseBasics.level}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Language</div>
          <div className={styles.value}>{courseBasics.language}</div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Thumbnail</div>
          <div className={styles.value}>
            {courseBasics.thumbnailUrl ? (
              <img
                src={courseBasics.thumbnailUrl}
                alt="thumb"
                className={styles.thumbPreviewSmall}
              />
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Sections / Lessons</div>
          <div className={styles.value}>
            {sections.length} section(s),{" "}
            {sections.reduce((acc, s) => acc + s.lessons.length, 0)} lesson(s)
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Price</div>
          <div className={styles.value}>
            {price ? `${price} VND` : "Free / not set"}
          </div>
        </div>
      </div>

      {!canPublish && (
        <div className={styles.warningBox}>
          Please fill title, description, thumbnail, and add at least one
          lesson.
        </div>
      )}

      <Button type="primary" disabled={!canPublish} onClick={onSubmit}>
        Submit for review
      </Button>
    </Card>
  );
}
