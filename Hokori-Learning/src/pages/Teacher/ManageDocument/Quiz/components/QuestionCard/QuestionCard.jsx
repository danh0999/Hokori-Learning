import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Collapse,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import debounce from "lodash.debounce";

import OptionsEditor from "../OptionsEditor/OptionsEditor.jsx";
import styles from "./styles.module.scss";

const { Text } = Typography;

function QuestionCard({
  q,
  idx = 0,
  total = 1,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}) {
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q.id]);

  const commitChange = useMemo(
    () =>
      debounce((next) => {
        onChange(next);
      }, 250),
    [onChange]
  );

  const updateLocal = useCallback(
    (patch) => {
      setLocalQ((prev) => {
        const next = { ...prev, ...patch, type: "SINGLE_CHOICE", points: 1 };
        commitChange(next);
        return next;
      });
    },
    [commitChange]
  );

  const items = useMemo(
    () => [
      {
        key: localQ.id,
        label: (
          <Space>
            <Tag color="blue">Q{idx + 1}</Tag>
            <Text strong className={styles.qTitlePreview}>
              {localQ.text?.trim() || "Câu hỏi chưa có nội dung"}
            </Text>
            <Text type="secondary">· 1 pt</Text>
            <Tag>SINGLE</Tag>
          </Space>
        ),
        children: (
          <div className={styles.qBody}>
            <Row gutter={16}>
              <Col span={16}>
                <Form layout="vertical">
                  <Form.Item label="Nội dung câu hỏi">
                    <Input.TextArea
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      value={localQ.text}
                      onChange={(e) => updateLocal({ text: e.target.value })}
                    />
                  </Form.Item>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label="Loại câu hỏi">
                        <Input disabled value="Single choice" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Điểm">
                        <InputNumber
                          disabled
                          value={1}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <OptionsEditor
                    q={localQ}
                    onChange={(next) => updateLocal(next)}
                    styles={styles}
                  />

                  <Form.Item label="Giải thích (hiển thị sau khi nộp)">
                    <Input.TextArea
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      value={localQ.explanation}
                      onChange={(e) =>
                        updateLocal({ explanation: e.target.value })
                      }
                    />
                  </Form.Item>
                </Form>
              </Col>

              <Col span={8}>
                <Card size="small" className={styles.sideCard}>
                  <Space direction="vertical" size="middle">
                    <Text strong>Thao tác</Text>
                    <Space wrap>
                      <Button icon={<CopyOutlined />} onClick={onDuplicate}>
                        Duplicate
                      </Button>
                      <Button
                        icon={<ArrowUpOutlined />}
                        disabled={idx === 0}
                        onClick={() => onMove?.("up")}
                      />
                      <Button
                        icon={<ArrowDownOutlined />}
                        disabled={idx === total - 1}
                        onClick={() => onMove?.("down")}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                      >
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
    ],
    [localQ, idx, total, onDuplicate, onDelete, onMove, updateLocal]
  );

  return (
    <Collapse
      items={items}
      defaultActiveKey={[localQ.id]}
      className={styles.qCollapse}
    />
  );
}

export default memo(QuestionCard);
