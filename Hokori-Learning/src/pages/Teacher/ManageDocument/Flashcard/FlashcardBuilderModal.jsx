// FlashcardBuilderModal.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  Popconfirm,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSetBySectionContent,
  fetchCardsBySetId,
  addFlashcardToSet,
  updateFlashcardCard,
  deleteFlashcardCard,
} from "../../../../redux/features/flashcardSlice";

import styles from "./styles.module.scss";

const { Text, Title } = Typography;

export default function FlashcardBuilderModal({
  open,
  onCancel,
  sectionContentId,
  flashcardSet,
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { currentSet, cards, loadingSet, loadingCards, saving } = useSelector(
    (state) => state.flashcardTeacher || state.flashcard
  );

  const effectiveSet = useMemo(
    () => flashcardSet || currentSet,
    [flashcardSet, currentSet]
  );

  const [editingCard, setEditingCard] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Nếu mở modal mà không truyền sẵn set, thì fetch theo sectionContentId (flow cũ)
  useEffect(() => {
    if (open && sectionContentId && !flashcardSet && !effectiveSet) {
      dispatch(fetchSetBySectionContent(sectionContentId));
    }
  }, [open, sectionContentId, flashcardSet, effectiveSet, dispatch]);

  // Khi đã có set (từ prop hoặc từ redux) thì fetch cards
  useEffect(() => {
    if (open && effectiveSet?.id) {
      dispatch(fetchCardsBySetId(effectiveSet.id));
    }
  }, [open, effectiveSet?.id, dispatch]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      editForm.resetFields();
      setEditingCard(null);
      setEditModalOpen(false);
    }
  }, [open, form, editForm]);

  const totalCards = cards?.length || 0;

  /* ADD CARD */
  const handleAddCard = async () => {
    const values = await form.validateFields();
    if (!effectiveSet?.id) return;

    const payload = {
      frontText: values.front,
      backText: values.back,
      reading: values.reading || "",
      exampleSentence: values.exampleSentence || "",
      orderIndex: totalCards,
    };

    const action = await dispatch(
      addFlashcardToSet({ setId: effectiveSet.id, card: payload })
    );

    if (addFlashcardToSet.fulfilled.match(action)) {
      message.success("Đã thêm flashcard.");
      form.resetFields();
    } else {
      message.error("Không thể thêm.");
    }
  };

  /* EDIT MODAL */
  const openEditModal = (card) => {
    setEditingCard(card);
    editForm.setFieldsValue({
      front: card.frontText,
      back: card.backText,
      reading: card.reading,
      exampleSentence: card.exampleSentence,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const values = await editForm.validateFields();
    const payload = {
      frontText: values.front,
      backText: values.back,
      reading: values.reading,
      exampleSentence: values.exampleSentence,
      orderIndex: editingCard.orderIndex,
    };

    const action = await dispatch(
      updateFlashcardCard({
        setId: effectiveSet.id,
        cardId: editingCard.id,
        card: payload,
      })
    );

    if (updateFlashcardCard.fulfilled.match(action)) {
      message.success("Đã cập nhật.");
      setEditModalOpen(false);
    } else {
      message.error("Không thể cập nhật.");
    }
  };

  const handleDeleteCard = async (card) => {
    const action = await dispatch(
      deleteFlashcardCard({ setId: effectiveSet.id, cardId: card.id })
    );
    if (deleteFlashcardCard.fulfilled.match(action)) {
      message.success("Đã xóa.");
    } else {
      message.error("Không thể xóa.");
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={900}
        title={null}
        destroyOnClose={false}
      >
        <Spin spinning={loadingSet && !effectiveSet}>
          <div className={styles.header}>
            <div>
              <Title level={4} className={styles.title}>
                {effectiveSet?.title || "Flashcards – Từ vựng"}
              </Title>
              <Text type="secondary">
                Đây là bộ flashcard của lesson Vocabulary.
              </Text>
            </div>
          </div>

          <Divider />

          {/* Form thêm card */}
          <div className={styles.addBox}>
            <Text strong className={styles.addLabel}>
              Thêm flashcard mới
            </Text>

            <Form form={form} layout="vertical">
              <div className={styles.row}>
                <Form.Item
                  name="front"
                  label="Front"
                  rules={[{ required: true }]}
                  className={styles.half}
                >
                  <Input placeholder="Từ vựng / Kanji" />
                </Form.Item>

                <Form.Item
                  name="back"
                  label="Back"
                  rules={[{ required: true }]}
                  className={styles.half}
                >
                  <Input placeholder="Nghĩa hoặc giải thích" />
                </Form.Item>
              </div>

              <div className={styles.row}>
                <Form.Item
                  name="reading"
                  label="Reading"
                  className={styles.half}
                >
                  <Input placeholder="Cách đọc" />
                </Form.Item>

                <Form.Item
                  name="exampleSentence"
                  label="Example sentence"
                  className={styles.half}
                >
                  <Input placeholder="Câu ví dụ" />
                </Form.Item>
              </div>

              <div className={styles.addBtnRow}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddCard}
                >
                  Thêm flashcard
                </Button>
              </div>
            </Form>
          </div>

          <Divider />

          {/* Card list */}
          <div className={styles.listHeader}>
            <Text strong>Danh sách flashcards</Text>
            <Text type="secondary">
              ({totalCards === 0 ? "Chưa có thẻ nào" : `${totalCards} thẻ`})
            </Text>
          </div>

          <Spin spinning={loadingCards}>
            {totalCards === 0 ? (
              <div className={styles.empty}>Chưa có flashcard nào.</div>
            ) : (
              <List
                grid={{ gutter: 12, column: 2 }}
                dataSource={cards}
                renderItem={(card, index) => (
                  <List.Item>
                    <div className={styles.cardItem}>
                      <div>
                        <Space className={styles.cardFrontRow}>
                          <Text type="secondary" strong>
                            {index + 1}.
                          </Text>
                          <Text strong>{card.frontText}</Text>
                          {card.reading && (
                            <Text type="secondary">({card.reading})</Text>
                          )}
                        </Space>

                        <div className={styles.cardBack}>
                          <Text type="secondary">Nghĩa: </Text>
                          {card.backText}
                        </div>

                        {card.exampleSentence && (
                          <div className={styles.cardExample}>
                            <Text type="secondary">Ví dụ: </Text>{" "}
                            {card.exampleSentence}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardActions}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(card)}
                        />

                        <Popconfirm
                          title="Bạn có chắc muốn xóa?"
                          okText="Xóa"
                          cancelText="Hủy"
                          okType="danger"
                          onConfirm={() => handleDeleteCard(card)}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Spin>

          <div className={styles.footer}>
            <Button onClick={onCancel}>Hoàn tất</Button>
          </div>
        </Spin>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSaveEdit}
        okText="Lưu"
        confirmLoading={saving}
        title="Chỉnh sửa flashcard"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="front" label="Front" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="back" label="Back" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="reading" label="Reading">
            <Input />
          </Form.Item>

          <Form.Item name="exampleSentence" label="Example sentence">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
