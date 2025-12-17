import React, { useState, useMemo, useEffect } from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import CourseOverview from "./components/CourseOverview/CourseOverview.jsx";
import CurriculumBuilder from "./components/Curriculum Builder/CurriculumBuilder.jsx";
import PricingStep from "./components/PricingStep/PricingStep.jsx";
import PublishStep from "./components/PublishStep/PublishStep.jsx";
import SidebarWizardNav from "./components/SideWizardNav/SidebarWizardNav.jsx";

import {
  fetchCourseTree,
  clearCourseTree,
} from "../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import ScrollToTopButton from "../../../../components/SrcollToTopButton/ScrollToTopButton.jsx";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { courseId: courseIdParam } = useParams(); // /teacher/create-course/:courseId
  const courseId = courseIdParam ? Number(courseIdParam) : null;

  const { currentCourseMeta, currentCourseTree, loadingTree } = useSelector(
    (state) => state.teacherCourse
  );

  // ----- 1. STEP STATE + PERSIST -----
  const [step, setStep] = useState(0);
  const [stepLoaded, setStepLoaded] = useState(false);

  // Khi có courseId => đọc step từ localStorage
  useEffect(() => {
    if (!courseId) return;
    try {
      const raw = window.localStorage.getItem(`course-wizard-step-${courseId}`);
      const savedStep = raw != null ? Number(raw) : 0;
      if (!Number.isNaN(savedStep) && savedStep >= 0 && savedStep <= 3) {
        setStep(savedStep);
      } else {
        setStep(0);
      }
    } catch (e) {
      console.warn("Cannot read course step from localStorage", e);
      setStep(0);
    } finally {
      // 🔑 cho phép effect ghi chạy sau khi đã load
      setStepLoaded(true);
    }
  }, [courseId]);

  // Mỗi khi step đổi => lưu lại (chỉ sau khi đã load xong bước ban đầu)
  useEffect(() => {
    if (!courseId) return;
    if (!stepLoaded) return; // ❗ tránh ghi đè giá trị cũ trong lần mount đầu

    try {
      window.localStorage.setItem(
        `course-wizard-step-${courseId}`,
        String(step)
      );
    } catch (e) {
      console.warn("Cannot save course step to localStorage", e);
    }
  }, [step, courseId, stepLoaded]);

  // Nếu course đã publish / archived thì xoá step cache
  useEffect(() => {
    if (!courseId || !currentCourseMeta?.status) return;
    const doneStatuses = ["PUBLISHED"];
    if (doneStatuses.includes(currentCourseMeta.status)) {
      try {
        window.localStorage.removeItem(`course-wizard-step-${courseId}`);
      } catch (e) {
        console.warn("Cannot remove course step from localStorage", e);
      }
    }
  }, [courseId, currentCourseMeta]);
  //dock
  useEffect(() => {
    if (!courseId) return;

    const status = currentCourseMeta?.status || "DRAFT";
    // 👉 Coi PENDING_APPROVAL cũng là "xong rồi", không còn là draft
    const nonDraftStatuses = ["PUBLISHED", "PENDING_APPROVAL"];
    const isDone = nonDraftStatuses.includes(status);

    try {
      const raw = window.localStorage.getItem("teacher-draft-courses");
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      if (isDone) {
        // ❌ Gửi duyệt / publish / archive => xoá khỏi danh sách draft
        list = list.filter((c) => c.id !== courseId);
      } else {
        // ✅ Chỉ DRAFT mới được coi là đang tạo dở
        const entry = {
          id: courseId,
          title: currentCourseMeta?.title || "Untitled course",
          level: currentCourseMeta?.level || "N5",
        };
        const idx = list.findIndex((c) => c.id === courseId);
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
      }

      window.localStorage.setItem(
        "teacher-draft-courses",
        JSON.stringify(list)
      );
    } catch (e) {
      console.warn("Cannot sync draft courses to localStorage", e);
    }
  }, [courseId, currentCourseMeta]);

  // 2. Khi đổi courseId trên URL ⇒ clear tree cũ + load meta + detail mới
  useEffect(() => {
    dispatch(clearCourseTree());
    if (!courseId) return;
    dispatch(fetchCourseTree(courseId));
  }, [courseId, dispatch]);

  useEffect(() => {
    if (courseId) return;
    // đi "đúng đường" là tạo draft từ ManageCourses rồi vào đây với :courseId
    navigate("/teacher/manage-courses", { replace: true });
  }, [courseId, navigate]);

  // trạng thái cho SidebarWizardNav
  const status = useMemo(() => {
    const basicsDone =
      !!currentCourseMeta?.title &&
      !!currentCourseMeta?.description &&
      !!currentCourseMeta?.level;

    const hasLessons =
      currentCourseTree?.chapters?.some(
        (ch) => Array.isArray(ch.lessons) && ch.lessons.length > 0
      ) || false;

    const rawPrice = currentCourseMeta?.priceCents;
    const price = typeof rawPrice === "number" ? rawPrice : 0;
    const pricingDone = price === 0 || price > 2000;

    const readyToPublish = basicsDone && hasLessons && pricingDone;

    return {
      basicsDone,
      curriculumDone: hasLessons,
      pricingDone,
      readyToPublish,
    };
  }, [currentCourseMeta, currentCourseTree]);

  const renderStep = () => {
    if (!courseId) {
      return <div className={styles.loadingBox}>Đang tạo khoá học nháp...</div>;
    }

    switch (step) {
      case 0:
        return <CourseOverview courseId={courseId} onNext={() => setStep(1)} />;
      case 1:
        return (
          <CurriculumBuilder
            courseId={courseId}
            loadingTree={loadingTree}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        );
      case 2:
        return (
          <PricingStep
            courseId={courseId}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        );
      case 3:
        return (
          <PublishStep
            courseId={courseId}
            statusFlags={status}
            onBack={() => setStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <Button
            className={styles.backBtn}
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/teacher/manage-courses")}
          >
            Quay lại danh sách khoá học
          </Button>

          <div className={styles.statusText}>
            {currentCourseMeta?.status || "DRAFT"} · Chưa gửi xét duyệt
          </div>
        </div>
      </div>

      <div className={styles.contentRow}>
        <aside className={styles.sidebar}>
          <SidebarWizardNav
            step={step}
            onChangeStep={setStep}
            status={status}
          />
        </aside>

        <main
          className={styles.mainPanel}
          style={{ marginTop: 0, paddingTop: 0 }}
        >
          {renderStep()}
        </main>
      </div>

      <ScrollToTopButton />
    </div>
  );
}
