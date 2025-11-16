// src/pages/Teacher/Courses/Create-Course/CreateCoursePage.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import CourseOverview from "./components/CourseOverview/CourseOverview.jsx";
import CurriculumBuilder from "./components/Curriculum Builder/CurriculumBuilder.jsx";
import PricingStep from "./components/PricingStep/PricingStep.jsx";
import PublishStep from "./components/PublishStep/PublishStep.jsx";
import SidebarWizardNav from "./components/SideWizardNav/SidebarWizardNav.jsx";

import {
  createCourseThunk,
  fetchCourseMeta,
  fetchCourseTree,
} from "../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import ScrollToTopButton from "../../../../components/SrcollToTopButton/ScrollToTopButton.jsx";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { courseId: courseIdParam } = useParams(); // /teacher/create-course/:courseId
  const courseId = courseIdParam ? Number(courseIdParam) : null;

  const [step, setStep] = useState(0);

  const { currentCourseMeta, currentCourseTree, loadingTree } = useSelector(
    (state) => state.teacherCourse
  );

  // flag chống double-create trong StrictMode
  const createdRef = useRef(false);

  // 1. Nếu có courseId trên URL ⇒ load meta + tree
  useEffect(() => {
    if (!courseId) return;
    dispatch(fetchCourseMeta(courseId));
    dispatch(fetchCourseTree(courseId));
  }, [courseId, dispatch]);

  // 2. Nếu KHÔNG có courseId trên URL ⇒ tạo nháp 1 lần rồi điều hướng sang /:id
  useEffect(() => {
    if (courseId) return; // đã có id trên URL thì thôi
    if (createdRef.current) return; // đã gửi request rồi thì thôi (chống StrictMode)

    createdRef.current = true;

    const payload = {
      title: "Untitled course",
      subtitle: "",
      description: "",
      level: "N5",
      currency: "VND",
      priceCents: 0,
      discountedPriceCents: 0,
      coverAssetId: null,
    };

    dispatch(createCourseThunk(payload))
      .unwrap()
      .then((course) => {
        // chuyển sang URL có id → component mount lại với courseIdParam mới
        navigate(`/teacher/create-course/${course.id}`, { replace: true });
      })
      .catch((err) => {
        createdRef.current = false;
        console.error(err);
        message.error("Tạo nháp khoá học thất bại, thử lại nhé.");
      });
  }, [courseId, dispatch, navigate]);

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

    const pricingDone = (currentCourseMeta?.priceCents || 0) > 0;
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
        return <CourseOverview courseId={courseId} />;
      case 1:
        return (
          <CurriculumBuilder courseId={courseId} loadingTree={loadingTree} />
        );
      case 2:
        return <PricingStep courseId={courseId} />;
      case 3:
        return <PublishStep courseId={courseId} statusFlags={status} />;
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
            Back to Courses
          </Button>

          <div className={styles.statusText}>
            {currentCourseMeta?.status || "DRAFT"} · Not submitted
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
