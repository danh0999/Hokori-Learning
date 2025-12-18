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
  List,
  Avatar,
  Upload,
  Image,
  Tooltip,
} from "antd";
import {
  IdcardOutlined,
  EditOutlined,
  CameraOutlined,
  BankOutlined,
} from "@ant-design/icons";
import styles from "./styles.module.scss";
import ModalCertificates from "./components/ModalQualifications.jsx";
import ProfileEditModal from "./components/ProfileEditModal.jsx";
import BankAccountModal from "./components/BankAccountModal.jsx";
import api from "../../../configs/axios.js";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [openBankModal, setOpenBankModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherProfile());
    dispatch(fetchTeacherCertificates());
  }, [dispatch]);

  const user = profile?.user || {};
  const teacher = profile?.teacher || {};

  const approvalStatus = teacher?.approvalStatus || "DRAFT";
  const isPendingApproval = approvalStatus === "PENDING";

  const hasCertificate = (certificates?.length || 0) > 0;

  // ✅ Submit chỉ cần certificate + không phải pending
  const canSubmit = !isPendingApproval && hasCertificate;

  const statusInfo = statusMap[approvalStatus] || statusMap.DRAFT;

  const handleUploadAvatar = async ({ file }) => {
    const res = await dispatch(uploadTeacherAvatar(file));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Cập nhật avatar thành công!");
      dispatch(fetchTeacherProfile());
    } else {
      toast.error(res?.payload?.message || "Upload avatar thất bại");
    }
  };

  const handleSubmit = async () => {
    if (!hasCertificate) {
      toast.error("Bạn cần tải lên ít nhất 1 chứng chỉ trước khi gửi duyệt.");
      return;
    }

    const res = await dispatch(submitTeacherProfile({ message: "" }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Đã gửi duyệt thành công!");
      dispatch(fetchTeacherProfile());
      dispatch(fetchTeacherCertificates());
    } else {
      toast.error(res?.payload?.message || "Gửi duyệt thất bại");
    }
  };

  const avatarUrl = buildAvatarUrl(user.avatarUrl);

  const bankDisabled = !isApproved; // đúng yêu cầu BE: chỉ APPROVED mới nhập bank

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
                <Space wrap>
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

                  <Tooltip
                    title={
                      bankDisabled
                        ? "Chỉ giáo viên đã được APPROVED mới có thể cập nhật ngân hàng."
                        : ""
                    }
                  >
                    <Button
                      icon={<BankOutlined />}
                      onClick={() => {
                        if (bankDisabled) {
                          toast.warning(
                            "Bạn cần được admin duyệt (APPROVED) trước khi cập nhật ngân hàng."
                          );
                          return;
                        }
                        setOpenBankModal(true);
                      }}
                      disabled={bankDisabled}
                    >
                      Cập nhật ngân hàng
                    </Button>
                  </Tooltip>

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

            {/* ✅ Bank section: chỉ hiển thị + nút mở modal, không edit inline */}
            <Card
              title="Tài khoản ngân hàng"
              className={styles.sectionCard}
              extra={
                <Tooltip
                  title={
                    bankDisabled
                      ? "Chỉ giáo viên đã được APPROVED mới có thể cập nhật ngân hàng."
                      : ""
                  }
                >
                  <Button
                    icon={<BankOutlined />}
                    onClick={() => setOpenBankModal(true)}
                    disabled={bankDisabled}
                  >
                    {isApproved ? "Sửa ngân hàng" : "Chưa thể cập nhật"}
                  </Button>
                </Tooltip>
              }
            >
              {!isApproved && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Ngân hàng chỉ cập nhật sau khi APPROVED"
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
                renderItem={(item) => {
                  const url = item.fileUrl ? buildFileUrl(item.fileUrl) : null;
                  const isImage =
                    !!item.mimeType && item.mimeType.startsWith("image/");
                  const isPdf =
                    item.mimeType === "application/pdf" ||
                    String(item.fileName || "")
                      .toLowerCase()
                      .endsWith(".pdf");

                  return (
                    <List.Item
                      actions={[
                        url ? (
                          <a
                            key="download"
                            href={url}
                            download
                            target="_blank"
                            rel="noreferrer"
                          >
                            Tải về
                          </a>
                        ) : null,
                        url ? (
                          <a
                            key="open"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Mở
                          </a>
                        ) : null,
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          url ? (
                            isImage ? (
                              <Image
                                src={url}
                                width={64}
                                height={64}
                                style={{ objectFit: "cover", borderRadius: 8 }}
                                // antd Image: click sẽ preview fullscreen
                              />
                            ) : (
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#f5f5f5",
                                  fontWeight: 600,
                                }}
                              >
                                {isPdf ? "PDF" : "FILE"}
                              </div>
                            )
                          ) : null
                        }
                        title={item.title || "Certificate"}
                        description={
                          <>
                            {item.credentialId ? (
                              <div>Mã: {item.credentialId}</div>
                            ) : null}
                            {item.issueDate ? (
                              <div>Ngày cấp: {item.issueDate}</div>
                            ) : null}
                            {item.expiryDate ? (
                              <div>Hết hạn: {item.expiryDate}</div>
                            ) : null}

                            {/* Preview link riêng (đặc biệt hữu ích cho PDF) */}
                            {url ? (
                              <div style={{ marginTop: 6 }}>
                                {isImage ? (
                                  <span style={{ color: "#1677ff" }}></span>
                                ) : (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Xem file
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div style={{ marginTop: 6, color: "#999" }}>
                                Chưa có file
                              </div>
                            )}
                          </>
                        }
                      />
                    </List.Item>
                  );
                }}
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
                dispatch(fetchTeacherCertificates());
              }}
              locked={isPendingApproval}
            />

            <BankAccountModal
              open={openBankModal}
              onClose={() => setOpenBankModal(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
