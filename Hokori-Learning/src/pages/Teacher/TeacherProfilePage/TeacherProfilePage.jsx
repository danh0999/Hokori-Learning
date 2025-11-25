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
import { IdcardOutlined, EditOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";
import ModalCertificates from "./components/ModalQualifications.jsx";
import ProfileEditModal from "./components/ProfileEditModal.jsx";

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

  const [openCertModal, setOpenCertModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherCertificates());
  }, [dispatch]);

  const user = profile?.user || {};
  const teacher = profile?.teacher || {};
  const hasCertificate = (certificates?.length || 0) > 0;
  const hasValidBio = (teacher?.bio || "").trim().length >= 50;

  const canSubmit = hasCertificate && hasValidBio;

  // Chỉ ẩn khi đã APPROVED, còn lại (DRAFT, REJECTED, PENDING, null) đều hiện nút
  const showSubmit = teacher?.approvalStatus !== "APPROVED";

  // Trạng thái đang chờ duyệt → khoá chức năng chỉnh sửa chứng chỉ
  const isPendingApproval = teacher?.approvalStatus === "PENDING";

  const onSubmitApproval = async () => {
    // ✅ Tự validate điều kiện trước khi gọi API
    if (!canSubmit) {
      message.error(
        "Vui lòng cung cấp ít nhất 1 chứng chỉ và viết bio tối thiểu 50 ký tự trước khi gửi duyệt."
      );
      return;
    }

    const res = await dispatch(
      submitTeacherProfile({ message: "Xin duyệt hồ sơ giáo viên." })
    );
    if (res.meta.requestStatus === "fulfilled") {
      message.success(
        "Đã gửi duyệt hồ sơ. Trạng thái chuyển sang PENDING, trong thời gian chờ duyệt bạn sẽ không thể chỉnh sửa chứng chỉ."
      );
    } else {
      message.error(res?.payload?.message || "Gửi duyệt thất bại");
    }
  };

  const statusTag = useMemo(() => {
    const s = teacher?.approvalStatus || "DRAFT";
    const m = statusMap[s] || statusMap.DRAFT;
    return <Tag color={m.color}>{m.text}</Tag>;
  }, [teacher?.approvalStatus]);

  const showGateBanner = !isApproved;

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Teacher Profile</h1>
        <Space>
          {showSubmit && (
            <Popconfirm
              title="Gửi duyệt hồ sơ?"
              description="Sau khi gửi, trạng thái chuyển sang PENDING để admin xem xét. Trong thời gian PENDING, bạn sẽ không thể thêm/sửa/xoá chứng chỉ."
              onConfirm={onSubmitApproval}
              okText="Gửi duyệt"
              cancelText="Hủy"
              okButtonProps={{ loading: submitting }} // ❗ không disable theo canSubmit nữa
            >
              <Button type="primary" loading={submitting}>
                Gửi duyệt
              </Button>
            </Popconfirm>
          )}

          <Button
            type="default"
            icon={<IdcardOutlined />}
            onClick={() => setOpenCertModal(true)}
            disabled={isPendingApproval}
          >
            Cung cấp chứng chỉ
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => setOpenEditModal(true)}
          >
            Cập nhật thông tin
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
            {/* Header hiển thị tên & headline + status */}
            <div className={styles.topInfo}>
              <div>
                <div className={styles.displayName}>
                  {user.displayName || "—"}
                </div>
              </div>
              <div className={styles.status}>{statusTag}</div>
            </div>

            {/* Thông tin tài khoản */}
            <h3 style={{ marginTop: 16 }}>Thông tin tài khoản </h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Email</label>
                <div>{user.email || "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Username</label>
                <div>{user.username || "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Số điện thoại</label>
                <div>{user.phoneNumber || "—"}</div>
              </div>

              <div className={styles.field}>
                <label>Role</label>
                <div>{user.role || "—"}</div>
              </div>
              <div className={styles.field}>
                <label>Tình trạng xác minh</label>
                <div>{user.isVerified ? "Đã xác minh" : "Chưa xác minh"}</div>
              </div>
            </div>

            {/* Thông tin giảng viên */}
            <h3 style={{ marginTop: 24 }}>Thông tin giảng viên</h3>

            <div className={styles.teacherSection}>
              {/* BIO FULL WIDTH */}
              <div className={`${styles.fieldCard} ${styles.fullWidth}`}>
                <label>Giới thiệu</label>
                <div>{teacher.bio || "—"}</div>
              </div>

              {/* Experience – Website – LinkedIn */}
              <div className={styles.teacherRow}>
                <div className={styles.fieldCard}>
                  <label>Số năm kinh nghiệm</label>
                  <div>{teacher.yearsOfExperience ?? "—"}</div>
                </div>

                <div className={styles.fieldCard}>
                  <label>Website</label>
                  <div>{teacher.websiteUrl || "—"}</div>
                </div>

                <div className={styles.fieldCard}>
                  <label>LinkedIn</label>
                  <div>{teacher.linkedin || "—"}</div>
                </div>
              </div>

              {/* BANK GROUP */}
              <div className={styles.teacherRow}>
                <div className={styles.fieldCard}>
                  <label>Số tài khoản ngân hàng</label>
                  <div>{teacher.bankAccountNumber || "—"}</div>
                </div>

                <div className={styles.fieldCard}>
                  <label>Tên chủ tài khoản</label>
                  <div>{teacher.bankAccountName || "—"}</div>
                </div>

                <div className={styles.fieldCard}>
                  <label>Ngân hàng</label>
                  <div>{teacher.bankName || "—"}</div>
                </div>
              </div>

              {/* BRANCH FULL WIDTH */}
              <div className={`${styles.fieldCard} ${styles.fullWidth}`}>
                <label>Chi nhánh</label>
                <div>{teacher.bankBranchName || "—"}</div>
              </div>
            </div>

            {/* Certificates summary */}
            <div style={{ marginTop: 24 }}>
              <h3>Chứng chỉ ({certificates?.length || 0})</h3>
              {certStatus === "loading" ? (
                <Skeleton active />
              ) : (
                <List
                  dataSource={certificates}
                  locale={{ emptyText: "Chưa có chứng chỉ nào" }}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={
                          <>
                            {item.credentialId && (
                              <div>Mã: {item.credentialId}</div>
                            )}
                            {item.issueDate && (
                              <div>Ngày cấp: {item.issueDate}</div>
                            )}
                            {item.expiryDate && (
                              <div>Hết hạn: {item.expiryDate}</div>
                            )}
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </>
        )}
      </Card>

      {openCertModal && (
        <ModalCertificates
          open={openCertModal}
          onClose={() => setOpenCertModal(false)}
          locked={isPendingApproval}
        />
      )}

      {openEditModal && (
        <ProfileEditModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
        />
      )}
    </div>
  );
}
