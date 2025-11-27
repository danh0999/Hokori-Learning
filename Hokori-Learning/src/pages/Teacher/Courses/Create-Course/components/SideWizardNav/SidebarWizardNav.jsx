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
        title: "Lên kế hoạch khoá học",
        subtitle: "Thiết lập cơ bản cho khoá học của bạn",
        items: [
          {
            key: "course-info",
            stepIndex: 0,
            label: "Thông tin khoá học",
            desc: "Tiêu đề, phụ đề, mô tả, cấp độ, ảnh bìa",
          },
        ],
      },
      {
        key: "create",
        icon: <BookOutlined />,
        title: "Tạo nội dung khoá học",
        subtitle: "Xây dựng chương trình học",
        items: [
          {
            key: "curriculum",
            stepIndex: 1,
            label: "Chương trình học",
            desc: "Tạo chương và bài học cho khoá học",
          },
        ],
      },
      {
        key: "publish",
        icon: <RocketOutlined />,
        title: "Tổng kết",
        subtitle: "Gửi kiểm duyệt và xuất bản khoá học",
        items: [
          {
            key: "pricing",
            stepIndex: 2,
            label: "Giá",
            desc: "Chọn giá cho khoá học của bạn",
          },
          {
            key: "review-submit",
            stepIndex: 3,
            label: "Xem lại & gửi",
            desc: "Kiểm tra cuối trước khi gửi",
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
        <div className={styles.navTitle}>Thiết lập khoá học</div>
        <div className={styles.navSubtitle}>
          Theo dõi từng bước để tạo và xuất bản khoá học của bạn.
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
                      ? "Hoàn thành"
                      : isActive
                      ? "Đang tiến hành"
                      : isLocked
                      ? "Khóa"
                      : "Chưa bắt đầu"}
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
