// src/pages/Teacher/Courses/Create-Course/components/SidebarWizardNav.jsx
import React, { useMemo } from "react";
import {
  BulbOutlined,
  BookOutlined,
  RocketOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import styles from "./SidebarWizardNav.module.scss";

/**
 * Props:
 * - step: number (0..3)
 * - onChangeStep: (nextStep: number) => void
 * - status: {
 *     basicsDone: boolean,
 *     curriculumDone: boolean,
 *     pricingDone: boolean,
 *     readyToPublish: boolean
 *   }
 */
export default function SidebarWizardNav({ step, onChangeStep, status }) {
  const stepDoneMap = useMemo(
    () => ({
      0: !!status?.basicsDone,
      1: !!status?.curriculumDone,
      2: !!status?.pricingDone,
      3: !!status?.readyToPublish,
    }),
    [status]
  );

  const groups = useMemo(
    () => [
      {
        key: "plan",
        icon: <BulbOutlined />,
        title: "Plan your course",
        subtitle: "Set up the basics",
        items: [
          {
            key: "course-info",
            stepIndex: 0,
            label: "Course info",
            desc: "Title, subtitle, description, category, language",
          },
        ],
      },
      {
        key: "create",
        icon: <BookOutlined />,
        title: "Create your content",
        subtitle: "Build your curriculum",
        items: [
          {
            key: "curriculum",
            stepIndex: 1,
            label: "Curriculum",
            desc: "Sections, lectures, quizzes, resources",
          },
        ],
      },
      {
        key: "publish",
        icon: <RocketOutlined />,
        title: "Publish your course",
        subtitle: "Get ready to go live",
        items: [
          {
            key: "pricing",
            stepIndex: 2,
            label: "Pricing",
            desc: "Choose price for your course",
          },
          {
            key: "review-submit",
            stepIndex: 3,
            label: "Review & submit",
            desc: "Final check before submitting",
          },
        ],
      },
    ],
    []
  );

  const handleClick = (nextStep) => {
    if (typeof onChangeStep === "function") {
      onChangeStep(nextStep);
    }
  };

  return (
    <div className={styles.sidebarNav}>
      <div className={styles.navHeader}>
        <div className={styles.navTitle}>Course setup</div>
        <div className={styles.navSubtitle}>
          Follow each step to create and publish your course.
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.groupIcon}>{group.icon}</div>
            <div>
              <div className={styles.groupTitle}>{group.title}</div>
              <div className={styles.groupSubtitle}>{group.subtitle}</div>
            </div>
          </div>

          <ul className={styles.stepList}>
            {group.items.map((item) => {
              const isActive = step === item.stepIndex;
              const isDone = stepDoneMap[item.stepIndex];
              // Có thể custom rule khóa step sau nếu muốn
              const isLocked = false;

              return (
                <li
                  key={item.key}
                  className={[
                    styles.stepItem,
                    isActive ? styles.stepItemActive : "",
                    isDone ? styles.stepItemDone : "",
                    isLocked ? styles.stepItemDisabled : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => !isLocked && handleClick(item.stepIndex)}
                >
                  <div className={styles.stepLeft}>
                    <div className={styles.bulletWrapper}>
                      {isDone ? (
                        <CheckCircleFilled className={styles.bulletDoneIcon} />
                      ) : (
                        <span className={styles.bulletDot} />
                      )}
                    </div>

                    <div className={styles.stepText}>
                      <div className={styles.stepLabel}>{item.label}</div>
                      {item.desc && (
                        <div className={styles.stepDesc}>{item.desc}</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.stepStatus}>
                    {isDone
                      ? "Completed"
                      : isActive
                      ? "In progress"
                      : isLocked
                      ? "Locked"
                      : "Not started"}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
