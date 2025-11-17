// src/pages/Teacher/ManageDocument/Flashcard/FlashcardBuilderModal.jsx
import React, { useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  List,
  Space,
  Typography,
  Divider,
  message,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSetBySectionContent,
  fetchCardsBySetId,
  addFlashcardToSet,
} from "../../../../redux/features/flashcardSlice.js"; // ⚠ chỉnh path tuỳ dự án

const { Text } = Typography;

/**
 * Props gợi ý:
 * - open: boolean
 * - onCancel: () => void
 * - sectionContentId: number  (content FLASHCARD_SET của section VOCABULARY)
 * - flashcardSet: currentSet (có thể null lần đầu) – truyền từ VocabFlashcardTab
 * - onSaved?: () => void
 */
export default function FlashcardBuilderModal({
  open,
  onCancel,
  sectionContentId,
  flashcardSet,
  onSaved,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { currentSet, cards, loadingSet, loadingCards, saving } = useSelector(
    (state) => state.flashcard || {}
  );

  // Ưu tiên dùng flashcardSet từ props, fallback sang currentSet trong store
  const effectiveSet = flashcardSet || currentSet;

  // Khi modal mở:
  // 1. Nếu chưa có set mà có sectionContentId -> fetch set
  useEffect(() => {
    if (open && sectionContentId && !effectiveSet) {
      dispatch(fetchSetBySectionContent(sectionContentId));
    }
  }, [open, sectionContentId, effectiveSet, dispatch]);

  // 2. Khi đã có set -> load cards
  useEffect(() => {
    if (open && effectiveSet?.id) {
      dispatch(fetchCardsBySetId(effectiveSet.id));
    }
  }, [open, effectiveSet?.id, dispatch]);

  const handleAddCard = async () => {
    const values = await form.validateFields();

    if (!effectiveSet?.id) {
      message.error("Chưa có flashcard set.");
      return;
    }

    const payloadCard = {
      frontText: values.front,
      backText: values.back,
      reading: values.reading || "",
      exampleSentence: values.exampleSentence || "",
      orderIndex: cards?.length || 0, // cho BE biết thứ tự
    };

    const action = await dispatch(
      addFlashcardToSet({ setId: effectiveSet.id, card: payloadCard })
    );

    if (addFlashcardToSet.fulfilled.match(action)) {
      message.success("Đã thêm flashcard.");
      form.resetFields();
      onSaved?.();
    } else {
      message.error("Không thêm được flashcard.");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={`Flashcards – ${effectiveSet?.title || "Vocabulary"}`}
      width={720}
      footer={null}
      destroyOnClose={false}
    >
      <Spin spinning={loadingSet && !effectiveSet}>
        <Text>
          Đây là bộ flashcard cho phần <b>Vocabulary</b> của lesson. Bạn có thể
          thêm từ vựng, cách đọc và câu ví dụ.
        </Text>

        <Divider />

        {/* FORM THÊM CARD */}
        <Form layout="vertical" form={form}>
          <Form.Item
            name="front"
            label="Front (mặt trước)"
            rules={[{ required: true, message: "Vui lòng nhập mặt trước." }]}
          >
            <Input placeholder="Từ vựng / Kanji" />
          </Form.Item>

          <Form.Item
            name="back"
            label="Back (mặt sau)"
            rules={[{ required: true, message: "Vui lòng nhập mặt sau." }]}
          >
            <Input placeholder="Nghĩa hoặc giải thích" />
          </Form.Item>

          <Form.Item name="reading" label="Reading (cách đọc, optional)">
            <Input placeholder="Ví dụ: にほんご / にっぽん" />
          </Form.Item>

          <Form.Item
            name="exampleSentence"
            label="Example sentence (câu ví dụ, optional)"
          >
            <Input placeholder="Ví dụ: 日本語を勉強しています。" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddCard}
              loading={saving}
              disabled={!effectiveSet}
            >
              Add flashcard
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        {/* DANH SÁCH CARDS */}
        <List
          bordered
          size="small"
          loading={loadingCards}
          dataSource={cards || []}
          locale={{ emptyText: "Chưa có flashcard nào." }}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {index + 1}. {item.frontText}
                    </Text>
                    {item.reading && (
                      <Text type="secondary">({item.reading})</Text>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div>
                      <Text type="secondary">Back: </Text>
                      {item.backText || "(empty)"}
                    </div>
                    {item.exampleSentence && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">Example: </Text>
                        {item.exampleSentence}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
}
