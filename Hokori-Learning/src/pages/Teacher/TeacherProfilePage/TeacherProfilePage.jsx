import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherProfile,
  submitTeacherProfile,
  selectTeacherProfile,
  selectTeacherProfileStatus,
  selectTeacherProfileError,
  selectTeacherApproved,
  selectTeacherProfileSubmitting,
} from "../../../redux/features/teacherprofileSlice.js";
import {
  Card,
  Tag,
  Button,
  Space,
  Skeleton,
  Alert,
  Popconfirm,
  message,
} from "antd";
import { EditOutlined, IdcardOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";
import ModalQualifications from "../TeacherProfilePage/components/ModalQualifications.jsx";

const statusMap = {
  DRAFT: { color: "default", text: "Draft" },
  PENDING: { color: "processing", text: "Pending" },
  REJECTED: { color: "error", text: "Rejected" },
  APPROVED: { color: "success", text: "Approved" },
};

export default function TeacherProfilePage() {
  const dispatch = useDispatch();
  const profile = useSelector(selectTeacherProfile);
  const status = useSelector(selectTeacherProfileStatus);
  const error = useSelector(selectTeacherProfileError);
  const isApproved = useSelector(selectTeacherApproved);
  const submitting = useSelector(selectTeacherProfileSubmitting);

  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  const canSubmit = (() => {
    const p = profile || {};
    const hasDegree = !!p?.highestDegree;
    const hasMajor = !!p?.major;
    const hasYoE = Number.isFinite(p?.yearsOfExperience);
    const hasProof = !!p?.evidenceUrls || !!p?.certifications;
    const headlineOk = !!p?.headline && p.headline.trim().length > 0;
    const bioOk = !!p?.bio && p.bio.trim().length >= 50;
    return hasDegree && hasMajor && hasYoE && hasProof && headlineOk && bioOk;
  })();

  const showSubmit =
    profile?.approvalStatus === "DRAFT" ||
    profile?.approvalStatus === "REJECTED";

  const onSubmitApproval = async () => {
    const res = await dispatch(
      submitTeacherProfile({ message: "Xin duyệt hồ sơ giáo viên." })
    );
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Đã gửi duyệt hồ sơ. Trạng thái: PENDING");
    } else {
      message.error(res?.payload?.message || "Gửi duyệt thất bại");
    }
  };

  const statusTag = useMemo(() => {
    const s = profile?.approvalStatus || "DRAFT";
    const m = statusMap[s] || statusMap.DRAFT;
    return <Tag color={m.color}>{m.text}</Tag>;
  }, [profile?.approvalStatus]);

  const showGateBanner = !isApproved;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Teacher Profile</h1>
        <Space>
          {showSubmit && (
            <Popconfirm
              title="Gửi duyệt hồ sơ?"
              description="Sau khi gửi, trạng thái chuyển sang PENDING để admin xem xét."
              onConfirm={onSubmitApproval}
              okText="Gửi duyệt"
              cancelText="Hủy"
              okButtonProps={{ loading: submitting, disabled: !canSubmit }}
              disabled={!canSubmit}
            >
              <Button type="primary" loading={submitting} disabled={!canSubmit}>
                Gửi duyệt
              </Button>
            </Popconfirm>
          )}
          <Button
            type="default"
            icon={<IdcardOutlined />}
            onClick={() => setOpenModal(true)}
          >
            Cung cấp chứng chỉ
          </Button>
          <Button icon={<EditOutlined />} onClick={() => setOpenModal(true)}>
            Chỉnh sửa hồ sơ
          </Button>
        </Space>
      </div>

      {showGateBanner && (
        <Alert
          className={styles.banner}
          type="warning"
          showIcon
          message="Hồ sơ của bạn chưa được duyệt"
          description={
            <>
              Để tạo và đăng bán khóa học, hồ sơ cần ở trạng thái{" "}
              <b>APPROVED</b>. Vui lòng hoàn thiện thông tin & chứng chỉ, sau đó
              gửi duyệt.
            </>
          }
        />
      )}

      <Card>
        {status === "loading" ? (
          <Skeleton active />
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="Tải hồ sơ thất bại"
            description={String(error?.message || "")}
          />
        ) : (
          <>
            <div className={styles.topInfo}>
              <div>
                <div className={styles.displayName}>
                  {profile?.displayName || "—"}
                </div>
                <div className={styles.headline}>
                  {profile?.headline || "—"}
                </div>
              </div>
              <div className={styles.status}>{statusTag}</div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Họ</label>
                <div>{profile?.firstName || "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Tên</label>
                <div>{profile?.lastName || "—"}</div>
              </div>
              <div className={styles.fieldFull}>
                <label>Giới thiệu</label>
                <div>{profile?.bio || "—"}</div>
              </div>

              <div className={styles.field}>
                <label>Bằng cấp cao nhất</label>
                <div>{profile?.highestDegree ?? "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Chuyên ngành</label>
                <div>{profile?.major ?? "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Kinh nghiệm (năm)</label>
                <div>{profile?.yearsOfExperience ?? "—"}</div>
              </div>
              <div className={styles.fieldFull}>
                <label>Chứng chỉ</label>
                <div>{profile?.certifications ?? "—"}</div>
              </div>
              <div className={styles.fieldFull}>
                <label>Evidence URLs</label>
                <div>{profile?.evidenceUrls ?? "—"}</div>
              </div>
            </div>
          </>
        )}
      </Card>

      {openModal && (
        <ModalQualifications
          open={openModal}
          onClose={() => setOpenModal(false)}
          initial={profile}
        />
      )}
    </div>
  );
}
