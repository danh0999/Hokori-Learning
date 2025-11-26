// FlashcardList.jsx
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

  // Lấy set theo sectionContentId
  useEffect(() => {
    if (sectionContentId) {
      dispatch(fetchSetBySectionContent(sectionContentId));
    }
  }, [sectionContentId, dispatch]);

  // Khi đã có set → lấy cards
  useEffect(() => {
    if (currentSet?.id) {
      dispatch(fetchCardsBySetId(currentSet.id));
    }
  }, [currentSet?.id, dispatch]);

  if (!sectionContentId) return null;

  const handleDeleteSet = async () => {
    if (!currentSet?.id) return;
    const action = await dispatch(deleteFlashcardSet(currentSet.id));

    if (deleteFlashcardSet.fulfilled.match(action)) {
      message.success("Đã xóa bộ flashcard.");
      // cards và currentSet sẽ được clear trong extraReducers
    } else {
      message.error(
        action.payload || "Không thể xóa bộ flashcard. Vui lòng thử lại."
      );
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!currentSet?.id) return;
    const action = await dispatch(
      deleteFlashcardCard({ setId: currentSet.id, cardId })
    );

    if (deleteFlashcardCard.fulfilled.match(action)) {
      message.success("Đã xóa flashcard.");
    } else {
      message.error("Không thể xóa flashcard.");
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
          {currentSet ? (
            <>
              <Text strong>{currentSet.title}</Text>
              {currentSet.description && (
                <div className={styles.desc}>{currentSet.description}</div>
              )}
            </>
          ) : (
            <Text type="secondary">Chưa có bộ flashcard nào.</Text>
          )}
        </div>

        {currentSet && (
          <Space>
            {/* View / Edit = mở modal builder */}
            <Button
              icon={<EditOutlined />}
              onClick={() => onEditSet && onEditSet(currentSet)}
            >
              View / Edit
            </Button>

            <Popconfirm
              title="Xóa bộ flashcard?"
              description="Toàn bộ thẻ trong bộ này sẽ bị xóa."
              okText="Xóa"
              cancelText="Hủy"
              okType="danger"
              onConfirm={handleDeleteSet}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={saving && !!currentSet}
              >
                Delete set
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <Spin spinning={loadingSet || loadingCards}>
        {currentSet && totalCards > 0 ? (
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

                    <Space>
                      {/* Xóa card */}
                      <Popconfirm
                        title="Xóa flashcard?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                        onConfirm={() => handleDeleteCard(card.id)}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>
                    </Space>
                  </div>

                  <div className={styles.cardContent}>
                    <Text type="secondary">Back: </Text>
                    {card.backText}
                  </div>

                  {card.exampleSentence && (
                    <div className={styles.cardExample}>
                      <Text type="secondary">Ví dụ: </Text>
                      {card.exampleSentence}
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        ) : currentSet ? (
          <Text type="secondary">Bộ flashcard chưa có thẻ nào.</Text>
        ) : (
          <Text type="secondary">Chưa có bộ flashcard nào.</Text>
        )}
      </Spin>
    </div>
  );
}
