// FlashcardList.jsx – ưu tiên state Redux, không phụ thuộc sectionContentId khi đã có set

import React, { useEffect } from "react";
import {
  List,
  Card,
  Typography,
  Button,
  Popconfirm,
  Space,
  Spin,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSetBySectionContent,
  fetchCardsBySetId,
  deleteFlashcardSet,
  deleteFlashcardCard,
} from "../../../../../redux/features/flashcardSlice.js";

import styles from "./styles.module.scss";

const { Title, Text } = Typography;

export default function FlashcardList({ sectionContentId, onEditSet }) {
  const dispatch = useDispatch();

  const { currentSet, cards, loadingSet, loadingCards, saving } = useSelector(
    (state) => state.flashcardTeacher || state.flashcard
  );

  const hasSetInState = !!currentSet;

  /* 1) Nếu lesson đã có set trong Redux (vừa tạo xong) → không cần fetch theo sectionContentId nữa.
        Nếu chưa có set nhưng có sectionContentId (lesson load lại từ server) → fetch set theo sectionContentId. */
  useEffect(() => {
    if (!sectionContentId) return;
    if (hasSetInState) return; // đã có currentSet, khỏi fetch nữa

    dispatch(fetchSetBySectionContent(sectionContentId));
  }, [sectionContentId, hasSetInState, dispatch]);

  /* 2) Khi đã có currentSet.id (dù đến từ createCourseVocabSet hay fetchSetBySectionContent) → fetch cards */
  useEffect(() => {
    if (!currentSet?.id) return;
    dispatch(fetchCardsBySetId(currentSet.id));
  }, [currentSet?.id, dispatch]);

  /* 3) UI:
        - Nếu lesson hoàn toàn chưa có content flashcard & chưa có set → return null (lesson mới tinh, chưa tạo gì).
        - Nếu đã có set (currentSet) → luôn render danh sách từ Redux. */

  if (!sectionContentId && !hasSetInState) {
    return null; // lesson mới chưa đụng flashcard
  }

  const handleDeleteSet = async () => {
    if (!currentSet?.id) return;

    const rs = await dispatch(deleteFlashcardSet(currentSet.id));
    if (deleteFlashcardSet.fulfilled.match(rs)) {
      message.success("Đã xóa bộ flashcard");
    } else {
      message.error(rs.payload || "Không thể xóa bộ flashcard");
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!currentSet?.id) return;
    const rs = await dispatch(
      deleteFlashcardCard({ setId: currentSet.id, cardId })
    );
    if (!deleteFlashcardCard.fulfilled.match(rs)) {
      message.error("Không thể xóa flashcard");
    }
  };

  const totalCards = cards?.length || 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <Title level={5} className={styles.title}>
            Flashcard set
          </Title>
          {!currentSet ? (
            <Text type="secondary">Chưa có bộ flashcard nào.</Text>
          ) : (
            <>
              <Text strong>{currentSet.title}</Text>
              {currentSet.description && (
                <div className={styles.desc}>{currentSet.description}</div>
              )}
            </>
          )}
        </div>

        {currentSet && (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => onEditSet && onEditSet(currentSet)}
            >
              Xem/ sửa
            </Button>

            <Popconfirm
              title="Xóa bộ flashcard?"
              onConfirm={handleDeleteSet}
              okText="Xóa"
              cancelText="Hủy"
              okType="danger"
            >
              <Button danger icon={<DeleteOutlined />} loading={saving}>
                Xóa bộ
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <Spin spinning={loadingSet || loadingCards}>
        {!currentSet ? (
          <Text type="secondary">Chưa có bộ flashcard nào.</Text>
        ) : totalCards === 0 ? (
          <Text type="secondary">Bộ flashcard chưa có thẻ nào.</Text>
        ) : (
          <List
            className={styles.cardList}
            dataSource={cards}
            renderItem={(card, index) => (
              <List.Item>
                <Card className={styles.card}>
                  <div className={styles.cardHeader}>
                    <Space>
                      <Text type="secondary" strong>
                        {index + 1}.
                      </Text>
                      <Text strong>{card.frontText}</Text>
                      {card.reading && (
                        <Text type="secondary">({card.reading})</Text>
                      )}
                    </Space>

                    <Popconfirm
                      title="Xóa thẻ này?"
                      onConfirm={() => handleDeleteCard(card.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okType="danger"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Popconfirm>
                  </div>

                  <div className={styles.cardContent}>
                    <Text type="secondary"> → </Text>
                    {card.backText}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );
}
