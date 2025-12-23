import React, { useEffect, useMemo, useState } from "react";
import { Card, Descriptions, Tag, Button, Space, message, Divider } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../configs/axios.js";
import styles from "./PaymentDetailPage.module.scss";

const statusColor = (s) => {
  switch (s) {
    case "PAID":
      return "green";
    case "PENDING":
      return "gold";
    case "CANCELLED":
    case "FAILED":
    case "EXPIRED":
      return "red";
    default:
      return "default";
  }
};

// ✅ PayOS amountCents = VND
const formatMoneyVND = (amountVnd) => {
  const v = Number(amountVnd ?? 0);
  return v.toLocaleString("vi-VN") + " ₫";
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
};

export default function PaymentDetailPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`payment/${paymentId}`);
      setPayment(res?.data?.data ?? null);
    } catch (err) {
      console.error(err);
      message.error("Không tải được chi tiết giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const type = useMemo(() => {
    if (!payment) return null;
    const isAI = !!payment.aiPackageId || !!payment.aiPackagePurchaseId;
    const isCourse = (payment.courseIds ?? []).length > 0 || !!payment.cartId;
    if (isAI) return "AI";
    if (isCourse) return "COURSE";
    return "OTHER";
  }, [payment]);

  const titleText =
    type === "AI" ? "Chi tiết giao dịch AI" : "Chi tiết giao dịch khóa học";

  const commonItems = [
    { label: "Payment ID", value: payment?.id },
    { label: "OrderCode", value: payment?.orderCode },
    {
      label: "Trạng thái",
      value: <Tag color={statusColor(payment?.status)}>{payment?.status}</Tag>,
    },
    { label: "Tạo lúc", value: formatDateTime(payment?.createdAt) },
    {
      label: "Thanh toán lúc",
      value: payment?.paidAt ? formatDateTime(payment?.paidAt) : "-",
    },
    {
      label: "Hết hạn lúc",
      value: payment?.expiredAt ? formatDateTime(payment?.expiredAt) : "-",
    },
    {
      label: "Payment link",
      value: payment?.paymentLink ? (
        <span className={styles.linkBtn}>
          <a href={payment.paymentLink} target="_blank" rel="noreferrer">
            Mở link thanh toán
          </a>
        </span>
      ) : (
        "-"
      ),
    },
    // { label: "PayOS transaction", value: payment?.payosTransactionCode ?? "-" },
  ];

  const aiItems = [
    { label: "AI Package ID", value: payment?.aiPackageId },
    { label: "AI Package Purchase ID", value: payment?.aiPackagePurchaseId },
  ].filter((x) => x.value !== null && x.value !== undefined);

  const courseItems = [
    {
      label: "Course IDs",
      value:
        (payment?.courseIds ?? []).length > 0
          ? (payment.courseIds ?? []).join(", ")
          : null,
    },
    { label: "Cart ID", value: payment?.cartId ?? null },
  ].filter((x) => x.value !== null && x.value !== undefined);

  return (
    <div className={styles.wrapper}>
      <Card
        className={styles.card}
        loading={loading}
        title={
          <div className={styles.headerTitle}>
            <div>
              <b>{titleText}</b>
            </div>
            {payment ? (
              <div className={styles.badgeRow}>
                <span className={styles.amount}>
                  {formatMoneyVND(payment.amountCents)}
                </span>
                <Tag color={statusColor(payment.status)}>{payment.status}</Tag>
                <span className={styles.meta}>{payment.description ?? ""}</span>
              </div>
            ) : null}
          </div>
        }
        extra={
          <Space>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
          </Space>
        }
      >
        {!payment ? null : (
          <>
            <div className={styles.grid}>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Số tiền">
                  {formatMoneyVND(payment.amountCents)}
                </Descriptions.Item>

                {commonItems.map((it) => (
                  <Descriptions.Item key={it.label} label={it.label}>
                    {it.value ?? "-"}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>

            <Divider />

            {type === "AI" ? (
              <>
                <div className={styles.sectionTitle}>Thông tin gói AI</div>
                <div className={styles.grid}>
                  <Descriptions bordered column={1} size="middle">
                    {aiItems.map((it) => (
                      <Descriptions.Item key={it.label} label={it.label}>
                        {it.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              </>
            ) : (
              <>
                <div className={styles.sectionTitle}>
                  Thông tin mua khóa học
                </div>
                <div className={styles.grid}>
                  <Descriptions bordered column={1} size="middle">
                    {courseItems.map((it) => (
                      <Descriptions.Item key={it.label} label={it.label}>
                        {it.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
