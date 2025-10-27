// src/pages/Teacher/Courses/Create-Course/PricingStep.jsx
import React from "react";
import { Card, Form, Input } from "antd";
import styles from "./styles.module.scss";

export default function PricingStep({ price, setPrice }) {
  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Pricing</div>
        <div className={styles.stepDesc}>
          Set your base course price. You can run promotions later.
        </div>
      </div>

      <Form layout="vertical" className={styles.formGrid}>
        <Form.Item label="Price (VND)">
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Form.Item>

        <div className={styles.hintText}>
          Tip: 199k–399k works well for entry-level JLPT prep courses.
        </div>
      </Form>
    </Card>
  );
}
