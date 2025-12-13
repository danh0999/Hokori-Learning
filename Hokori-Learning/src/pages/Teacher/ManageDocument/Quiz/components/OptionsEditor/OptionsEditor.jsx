import React, { memo, useCallback } from "react";
import { Button, Form, Input, Radio, Row, Col, Typography, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { newOption } from "../quizUtils/quizUtils.js";

const { Text } = Typography;

function ensureSingleCorrect(options) {
  const idxs = options
    .map((o, i) => (o.isCorrect ? i : -1))
    .filter((i) => i !== -1);
  if (idxs.length === 1) return options;
  if (idxs.length === 0 && options.length) {
    return options.map((o, i) => ({ ...o, isCorrect: i === 0 }));
  }
  const keep = idxs[0];
  return options.map((o, i) => ({ ...o, isCorrect: i === keep }));
}

function OptionsEditor({ q, onChange, styles }) {
  const updateOptions = useCallback(
    (nextOptions) => {
      const cleaned = ensureSingleCorrect(
        (nextOptions || []).map((o) => ({
          ...o,
          text: String(o.text || "").trim(),
          isCorrect: !!o.isCorrect,
        }))
      );
      onChange({ ...q, type: "SINGLE_CHOICE", points: 1, options: cleaned });
    },
    [q, onChange]
  );

  return (
    <Form.Item label="Phương án">
      <Space direction="vertical" style={{ width: "100%" }}>
        {(q.options || []).map((opt, idx) => (
          <Row key={opt.id} gutter={8} align="middle">
            <Col flex="24px" style={{ textAlign: "center" }}>
              <Radio
                checked={!!opt.isCorrect}
                onChange={() =>
                  updateOptions(
                    (q.options || []).map((o) => ({
                      ...o,
                      isCorrect: o.id === opt.id,
                    }))
                  )
                }
              />
            </Col>

            <Col flex="auto">
              <Input
                value={opt.text}
                placeholder={`Lựa chọn #${idx + 1}`}
                onChange={(e) => {
                  const next = [...(q.options || [])];
                  next[idx] = { ...opt, text: e.target.value };
                  updateOptions(next);
                }}
              />
            </Col>

            <Col>
              <Button
                danger
                onClick={() =>
                  updateOptions(
                    (q.options || []).filter((o) => o.id !== opt.id)
                  )
                }
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
              updateOptions([
                ...(q.options || []),
                { ...newOption(), isCorrect: false },
              ])
            }
          >
            Thêm lựa chọn
          </Button>
          <Text type="secondary">Chọn đáp án đúng bằng radio bên trái.</Text>
        </div>
      </Space>
    </Form.Item>
  );
}

export default memo(OptionsEditor);
