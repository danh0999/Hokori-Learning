// src/pages/Teacher/Courses/CourseInformation/CourseInformation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tabs, Button, Tag, Space, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import CourseOverview from "../Create-Course/components/CourseOverview/CourseOverview.jsx";
import PricingStep from "../Create-Course/components/PricingStep/PricingStep.jsx";
import CourseCurriculumView from "../CourseCurriculumView/CourseCurriculumView.jsx";
import LessonEditorDrawer from "../Create-Course/components/Curriculum Builder/LessonEditorDrawer/LessonEditorDrawer.jsx";
import CourseFeedbackTab from "./CourseFeedbackTab/CourseFeedbackTab.jsx";

import {
  fetchCourseTree,
  updateCourseThunk,
  submitforapprovalCourseThunk,
  unpublishCourseThunk,
} from "../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

const statusColor = {
  DRAFT: "default",
  REVIEW: "warning",
  PUBLISHED: "success",
  REJECTED: "error",
};

export default function CourseInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = id ? Number(id) : null;

  const dispatch = useDispatch();
  const {
    currentCourseMeta,
    currentCourseTree,
    loadingMeta,
    loadingTree,
    saving,
  } = useSelector((state) => state.teacherCourse);
  const [activeKey, setActiveKey] = useState("basic");
  // ====== LOCAL STATE: lesson editor drawer ======
  const [lessonDrawerOpen, setLessonDrawerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setLessonDrawerOpen(true);
  };

  const handleCloseLessonDrawer = async () => {
    setLessonDrawerOpen(false);

    if (courseId) {
      try {
        await dispatch(fetchCourseTree(courseId)).unwrap();
      } catch (e) {
        console.error("Reload course tree on close failed", e);
      }
    }
  };

  const handleLessonSaved = async () => {
    if (!courseId) return;
    try {
      await dispatch(fetchCourseTree(courseId)).unwrap();
    } catch (e) {
      console.error("Reload course tree on save failed", e);
    }
  };
  // ====== LOAD COURSE DATA ======
  useEffect(() => {
    if (!courseId) return;
    dispatch(fetchCourseTree(courseId)); // /detail: vừa meta vừa tree
  }, [courseId, dispatch]);

  // ====== ACTIONS ======
  const handleSaveDraft = async () => {
    if (!courseId || !currentCourseMeta) return;

    const payload = {
      ...currentCourseMeta,
    };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );

    if (updateCourseThunk.fulfilled.match(action)) {
      message.success("Saved");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Save failed, please try again");
    }
  };

  const handleSubmitForReview = async () => {
    if (!courseId) return;

    const action = await dispatch(submitforapprovalCourseThunk(courseId));

    if (submitforapprovalCourseThunk.fulfilled.match(action)) {
      message.success("Submitted for review / published");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Submit failed, please try again");
    }
  };

  const handleUnpublish = async () => {
    if (!courseId) return;

    const action = await dispatch(unpublishCourseThunk(courseId));
    if (unpublishCourseThunk.fulfilled.match(action)) {
      message.success("Unpublished");
    } else {
      message.error("Unpublish failed, please try again");
    }
  };

  // ====== VALIDATION ĐỂ ENABLE SUBMIT ======
  const canSubmit = useMemo(() => {
    const basicsDone =
      !!currentCourseMeta?.title &&
      !!currentCourseMeta?.description &&
      !!currentCourseMeta?.level;

    const hasLessons =
      currentCourseTree?.chapters?.some(
        (ch) => Array.isArray(ch.lessons) && ch.lessons.length > 0
      ) || false;

    const pricingDone = (currentCourseMeta?.priceCents || 0) > 0;

    return basicsDone && hasLessons && pricingDone;
  }, [currentCourseMeta, currentCourseTree]);

  const status = currentCourseMeta?.status || "DRAFT";

  if (!courseId) {
    return (
      <div className={styles.wrap}>
        <p>No course id in URL.</p>
        <Button onClick={() => navigate("/teacher/manage-courses")}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* HEADER */}
      <div className={styles.header}>
        <Button onClick={() => navigate("/teacher/manage-courses")}>
          ← Back
        </Button>

        <div>
          <h1 className={styles.title}>
            {currentCourseMeta?.title || `Course #${courseId}`}
          </h1>
          <p className={styles.subtitle}>
            Edit content, manage media & assessments
          </p>
        </div>

        <Space wrap>
          <Tag color={statusColor[status] || "default"}>{status}</Tag>

          <Button onClick={handleSaveDraft} loading={saving || loadingMeta}>
            {status === "PUBLISHED" ? "Save changes" : "Save draft"}
          </Button>

          {status === "PUBLISHED" ? (
            <Button danger onClick={handleUnpublish} loading={saving}>
              Unpublish
            </Button>
          ) : (
            <Button
              type="primary"
              disabled={!canSubmit}
              onClick={handleSubmitForReview}
              loading={saving}
            >
              Submit for review
            </Button>
          )}
        </Space>
      </div>

      {/* BODY TABS */}
      <Card>
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key)}
          items={[
            {
              key: "basic",
              label: "Basic",
              children: (
                <CourseOverview courseId={courseId} loading={loadingMeta} />
              ),
            },
            {
              key: "curriculum",
              label: "Curriculum",
              children: (
                <CourseCurriculumView
                  courseMeta={currentCourseMeta}
                  courseTree={currentCourseTree}
                  loading={loadingTree}
                  onEditLesson={handleEditLesson}
                />
              ),
            },
            {
              key: "feedback",
              label: "Feedback",
              children: (
                <CourseFeedbackTab
                  courseId={courseId}
                  isActive={activeKey === "feedback"}
                />
              ),
            },
            {
              key: "settings",
              label: "Pricing",
              children: <PricingStep courseId={courseId} />,
            },
          ]}
        />
      </Card>
      <LessonEditorDrawer
        open={lessonDrawerOpen}
        lesson={selectedLesson}
        onClose={handleCloseLessonDrawer}
        onSave={handleLessonSaved}
      />
    </div>
  );
}
