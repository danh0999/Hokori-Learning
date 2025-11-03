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
  const [ocring, setOcring] = useState(false);

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

  const doOCR = async (file) => {
    setOcring(true);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const res = await Tesseract.recognize(file, "eng");
      const text = res.data.text || "";
      setRaw(text);
      message.success("OCR hoàn tất! Kiểm tra tab Paste để xem & chỉnh.");
    } catch (e) {
      console.error(e);
      message.error("OCR thất bại");
    } finally {
      setOcring(false);
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
            Parse & Add
          </Button>
        </Space>
      ),
    },
    {
      key: "txt",
      label: ".txt",
      children: (
        <Dragger
          accept=".txt"
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = String(e.target.result || "");
              setRaw(text);
              message.success("Đã đọc file .txt, chuyển qua tab Paste để xem.");
            };
            reader.readAsText(file);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả hoặc chọn file .txt</p>
        </Dragger>
      ),
    },
    {
      key: "image",
      label: "Image OCR",
      children: (
        <Dragger
          accept="image/*"
          disabled={ocring}
          beforeUpload={(file) => {
            doOCR(file);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <ScanOutlined />
          </p>
          <p className="ant-upload-text">
            Kéo thả ảnh đề (JPG/PNG). Hệ thống sẽ OCR → tab Paste.
          </p>
          {ocring && <Text type="secondary">Đang OCR…</Text>}
        </Dragger>
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
