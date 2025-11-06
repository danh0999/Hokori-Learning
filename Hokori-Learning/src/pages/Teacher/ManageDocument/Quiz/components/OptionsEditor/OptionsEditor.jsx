// src/pages/Teacher/ManageDocument/Quiz/_shared/OptionsEditor.jsx
import React, { useMemo } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Row,
  Col,
  Typography,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { newOption } from "../quizUtils/quizUtils.js";

const { Text } = Typography;

export default function OptionsEditor({ q, onChange, styles }) {
  if (q.type === "fill") {
    return (
      <Form.Item label="Đáp án mẫu (có thể nhiều đáp án)">
        <Space direction="vertical" className={styles?.block}>
          {(q.answers || []).map((a, idx) => (
            <Space key={idx} align="baseline" className={styles?.fillRow}>
              <Input
                placeholder="Ví dụ: です / でした"
                value={a}
                onChange={(e) => {
                  const clone = [...q.answers];
                  clone[idx] = e.target.value;
                  onChange({ ...q, answers: clone });
                }}
              />
              <Button
                danger
                onClick={() => {
                  const clone = [...q.answers];
                  clone.splice(idx, 1);
                  onChange({ ...q, answers: clone });
                }}
              >
                Xoá
              </Button>
            </Space>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              onChange({ ...q, answers: [...(q.answers || []), ""] })
            }
          >
            Thêm đáp án mẫu
          </Button>
        </Space>
      </Form.Item>
    );
  }

  const isSingle = q.type === "single";
  const correctIds = useMemo(
    () => new Set(q.options.filter((o) => o.correct).map((o) => o.id)),
    [q.options]
  );

  return (
    <Form.Item label="Phương án">
      <Space direction="vertical" className={styles?.block}>
        {q.options.map((opt, idx) => (
          <Row
            key={opt.id}
            gutter={8}
            align="middle"
            className={styles?.optRow}
          >
            <Col flex="24px" style={{ textAlign: "center" }}>
              {isSingle ? (
                <Radio
                  checked={correctIds.has(opt.id)}
                  onChange={() =>
                    onChange({
                      ...q,
                      options: q.options.map((o) => ({
                        ...o,
                        correct: o.id === opt.id,
                      })),
                    })
                  }
                />
              ) : (
                <Checkbox
                  checked={!!opt.correct}
                  onChange={(e) => {
                    const next = [...q.options];
                    next[idx] = { ...opt, correct: e.target.checked };
                    onChange({ ...q, options: next });
                  }}
                />
              )}
            </Col>
            <Col flex="auto">
              <Input
                placeholder={`Lựa chọn #${idx + 1}`}
                value={opt.text}
                onChange={(e) => {
                  const next = [...q.options];
                  next[idx] = { ...opt, text: e.target.value };
                  onChange({ ...q, options: next });
                }}
              />
            </Col>
            <Col>
              <Button
                danger
                onClick={() => {
                  const next = q.options.filter((o) => o.id !== opt.id);
                  onChange({ ...q, options: next });
                }}
              >
                Xoá
              </Button>
            </Col>
          </Row>
        ))}

        <div className={styles?.optActions}>
          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              onChange({ ...q, options: [...q.options, newOption()] })
            }
          >
            Thêm lựa chọn
          </Button>
          <Text type="secondary">
            Đánh dấu đáp án đúng bằng {isSingle ? "radio" : "checkbox"} bên
            trái.
          </Text>
        </div>
      </Space>
    </Form.Item>
  );
}
