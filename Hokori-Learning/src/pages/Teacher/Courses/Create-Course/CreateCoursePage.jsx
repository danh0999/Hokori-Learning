// src/pages/Teacher/Courses/Create-Course/CreateCoursePage.jsx
import React, { useState, useMemo } from "react";
import { Button, Steps, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import CourseOverview from "../components/CourseOverview/CourseOverview.jsx";
import CurriculumBuilder from "../components/Curriculum Builder/CurriculumBuilder.jsx";
import PricingStep from "../components/PricingStep/PricingStep.jsx";
import PublishStep from "../components/PublishStep/PublishStep.jsx";

import styles from "./styles.module.scss";

export default function CreateCoursePage() {
  const navigate = useNavigate();

  // ----- wizard step -----
  const [step, setStep] = useState(0);

  // ----- MAIN STATES (shared across steps) -----
  const [courseBasics, setCourseBasics] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "JLPT N5",
    level: "Beginner",
    language: "Japanese",
    thumbnailUrl: "",
  });

  // sections = [{ id, title, lessons:[ { id, title, contentSummary, ... } ] }]
  const [sections, setSections] = useState([]);

  const [price, setPrice] = useState(199000);

  // You can also hold quizPool, flashcards, etc., here later if you want
  // const [quizPool, setQuizPool] = useState([]);
  // const [flashcards, setFlashcards] = useState([]);

  // check if ready to publish
  const canPublish = useMemo(() => {
    const hasTitle = courseBasics.title.trim().length > 0;
    const hasDesc = courseBasics.description.trim().length > 0;
    const hasThumb = !!courseBasics.thumbnailUrl;
    const hasAnyLesson = sections.some((s) => s.lessons.length > 0);
    return hasTitle && hasDesc && hasThumb && hasAnyLesson;
  }, [courseBasics, sections]);

  const handleSubmitForReview = () => {
    if (!canPublish) {
      message.error(
        "Please complete title, description, thumbnail and at least one lesson."
      );
      return;
    }

    const payload = {
      ...courseBasics,
      price,
      sections,
      status: "Review",
    };

    console.log("SUBMIT PAYLOAD", payload);

    message.success("Course submitted for review");
    navigate("/teacher/manage-courses");
  };

  // ----- render current step main panel -----
  const renderStep = () => {
    if (step === 0)
      return <CourseOverview value={courseBasics} onChange={setCourseBasics} />;

    if (step === 1)
      return (
        <CurriculumBuilder
          sections={sections}
          setSections={setSections}
          // sau này bạn sẽ truyền thêm:
          // mediaLibrary={mediaLibrary}
          // onUploadMedia={handleUploadMedia}
          // quizPool={quizPool} setQuizPool={setQuizPool}
          // flashcards={flashcards} setFlashcards={setFlashcards}
        />
      );

    if (step === 2) return <PricingStep price={price} setPrice={setPrice} />;

    return (
      <PublishStep
        courseBasics={courseBasics}
        sections={sections}
        price={price}
        canPublish={canPublish}
        onSubmit={handleSubmitForReview}
      />
    );
  };

  return (
    <div className={styles.page}>
      {/* Top row giống Udemy */}
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <Button
            className={styles.backBtn}
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/teacher/manage-courses")}
          >
            Back to Courses
          </Button>

          <div className={styles.statusText}>Draft · Not submitted</div>
        </div>

        <Button
          type="primary"
          className={styles.submitBtnTop}
          disabled={step !== 3 || !canPublish}
          onClick={handleSubmitForReview}
        >
          Submit for review
        </Button>
      </div>

      <div className={styles.contentRow}>
        {/* Sidebar steps / wizard nav */}
        <aside className={styles.sidebar}>
          <Steps
            direction="vertical"
            size="small"
            current={step}
            onChange={setStep}
            items={[
              {
                title: "Course Info",
                description: "Title, description, thumbnail",
              },
              {
                title: "Curriculum",
                description: "Sections & lessons",
              },
              {
                title: "Pricing",
                description: "Set your price",
              },
              {
                title: "Publish",
                description: "Review & submit",
              },
            ]}
          />
        </aside>

        {/* Main panel */}
        <main className={styles.mainPanel}>{renderStep()}</main>
      </div>
    </div>
  );
}
