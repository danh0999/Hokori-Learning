// components/quiz/BulkImportModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Input,
  Upload,
  Typography,
  Space,
  Button,
  message,
} from "antd";
import { InboxOutlined, ScanOutlined } from "@ant-design/icons";
import { parseQuizFromText } from "../../../../../utils/parseQuizText.js"; // <- đảm bảo đường dẫn đúng alias của bạn

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

export default function BulkImportModal({ open, onCancel, onDone }) {
  const [raw, setRaw] = useState("");

  const handleParse = (text) => {
    try {
      const questions = parseQuizFromText(text || raw);
      if (!questions.length) {
        message.warning("Không nhận được câu hỏi nào. Kiểm tra định dạng nhé!");
        return;
      }
      onDone?.(questions);
    } catch (e) {
      console.error(e);
      message.error("Lỗi khi phân tích văn bản");
    }
  };

  const items = [
    {
      key: "paste",
      label: "Paste",
      children: (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">
            Dán đề A/B/C/D hoặc True/False. Nhấn “Parse & Add”.
          </Text>
          <TextArea
            rows={12}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <Button type="primary" onClick={() => handleParse()}>
            Phân tích và thêm
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="Bulk Import Questions"
      onCancel={onCancel}
      okButtonProps={{ style: { display: "none" } }}
      destroyOnClose
      width={820}
    >
      <Tabs items={items} />
    </Modal>
  );
}
