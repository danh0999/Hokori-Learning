// src/pages/Teacher/ManageDocument/ManageDocumentPage.jsx
import React from "react";
import { Card, Collapse, Typography } from "antd";
import QuizTable from "./Quiz/QuizTable";
// import FlashcardTable from "./Flashcard/FlashcardTable";
// import VideoTable from "./Video/VideoTable";

const { Title, Paragraph } = Typography;

export default function ManageDocumentPage() {
  const items = [
    {
      key: "quiz",
      label: "Quiz",
      children: <QuizTable />,
    },
    // {
    //   key: "flashcard",
    //   label: "Flashcard sets",
    //   children: <FlashcardTable />,
    // },
    // {
    //   key: "video",
    //   label: "Videos",
    //   children: <VideoTable />,
    // },
  ];

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 8 }}>
        Quản lý tài liệu
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Quản lý tất cả quiz, flashcard và video của bạn.
      </Paragraph>

      <Collapse
        accordion
        items={items}
        bordered={false}
        defaultActiveKey={["quiz"]}
      />
    </Card>
  );
}
