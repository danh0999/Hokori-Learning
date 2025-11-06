// src/pages/Teacher/ManageDocument/Quiz/_shared/QuestionCard.jsx
import React from "react";
import {
  Button,
  Card,
  Collapse,
  Col,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import OptionsEditor from "../OptionsEditor/OptionsEditor.jsx";
import { newQuestion } from "../quizUtils/quizUtils.js";
import styles from "./styles.module.scss";
const { Text } = Typography;

export default function QuestionCard({
  q,
  idx,
  total,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}) {
  const items = [
    {
      key: q.id,
      label: (
        <Space>
          <Tag color="blue">Q{idx + 1}</Tag>
          <Text strong className={styles?.qTitlePreview}>
            {q.text?.trim() || "Câu hỏi chưa có nội dung"}
          </Text>
          <Text type="secondary">· {q.points} pt</Text>
          <Tag>{q.type}</Tag>
        </Space>
      ),
      children: (
        <div className={styles?.qBody}>
          <Row gutter={16}>
            <Col span={16}>
              <Form layout="vertical">
                <Form.Item label="Nội dung câu hỏi">
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder="Nhập nội dung câu hỏi…"
                    value={q.text}
                    onChange={(e) => onChange({ ...q, text: e.target.value })}
                  />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="Loại câu hỏi">
                      <Select
                        value={q.type}
                        onChange={(type) => {
                          // giữ text/points, chỉ reset phần cấu trúc theo type mới
                          const next = newQuestion(type);
                          onChange({
                            ...next,
                            id: q.id,
                            text: q.text,
                            points: q.points,
                          });
                        }}
                        options={[
                          { value: "single", label: "Single choice" },
                          { value: "multiple", label: "Multiple choice" },
                          { value: "truefalse", label: "True / False" },
                          { value: "fill", label: "Fill in the blank" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Điểm">
                      <InputNumber
                        min={0}
                        value={q.points}
                        onChange={(v) => onChange({ ...q, points: v ?? 0 })}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <OptionsEditor q={q} onChange={onChange} styles={styles} />

                <Form.Item label="Giải thích (hiển thị sau khi nộp)">
                  <Input.TextArea
                    placeholder="Giải thích đáp án / mẹo ghi nhớ…"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={q.explanation}
                    onChange={(e) =>
                      onChange({ ...q, explanation: e.target.value })
                    }
                  />
                </Form.Item>
              </Form>
            </Col>

            <Col span={8}>
              <Card size="small" className={styles?.sideCard}>
                <Space
                  direction="vertical"
                  className={styles?.block}
                  size="middle"
                >
                  <Text strong>Thao tác</Text>
                  <Space wrap>
                    <Button icon={<CopyOutlined />} onClick={onDuplicate}>
                      Duplicate
                    </Button>
                    <Button
                      icon={<ArrowUpOutlined />}
                      disabled={idx === 0}
                      onClick={() => onMove("up")}
                    />
                    <Button
                      icon={<ArrowDownOutlined />}
                      disabled={idx === total - 1}
                      onClick={() => onMove("down")}
                    />
                    <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                      Delete
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <Collapse
      items={items}
      defaultActiveKey={[q.id]}
      className={styles.qCollapse} // <-- thêm class
    />
  );
}
