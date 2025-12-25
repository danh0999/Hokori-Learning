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
} from "@ant-design/icons";
import { toast } from "react-toastify";
import {
  parseQuestionsFromExcelArrayBuffer,
  downloadExcelTemplate,
  validateDraftToQuestion,
  parseCorrect,
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
  const [importing, setImporting] = useState(false);

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
    return false; // block upload
  };

  const openFixModal = (item) => {
    setFixingItem(item);

    const fallbackOptions =
      item.draft?.options?.length >= 2
        ? item.draft.options
        : [
            { id: crypto.randomUUID(), key: "A", text: "" },
            { id: crypto.randomUUID(), key: "B", text: "" },
          ];

    fixForm.setFieldsValue({
      rowNo: item.rowNo,
      content: item.draft?.content || "",
      explanation: item.draft?.explanation || "",
      options: fallbackOptions.map((o, idx) => ({
        id: o.id || crypto.randomUUID(),
        key: o.key || String.fromCharCode(65 + idx),
        text: o.text || "",
      })),
      correctIndex: Number.isFinite(item.draft?.correctIndex)
        ? Number(item.draft.correctIndex)
        : null,
    });

    setFixOpen(true);
  };

  const handleConfirmFix = async () => {
    try {
      const v = await fixForm.validateFields();
      const correctIndexFromForm = fixForm.getFieldValue("correctIndex");

      // allow number or letter
      let correctIndexNum = null;
      if (correctIndexFromForm !== null && correctIndexFromForm !== undefined) {
        const n = Number(correctIndexFromForm);
        if (Number.isFinite(n)) correctIndexNum = n;
        else {
          const idxFromLetter = parseCorrect(correctIndexFromForm);
          correctIndexNum = Number.isFinite(idxFromLetter)
            ? idxFromLetter
            : null;
        }
      }

      if (
        Number.isFinite(correctIndexNum) &&
        correctIndexNum >= (v.options || []).length
      ) {
        toast.error("Đáp án đúng không hợp lệ. Vui lòng chọn lại.");
        return;
      }

      const draft = {
        rowNo: v.rowNo,
        content: v.content,
        explanation: v.explanation,
        options: (v.options || []).map((o, idx) => ({
          id: o.id || crypto.randomUUID(),
          key: o.key || String.fromCharCode(65 + idx),
          text: o.text,
        })),
        correctIndex: Number.isFinite(correctIndexNum) ? correctIndexNum : null,
        correct: "", // rely on correctIndex
      };

      const res = validateDraftToQuestion(draft, { mode, defaultQuestionType });

      if (!res.ok) {
        toast.error(`Câu dòng ${draft.rowNo} vẫn lỗi: ${res.issues[0]}`);
        setNeedsFix((prev) =>
          prev.map((x) =>
            x.rowNo === draft.rowNo ? { ...x, issues: res.issues, draft } : x
          )
        );
        return;
      }

      setReadyQuestions((prev) => [...prev, res.question]);
      setNeedsFix((prev) => prev.filter((x) => x.rowNo !== draft.rowNo));

      toast.success(
        `Đã sửa & chuyển dòng ${draft.rowNo} sang danh sách hợp lệ.`
      );
      setFixOpen(false);
      setFixingItem(null);
      fixForm.resetFields();
    } catch (e) {
      // antd validateFields throws object; ignore
      console.log(e);
    }
  };

  const handleFinalizeImport = async () => {
    if (!readyQuestions.length) {
      toast.warning("Chưa có câu hợp lệ để import.");
      return;
    }

    try {
      setImporting(true);

      // ✅ QUAN TRỌNG: await để đảm bảo parent build xong question/options rồi mới đóng
      await Promise.resolve(onDone?.(readyQuestions));

      toast.success(`Import ${readyQuestions.length} câu thành công.`);
      resetAll();

      // Nếu parent điều khiển open bằng state, onDone xong parent nên setOpen(false).
      // Nhưng để chắc chắn UX, mình gọi luôn onCancel nếu có.
      onCancel?.();
    } catch (e) {
      console.error(e);
      toast.error("Import thất bại. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  const readySummary = useMemo(
    () => readyQuestions.length,
    [readyQuestions.length]
  );
  const fixSummary = useMemo(() => needsFix.length, [needsFix.length]);

  const renderCorrectLine = (q) => {
    const opts = q?.options || [];
    const idx = opts.findIndex((o) => o?.isCorrect);
    if (idx < 0) return <Text type="secondary">✅ Đáp án đúng: -</Text>;

    const label = String.fromCharCode(65 + idx);
    const text = opts[idx]?.text || "";
    return (
      <Text strong>
        ✅ Đáp án đúng: {label}
        {text ? ` – ${text}` : ""}
      </Text>
    );
  };

  return (
    <>
      {/* Modal 1: REVIEW */}
      <Modal
        open={open}
        title="Nhập từ Excel – Xác minh trước khi thêm"
        onCancel={() => {
          if (importing) return; // ✅ chặn
          resetAll();
          onCancel?.();
        }}
        okText="Thêm vào bài"
        onOk={handleFinalizeImport}
        okButtonProps={{
          disabled: readyQuestions.length === 0,
          loading: importing, // ✅ spinner trên nút
        }}
        cancelButtonProps={{ disabled: importing }} // ✅ khóa nút Đóng
        cancelText="Đóng"
        width={1100}
        destroyOnClose
        maskClosable={!importing} // ✅ không click ra ngoài để đóng
        keyboard={!importing} // ✅ không ESC để đóng
        closable={!importing} // ✅ khóa nút X
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
                  <b>correct</b>. Correct nhập <b>A-Z</b> hoặc <b>1-99</b>.
                </div>
                <div>
                  Options có thể linh hoạt (A,B,C,D... hoặc thêm E,F...). Cần ít
                  nhất 2 đáp án có nội dung.
                </div>
                <div>
                  ✅ File Excel <b>KHÔNG dùng</b> các cột: questionType,
                  audioPath, imagePath, imageAltText.
                </div>
                {isJlpt && (
                  <div>
                    JLPT: <b>questionType luôn lấy theo tab đang mở</b>:{" "}
                    <b>{defaultQuestionType || "(chưa set)"}</b>.
                  </div>
                )}
              </div>
            }
          />

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadExcelTemplate("mau-nhap-cau-hoi.xlsx")}
            >
              Tải mẫu Excel
            </Button>
            <Text type="secondary">
              Mode: <b>{mode}</b>{" "}
              {isJlpt ? `(Tab: ${defaultQuestionType || "?"})` : ""}
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

          <Row gutter={16}>
            <Col span={12}>
              <Space
                align="center"
                style={{ width: "100%", justifyContent: "space-between" }}
              >
                <Text strong>
                  ✅ Câu hợp lệ <Tag color="green">{readySummary}</Tag>
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
                            Đáp án:{" "}
                            {(q.options || [])
                              .map((o) => o.text || "")
                              .join(" | ")}
                          </Text>
                        </div>

                        <div style={{ marginTop: 6 }}>
                          {renderCorrectLine(q)}
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
                  ⚠️ Câu cần sửa <Tag color="red">{fixSummary}</Tag>
                </Text>
                <Text type="secondary">
                  Bấm “Sửa” → “Xác nhận” để chuyển sang hợp lệ
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
                          {(it.issues || []).slice(0, 4).map((x, i) => (
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
              description="Các câu lỗi có thể sửa dần và chuyển sang danh sách hợp lệ trước khi bấm Thêm vào bài."
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
        width={860}
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
          <Form.Item name="rowNo" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="content"
            label="Câu hỏi"
            rules={[{ required: true, message: "Nhập nội dung câu hỏi" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="explanation" label="Giải thích">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <Text strong>Đáp án</Text>

                {fields.map((field, idx) => (
                  <Row
                    key={field.key}
                    gutter={8}
                    align="middle"
                    style={{ marginTop: 8 }}
                  >
                    <Col flex="auto">
                      <Form.Item
                        {...field}
                        name={[field.name, "text"]}
                        rules={[
                          { required: true, message: "Nhập nội dung đáp án" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder={`Đáp án ${String.fromCharCode(
                            65 + idx
                          )}`}
                        />
                      </Form.Item>
                    </Col>

                    <Col>
                      <Button
                        danger
                        onClick={() => remove(field.name)}
                        disabled={fields.length <= 2}
                      >
                        Xóa
                      </Button>
                    </Col>
                  </Row>
                ))}

                <div style={{ marginTop: 10 }}>
                  <Button
                    onClick={() =>
                      add({ id: crypto.randomUUID(), key: "", text: "" })
                    }
                  >
                    + Thêm đáp án
                  </Button>
                </div>

                <Divider style={{ margin: "12px 0" }} />
              </>
            )}
          </Form.List>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const opts = fixForm.getFieldValue("options") || [];
              const selectOptions = opts.map((_, idx) => ({
                label: String.fromCharCode(65 + idx),
                value: idx,
              }));

              return (
                <Form.Item
                  name="correctIndex"
                  label="Đáp án đúng"
                  rules={[{ required: true, message: "Chọn đáp án đúng" }]}
                  normalize={(val) =>
                    val === null || val === undefined ? null : Number(val)
                  }
                >
                  <Select
                    placeholder="Chọn đáp án đúng (A/B/C/...)"
                    options={selectOptions}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Lưu ý"
            description={
              isJlpt
                ? `JLPT: questionType luôn lấy theo tab hiện tại: ${
                    defaultQuestionType || "?"
                  }.`
                : "Options linh hoạt (A,B,C,D... hoặc thêm E,F...), chọn đáp án đúng bằng dropdown."
            }
          />
        </Form>
      </Modal>
    </>
  );
}
