import React, { useState } from "react";
import { Card, Tabs, Form, Input, Button, Space, List, message } from "antd";
import { ThunderboltOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

export default function FlashcardPanel({ value = [], onChange }) {
  const [manual, setManual] = useState({ term: "", meaning: "", example: "" });
  const [loadingAI, setLoadingAI] = useState(false);

  const addManual = () => {
    if (!manual.term || !manual.meaning) return;
    onChange?.([...(value || []), { id: Date.now(), ...manual }]);
    setManual({ term: "", meaning: "", example: "" });
  };

  // Stub AI generation—hook your API later
  const generateAI = async () => {
    setLoadingAI(true);
    setTimeout(() => {
      const demo = [
        {
          id: Date.now(),
          term: "勉強 (べんきょう)",
          meaning: "study",
          example: "日本語を勉強します。",
        },
        {
          id: Date.now() + 1,
          term: "先生 (せんせい)",
          meaning: "teacher",
          example: "先生に質問します。",
        },
      ];
      onChange?.([...(value || []), ...demo]);
      setLoadingAI(false);
      message.success("Generated 2 flashcards");
    }, 800);
  };

  return (
    <Card className={styles.card}>
      <Tabs
        items={[
          {
            key: "ai",
            label: (
              <span>
                <ThunderboltOutlined /> Generate by AI
              </span>
            ),
            children: (
              <div className={styles.tabPane}>
                <Form layout="vertical">
                  <Form.Item label="Topic / Source text (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Paste lesson text or topic keywords…"
                    />
                  </Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      loading={loadingAI}
                      onClick={generateAI}
                    >
                      Generate
                    </Button>
                  </Space>
                </Form>
              </div>
            ),
          },
          {
            key: "manual",
            label: (
              <span>
                <PlusOutlined /> Add manually
              </span>
            ),
            children: (
              <div className={styles.tabPane}>
                <Space direction="vertical" className={styles.manualForm}>
                  <Input
                    placeholder="Term"
                    value={manual.term}
                    onChange={(e) =>
                      setManual({ ...manual, term: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Meaning"
                    value={manual.meaning}
                    onChange={(e) =>
                      setManual({ ...manual, meaning: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Example (optional)"
                    value={manual.example}
                    onChange={(e) =>
                      setManual({ ...manual, example: e.target.value })
                    }
                  />
                  <Button onClick={addManual} type="primary">
                    Add
                  </Button>
                </Space>
              </div>
            ),
          },
        ]}
      />

      <List
        header={<b>Flashcards ({value.length})</b>}
        dataSource={value}
        locale={{ emptyText: "No flashcards yet" }}
        renderItem={(fc) => (
          <List.Item className={styles.fcItem}>
            <div className={styles.term}>{fc.term}</div>
            <div className={styles.meaning}>{fc.meaning}</div>
            {fc.example && <div className={styles.example}>{fc.example}</div>}
          </List.Item>
        )}
      />
    </Card>
  );
}
