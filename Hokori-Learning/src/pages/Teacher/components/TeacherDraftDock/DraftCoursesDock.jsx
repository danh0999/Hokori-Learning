import React, { useEffect, useState, useCallback } from "react";
import { Tooltip, Modal } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import styles from "./DraftCoursesDock.module.scss";

function readDrafts() {
  try {
    const raw = localStorage.getItem("teacher-draft-courses");
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeDrafts(list) {
  try {
    localStorage.setItem("teacher-draft-courses", JSON.stringify(list));
  } catch (e) {
    console.log(e);
  }
}

function removeDraft(id) {
  const list = readDrafts().filter((c) => c.id !== id);
  writeDrafts(list);
  // xoá luôn step cache
  try {
    localStorage.removeItem(`course-wizard-step-${id}`);
  } catch (e) {
    console.log(e);
  }
}

export default function DraftCoursesDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drafts, setDrafts] = useState([]);

  // state cho modal confirm
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);

  const syncDrafts = useCallback(() => {
    setDrafts(readDrafts());
  }, []);

  useEffect(() => {
    syncDrafts();
  }, [syncDrafts]);

  useEffect(() => {
    syncDrafts();
  }, [location.pathname, syncDrafts]);

  if (drafts.length === 0) return null;

  const handleClickDraft = (course) => {
    setSelectedDraft(course);
    setOpenConfirm(true);
  };

  const handleDeleteDraft = (e, courseId) => {
    e.stopPropagation();
    removeDraft(courseId);
    syncDrafts();
  };

  const handleConfirmOk = () => {
    if (!selectedDraft) {
      setOpenConfirm(false);
      return;
    }
    navigate(`/teacher/create-course/${selectedDraft.id}`);
    setOpenConfirm(false);
  };

  const handleConfirmCancel = () => {
    if (selectedDraft) {
      removeDraft(selectedDraft.id);
      syncDrafts();
    }
    setOpenConfirm(false);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <BookOutlined className={styles.headerIcon} />
          <span className={styles.headerText}>Draft Courses</span>
        </div>

        {drafts.map((c) => {
          let step = 0;
          try {
            const raw = localStorage.getItem(`course-wizard-step-${c.id}`);
            step = raw != null ? Number(raw) : 0;
          } catch (e) {
            console.log(e);
          }

          return (
            <Tooltip
              key={c.id}
              title={`Tiếp tục ở bước ${step + 1}/4`}
              placement="left"
            >
              <div className={styles.item} onClick={() => handleClickDraft(c)}>
                <div className={styles.itemInfo}>
                  <div className={styles.courseTitle}>
                    {c.title || "Untitled course"}
                  </div>
                  <div className={styles.courseMeta}>
                    {c.level} · Step {step + 1}/4
                  </div>
                </div>

                <div className={styles.actions}>
                  <ArrowRightOutlined className={styles.arrow} />
                  <DeleteOutlined
                    className={styles.deleteIcon}
                    onClick={(e) => handleDeleteDraft(e, c.id)}
                  />
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Modal confirm controlled bằng state */}
      <Modal
        open={openConfirm}
        title="Tiếp tục tạo khoá học?"
        onOk={handleConfirmOk}
        onCancel={handleConfirmCancel}
        okText="Tiếp tục"
        cancelText="Bỏ nháp"
      >
        <div className={styles.confirmTitle}>
          {selectedDraft?.title || "Untitled course"}
        </div>
        <div className={styles.confirmDesc}>
          Bạn muốn tiếp tục tạo khoá học này hay bỏ nháp? (nháp vẫn sẽ được lưu
          ở bảng khoá học nếu bạn muốn tạo lại sau)
        </div>
      </Modal>
    </>
  );
}
