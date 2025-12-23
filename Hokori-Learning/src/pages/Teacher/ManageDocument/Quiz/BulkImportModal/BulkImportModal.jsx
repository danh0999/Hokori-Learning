// components/quiz/BulkImportModal.jsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  Upload,
  Typography,
  Space,
  Button,
  Alert,
  Row,
  Col,
  List,
  Tag,
  Divider,
  Form,
  Input,
  Select,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
  EditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import {
  parseQuestionsFromExcelArrayBuffer,
  downloadExcelTemplate,
  validateDraftToQuestion,
} from "../../../../../utils/parseQuizExcel.js";

const { Dragger } = Upload;
const { Text } = Typography;

export default function BulkImportModal({
  open,
  onCancel,
  onDone,
  mode = "QUIZ", // "QUIZ" | "JLPT"
  defaultQuestionType = "", // JLPT: activeTab (VOCAB/GRAMMAR/READING/LISTENING)
}) {
  const [fileName, setFileName] = useState("");
  const [readyQuestions, setReadyQuestions] = useState([]);
  const [needsFix, setNeedsFix] = useState([]);

  // Fix modal state
  const [fixOpen, setFixOpen] = useState(false);
  const [fixingItem, setFixingItem] = useState(null); // { rowNo, issues, draft }
  const [fixForm] = Form.useForm();

  const isJlpt = mode === "JLPT";

  const resetAll = () => {
    setFileName("");
    setReadyQuestions([]);
    setNeedsFix([]);
    setFixOpen(false);
    setFixingItem(null);
    fixForm.resetFields();
  };

  const beforeUpload = async (file) => {
    try {
      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      const res = parseQuestionsFromExcelArrayBuffer(buffer, {
        mode,
        defaultQuestionType,
      });

      setReadyQuestions(res.readyQuestions || []);
      setNeedsFix(res.needsFix || []);

      if (
        (res.readyQuestions || []).length > 0 &&
        (res.needsFix || []).length === 0
      ) {
        toast.success(`Đọc file OK: ${res.readyQuestions.length} câu hợp lệ.`);
      } else if (
        (res.readyQuestions || []).length > 0 &&
        (res.needsFix || []).length > 0
      ) {
        toast.warning(
          `Đọc file xong: ${res.readyQuestions.length} câu hợp lệ, ${res.needsFix.length} câu cần sửa.`
        );
      } else {
        toast.error("Không có câu hợp lệ. Hãy kiểm tra file Excel.");
      }
    } catch (e) {
      console.error(e);
      setReadyQuestions([]);
      setNeedsFix([
        { rowNo: 1, issues: ["Không đọc được file Excel."], draft: {} },
      ]);
      toast.error("Không đọc được file. Hãy thử .xlsx/.xls/.csv hợp lệ.");
    }
    return false; // chặn upload
  };

  const openFixModal = (item) => {
    setFixingItem(item);
    fixForm.setFieldsValue({
      rowNo: item.rowNo,
      questionType: item.draft?.questionType || defaultQuestionType || "",
      content: item.draft?.content || "",
      explanation: item.draft?.explanation || "",
      A: item.draft?.A || "",
      B: item.draft?.B || "",
      C: item.draft?.C || "",
      D: item.draft?.D || "",
      correct: item.draft?.correct || "",
      audioPath: item.draft?.audioPath || "",
      imagePath: item.draft?.imagePath || "",
      imageAltText: item.draft?.imageAltText || "",
    });
    setFixOpen(true);
  };

  const handleConfirmFix = async () => {
    try {
      const v = await fixForm.validateFields();

      const draft = {
        rowNo: v.rowNo,
        questionType: v.questionType,
        content: v.content,
        explanation: v.explanation,
        A: v.A,
        B: v.B,
        C: v.C,
        D: v.D,
        correct: v.correct,
        audioPath: v.audioPath,
        imagePath: v.imagePath,
        imageAltText: v.imageAltText,
      };

      const res = validateDraftToQuestion(draft, { mode, defaultQuestionType });

      if (!res.ok) {
        toast.error(`Câu dòng ${draft.rowNo} vẫn lỗi: ${res.issues[0]}`);
        // update issues UI
        setNeedsFix((prev) =>
          prev.map((x) =>
            x.rowNo === draft.rowNo ? { ...x, issues: res.issues, draft } : x
          )
        );
        return;
      }

      // Move to READY
      setReadyQuestions((prev) => [...prev, res.question]);

      // Remove from NEEDS FIX
      setNeedsFix((prev) => prev.filter((x) => x.rowNo !== draft.rowNo));

      toast.success(
        `Đã sửa & chuyển dòng ${draft.rowNo} sang danh sách hợp lệ.`
      );
      setFixOpen(false);
      setFixingItem(null);
      fixForm.resetFields();
    } catch (e) {
      console.log(e);

      // validateFields errors
    }
  };

  const handleFinalizeImport = () => {
    if (!readyQuestions.length) {
      toast.warning("Chưa có câu hợp lệ để import.");
      return;
    }
    onDone?.(readyQuestions);
    toast.success(`Import ${readyQuestions.length} câu thành công.`);
    resetAll();
  };

  const readySummary = useMemo(
    () => readyQuestions.length,
    [readyQuestions.length]
  );
  const fixSummary = useMemo(() => needsFix.length, [needsFix.length]);

  return (
    <>
      {/* Modal 1: REVIEW */}
      <Modal
        open={open}
        title="Bulk Import (Excel) – Xác minh trước khi thêm"
        onCancel={() => {
          resetAll();
          onCancel?.();
        }}
        okText="Thêm vào bài"
        onOk={handleFinalizeImport}
        okButtonProps={{ disabled: readyQuestions.length === 0 }}
        cancelText="Đóng"
        width={1100}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Alert
            type="info"
            showIcon
            message="Bước 1: Upload Excel → Bước 2: Sửa lỗi → Bước 3: Thêm vào bài"
            description={
              <div>
                <div>
                  Cột tối thiểu: <b>question</b>, <b>A</b>, <b>B</b>,{" "}
                  <b>correct</b>. Correct nhập <b>A-D</b> hoặc <b>1-4</b>.
                </div>
                {isJlpt && (
                  <div>
                    JLPT: có thể có <b>questionType</b>, nếu không có sẽ dùng
                    tab hiện tại: <b>{defaultQuestionType || "(chưa set)"}</b>.
                  </div>
                )}
              </div>
            }
          />

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadExcelTemplate("bulk-import-template.xlsx")}
            >
              Tải template
            </Button>
            <Text type="secondary">
              Mode: <b>{mode}</b>{" "}
              {isJlpt ? `(defaultType: ${defaultQuestionType})` : ""}
            </Text>
          </Space>

          <Dragger
            accept=".xlsx,.xls,.csv"
            multiple={false}
            showUploadList={false}
            beforeUpload={beforeUpload}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Kéo thả file Excel vào đây hoặc bấm để chọn file
            </p>
            <p className="ant-upload-hint">Hỗ trợ .xlsx/.xls/.csv</p>
          </Dragger>

          {!!fileName && (
            <Text>
              File: <b>{fileName}</b>
            </Text>
          )}

          <Divider />

          {/* Two columns: READY vs NEEDS FIX */}
          <Row gutter={16}>
            <Col span={12}>
              <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Text strong>
                  ✅ Câu hợp lệ (Ready) <Tag color="green">{readySummary}</Tag>
                </Text>
                <Text type="secondary">
                  Nhấn “Thêm vào bài” để đưa vào builder
                </Text>
              </Space>

              {readyQuestions.length === 0 ? (
                <Alert type="warning" showIcon message="Chưa có câu hợp lệ." />
              ) : (
                <List
                  size="small"
                  bordered
                  dataSource={readyQuestions}
                  renderItem={(q, idx) => (
                    <List.Item>
                      <div style={{ width: "100%" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text strong>#{idx + 1}</Text>
                          {isJlpt && q.questionType ? (
                            <Tag>{q.questionType}</Tag>
                          ) : null}
                        </div>
                        <div>
                          <Text>{q.text}</Text>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <Text type="secondary">
                            Options:{" "}
                            {(q.options || [])
                              .map((o) => o.text || "")
                              .join(" | ")}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Col>

            <Col span={12}>
              <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Text strong>
                  ⚠️ Câu cần sửa (Needs fix) <Tag color="red">{fixSummary}</Tag>
                </Text>
                <Text type="secondary">
                  Bấm “Sửa” → “Xác nhận” để chuyển sang Ready
                </Text>
              </Space>

              {needsFix.length === 0 ? (
                <Alert type="success" showIcon message="Không có câu lỗi 🎉" />
              ) : (
                <List
                  size="small"
                  bordered
                  dataSource={needsFix}
                  renderItem={(it) => (
                    <List.Item
                      actions={[
                        <Button
                          key="edit"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openFixModal(it)}
                        >
                          Sửa
                        </Button>,
                      ]}
                    >
                      <div style={{ width: "100%" }}>
                        <Text strong>Dòng {it.rowNo}</Text>
                        <div style={{ marginTop: 6 }}>
                          {(it.issues || []).slice(0, 3).map((x, i) => (
                            <div key={i}>
                              <Text type="danger">• {x}</Text>
                            </div>
                          ))}
                        </div>
                        {!!it.draft?.content && (
                          <div style={{ marginTop: 6 }}>
                            <Text type="secondary">{it.draft.content}</Text>
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Col>
          </Row>

          {needsFix.length > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="Bạn vẫn có thể import các câu hợp lệ"
              description="Các câu lỗi có thể sửa dần và chuyển sang Ready trước khi bấm Thêm vào bài."
            />
          )}
        </Space>
      </Modal>

      {/* Modal 2: FIX */}
      <Modal
        open={fixOpen}
        title={
          fixingItem ? `Sửa câu lỗi (dòng ${fixingItem.rowNo})` : "Sửa câu lỗi"
        }
        onCancel={() => {
          setFixOpen(false);
          setFixingItem(null);
          fixForm.resetFields();
        }}
        onOk={handleConfirmFix}
        okText="Xác nhận"
        cancelText="Hủy"
        width={820}
        destroyOnClose
      >
        {fixingItem?.issues?.length ? (
          <Alert
            type="error"
            showIcon
            message="Lỗi hiện tại"
            description={
              <div>
                {fixingItem.issues.map((x, i) => (
                  <div key={i}>• {x}</div>
                ))}
              </div>
            }
            style={{ marginBottom: 12 }}
          />
        ) : null}

        <Form form={fixForm} layout="vertical">
          <Form.Item name="rowNo" label="Row" hidden>
            <Input />
          </Form.Item>

          {isJlpt && (
            <Form.Item
              name="questionType"
              label="Question Type (JLPT)"
              rules={[{ required: true, message: "Chọn questionType" }]}
            >
              <Select
                options={["VOCAB", "GRAMMAR", "READING", "LISTENING"].map(
                  (x) => ({
                    label: x,
                    value: x,
                  })
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            name="content"
            label="Nội dung câu hỏi"
            rules={[{ required: true, message: "Nhập nội dung câu hỏi" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="explanation" label="Giải thích (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="A"
                label="Đáp án A"
                rules={[{ required: true, message: "Nhập đáp án A" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="B"
                label="Đáp án B"
                rules={[{ required: true, message: "Nhập đáp án B" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="C" label="Đáp án C (optional)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="D" label="Đáp án D (optional)">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="correct"
            label="Correct (A-D hoặc 1-4)"
            rules={[{ required: true, message: "Nhập correct (A-D hoặc 1-4)" }]}
          >
            <Input placeholder="Ví dụ: B hoặc 2" />
          </Form.Item>

          {/* JLPT có thể dùng audioPath, nhưng LISTENING vẫn sẽ bị page override theo audio đã upload */}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="audioPath" label="Audio path (optional)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imagePath" label="Image path (optional)">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imageAltText" label="Image alt text (optional)">
            <Input />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Lưu ý"
            description={
              isJlpt
                ? "Nếu bạn đang import LISTENING, audioPath sẽ được Builder gán theo audio đã upload của test."
                : "Quiz course chỉ cần question + options + correct."
            }
          />
        </Form>
      </Modal>
    </>
  );
}
