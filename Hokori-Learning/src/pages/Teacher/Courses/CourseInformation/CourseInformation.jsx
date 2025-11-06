import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Tabs, Button, Tag, Space, message } from "antd";

import CourseOverview from "../Create-Course/components/CourseOverview/CourseOverview.jsx";
import CurriculumBuilder from "../Create-Course/components/Curriculum Builder/CurriculumBuilder.jsx";
import PricingStep from "../Create-Course/components/PricingStep/PricingStep.jsx";
import QuizList from "../../ManageDocument/Quiz/QuizList/QuizList.jsx"; // bạn đã có QuizList
import FlashcardPanel from "../../ManageDocument/Flashcard/FlashcardPanel.jsx"; // bạn đã có FlashcardPanel
import UploadMedia from "../components/Upload Media/UploadMedia.jsx"; // quản lý thư viện media của course

import styles from "./styles.module.scss";

const statusColor = {
  Draft: "default",
  Review: "warning",
  Published: "success",
  Rejected: "error",
};

export default function CourseInformation() {
  const { id } = useParams();

  // Fake data load cho ví dụ này
  // sau này bạn sẽ fetch từ API bằng id
  const [status, setStatus] = useState("Review");
  const [basics, setBasics] = useState({
    title: "JLPT N5 Grammar Basics",
    subtitle: "Master core N5 grammar in simple Vietnamese",
    description:
      "We'll cover must-know grammar patterns for JLPT N5 with lots of examples.",
    category: "JLPT N5",
    level: "Beginner",
    language: "Japanese",
    thumbnailUrl: "",
  });

  const [sections, setSections] = useState([
    {
      id: "sec_1",
      title: "Module 1: Hiragana Basics",
      lessons: [
        {
          id: "les_1",
          title: "Hiragana vowels (a i u e o)",
          contentSummary: "Video (6:32) + PDF practice sheet",
        },
      ],
    },
  ]);

  const [price, setPrice] = useState(199000);

  const [quizPool, setQuizPool] = useState([
    { id: "quiz_1", title: "N5 Grammar Check 01", questions: 10 },
  ]);

  const [flashcards, setFlashcards] = useState([
    {
      id: 1,
      term: "勉強 (べんきょう)",
      meaning: "study",
      example: "日本語を勉強します。",
    },
  ]);

  // actions
  const handleSaveDraft = () => {
    // TODO: call API PUT /courses/:id (save current edits)
    message.success("Draft saved");
  };

  const handleSubmitForReview = () => {
    // TODO: call API to mark course as 'Review'
    setStatus("Review");
    message.success("Submitted for review");
  };

  // summary if you want validation (optional)
  const canSubmit = useMemo(() => {
    const hasTitle = basics.title.trim().length > 0;
    const hasDesc = basics.description.trim().length > 0;
    const hasAnyLesson = sections.some((s) => s.lessons.length > 0);
    return hasTitle && hasDesc && hasAnyLesson;
  }, [basics, sections]);

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{basics.title || `Course #${id}`}</h1>
          <p className={styles.subtitle}>
            Edit content, manage media & assessments
          </p>
        </div>

        <Space wrap>
          <Tag color={statusColor[status] || "default"}>{status}</Tag>

          <Button onClick={handleSaveDraft}>Save draft</Button>

          {status !== "Review" && status !== "Published" && (
            <Button
              type="primary"
              disabled={!canSubmit}
              onClick={handleSubmitForReview}
            >
              Submit for review
            </Button>
          )}
        </Space>
      </div>

      {/* BODY TABS */}
      <Card>
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: "basic",
              label: "Basic",
              children: <CourseOverview value={basics} onChange={setBasics} />,
            },
            {
              key: "curriculum",
              label: "Curriculum",
              children: (
                <CurriculumBuilder
                  sections={sections}
                  setSections={setSections}
                />
              ),
            },
            {
              key: "media",
              label: "Media",
              children: <UploadMedia />,
            },
            {
              key: "assess",
              label: "Assessments",
              children: (
                <>
                  <QuizList value={quizPool} onChange={setQuizPool} />
                  <FlashcardPanel value={flashcards} onChange={setFlashcards} />
                </>
              ),
            },
            {
              key: "settings",
              label: "Settings",
              children: <PricingStep price={price} setPrice={setPrice} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
