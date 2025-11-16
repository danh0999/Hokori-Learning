import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTeacherProfile,
  fetchTeacherCertificates,
  submitTeacherProfile,
  selectTeacherProfile,
  selectTeacherProfileStatus,
  selectTeacherProfileError,
  selectTeacherApproved,
  selectTeacherProfileSubmitting,
  selectTeacherCertificates,
  selectTeacherCertificatesStatus,
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
  List,
} from "antd";
import { EditOutlined, IdcardOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";
import ModalCertificates from "./components/ModalQualifications.jsx";

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
  const certificates = useSelector(selectTeacherCertificates);
  const certStatus = useSelector(selectTeacherCertificatesStatus);

  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherCertificates());
  }, [dispatch]);

  const canSubmit =
    !!profile?.headline &&
    profile.bio?.trim()?.length >= 50 &&
    certificates?.length > 0;

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
          <Button icon={<EditOutlined />}>Chỉnh sửa hồ sơ</Button>
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
            </div>

            <div style={{ marginTop: 24 }}>
              <h3>Chứng chỉ ({certificates?.length || 0})</h3>
              {certStatus === "loading" ? (
                <Skeleton active />
              ) : (
                <List
                  dataSource={certificates}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={`${item.issuer || ""} - ${
                          item.year || ""
                        }`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </>
        )}
      </Card>

      {openModal && (
        <ModalCertificates
          open={openModal}
          onClose={() => setOpenModal(false)}
        />
      )}
    </div>
  );
}
