import React, { useEffect, useState } from "react";
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
  selectUploadingAvatar,
  uploadTeacherAvatar,
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
  Avatar,
  Upload,
  Image,
} from "antd";
import {
  IdcardOutlined,
  EditOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import ModalCertificates from "./components/ModalQualifications.jsx";
import ProfileEditModal from "./components/ProfileEditModal.jsx";
import api from "../../../configs/axios.js";

const buildAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  const apiBase = api.defaults.baseURL || "";
  const rootBase = apiBase.replace(/\/api\/?$/, "");
  return rootBase + avatarUrl;
};

const buildFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  const apiBase = api.defaults.baseURL || "";
  const rootBase = apiBase.replace(/\/api\/?$/, "");
  return rootBase + fileUrl;
};

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
  const uploadingAvatar = useSelector(selectUploadingAvatar);

  const [openCertModal, setOpenCertModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherCertificates());
  }, [dispatch]);

  const user = profile?.user || {};
  const teacher = profile?.teacher || {};

  const approvalStatus = teacher?.approvalStatus || "DRAFT";
  const isPendingApproval = approvalStatus === "PENDING";

  const hasCertificate = (certificates?.length || 0) > 0;

  // ✅ Submit chỉ cần certificate
  const canSubmit = !isPendingApproval && hasCertificate;

  const statusInfo = statusMap[approvalStatus] || statusMap.DRAFT;

  const handleUploadAvatar = async ({ file }) => {
    const res = await dispatch(uploadTeacherAvatar(file));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Cập nhật avatar thành công!");
      dispatch(fetchTeacherProfile());
    } else {
      message.error(res?.payload?.message || "Upload avatar thất bại");
    }
  };

  const handleSubmit = async () => {
    if (!hasCertificate) {
      message.error("Bạn cần tải lên ít nhất 1 chứng chỉ trước khi gửi duyệt.");
      return;
    }

    const res = await dispatch(submitTeacherProfile({ message: "" }));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Đã gửi duyệt thành công!");
      dispatch(fetchTeacherProfile());
      dispatch(fetchTeacherCertificates());
    } else {
      message.error(res?.payload?.message || "Gửi duyệt thất bại");
    }
  };

  const avatarUrl = buildAvatarUrl(user.avatarUrl);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {status === "loading" ? (
          <Skeleton active />
        ) : error ? (
          <Alert
            type="error"
            message="Không thể tải hồ sơ"
            description={error?.message || "Có lỗi xảy ra"}
            showIcon
          />
        ) : (
          <>
            <Card className={styles.headerCard}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarWrap}>
                  <Avatar
                    size={96}
                    src={
                      avatarUrl ? (
                        <Image src={avatarUrl} preview={false} />
                      ) : null
                    }
                  >
                    {user?.displayName?.[0]?.toUpperCase() || "T"}
                  </Avatar>

                  <Upload
                    showUploadList={false}
                    customRequest={handleUploadAvatar}
                    accept="image/*"
                    disabled={uploadingAvatar || isPendingApproval}
                  >
                    <Button
                      icon={<CameraOutlined />}
                      size="small"
                      loading={uploadingAvatar}
                      disabled={isPendingApproval}
                      style={{ marginTop: 8 }}
                    >
                      Đổi avatar
                    </Button>
                  </Upload>
                </div>

                <div className={styles.headerInfo}>
                  <div className={styles.nameRow}>
                    <h2 className={styles.name}>
                      {user.displayName || user.username}
                    </h2>
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    {isApproved && <Tag color="success">Teacher</Tag>}
                  </div>

                  <div className={styles.subRow}>
                    <span>{user.email}</span>
                    {user.phoneNumber ? (
                      <span>• {user.phoneNumber}</span>
                    ) : null}
                  </div>

                  {isPendingApproval && (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginTop: 12 }}
                      message="Hồ sơ đang chờ duyệt"
                      description="Trong trạng thái Pending, bạn không thể chỉnh sửa hồ sơ hoặc chứng chỉ."
                    />
                  )}
                </div>
              </div>

              <div className={styles.headerActions}>
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setOpenEditModal(true)}
                    disabled={isPendingApproval}
                  >
                    Cập nhật hồ sơ
                  </Button>

                  <Button
                    icon={<IdcardOutlined />}
                    onClick={() => setOpenCertModal(true)}
                    disabled={isPendingApproval}
                  >
                    Cập nhật chứng chỉ
                  </Button>

                  <Popconfirm
                    title="Xác nhận gửi duyệt?"
                    description="Sau khi gửi duyệt, hồ sơ sẽ chuyển sang Pending và bạn sẽ không thể chỉnh sửa cho đến khi có kết quả."
                    onConfirm={handleSubmit}
                    okText="Gửi duyệt"
                    cancelText="Hủy"
                    disabled={!canSubmit}
                  >
                    <Button
                      type="primary"
                      disabled={!canSubmit}
                      loading={submitting}
                    >
                      Gửi duyệt
                    </Button>
                  </Popconfirm>
                </Space>

                {!hasCertificate ? (
                  <div style={{ marginTop: 10, color: "#ff4d4f" }}>
                    • Thiếu chứng chỉ (bắt buộc)
                  </div>
                ) : null}
              </div>
            </Card>

            <Card title="Thông tin tài khoản" className={styles.sectionCard}>
              <div className={styles.grid2}>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Email</div>
                  <div className={styles.value}>{user.email || "—"}</div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Username</div>
                  <div className={styles.value}>{user.username || "—"}</div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Số điện thoại</div>
                  <div className={styles.value}>{user.phoneNumber || "—"}</div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Role</div>
                  <div className={styles.value}>{user.role || "—"}</div>
                </div>
              </div>
            </Card>

            <Card title="Thông tin giảng viên" className={styles.sectionCard}>
              <div className={styles.infoBox}>
                <div className={styles.label}>Giới thiệu</div>
                <div className={styles.value}>{teacher.bio || "—"}</div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Số năm kinh nghiệm</div>
                  <div className={styles.value}>
                    {teacher.yearsOfExperience ?? "—"}
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Website</div>
                  <div className={styles.value}>
                    {teacher.websiteUrl || "—"}
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>LinkedIn</div>
                  <div className={styles.value}>{teacher.linkedin || "—"}</div>
                </div>
              </div>
            </Card>

            <Card title="Tài khoản ngân hàng" className={styles.sectionCard}>
              {!isApproved && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Ngân hàng chỉ cập nhật sau khi APPROVED"
                  description="Theo BE, chỉ giáo viên đã được APPROVED mới có thể cập nhật thông tin ngân hàng."
                />
              )}

              <div className={styles.grid2}>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Số tài khoản</div>
                  <div className={styles.value}>
                    {teacher.bankAccountNumber || "—"}
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Tên chủ tài khoản</div>
                  <div className={styles.value}>
                    {teacher.bankAccountName || "—"}
                  </div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Ngân hàng</div>
                  <div className={styles.value}>{teacher.bankName || "—"}</div>
                </div>
                <div className={styles.infoBox}>
                  <div className={styles.label}>Chi nhánh</div>
                  <div className={styles.value}>
                    {teacher.bankBranchName || "—"}
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Chứng chỉ"
              className={styles.sectionCard}
              extra={
                certStatus === "loading" ? (
                  <Tag color="processing">Đang tải…</Tag>
                ) : (
                  <Tag color={hasCertificate ? "success" : "default"}>
                    {hasCertificate ? "Đã có chứng chỉ" : "Chưa có chứng chỉ"}
                  </Tag>
                )
              }
            >
              <List
                dataSource={certificates || []}
                locale={{ emptyText: "Chưa có chứng chỉ" }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title || "Certificate"}
                      description={
                        item.fileUrl ? (
                          <a
                            href={buildFileUrl(item.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Xem file
                          </a>
                        ) : (
                          "—"
                        )
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <ProfileEditModal
              open={openEditModal}
              onClose={() => setOpenEditModal(false)}
            />
            <ModalCertificates
              open={openCertModal}
              onClose={() => {
                setOpenCertModal(false);
                dispatch(fetchTeacherCertificates()); // ✅ refresh list cho page
              }}
              locked={isPendingApproval}
            />
          </>
        )}
      </div>
    </div>
  );
}
