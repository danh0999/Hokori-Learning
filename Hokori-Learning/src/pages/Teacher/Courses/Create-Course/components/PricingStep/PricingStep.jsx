// src/pages/Teacher/Courses/Create-Course/components/PricingStep/PricingStep.jsx
import React, { useEffect } from "react";
import { Card, Form, InputNumber, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { updateCourseThunk } from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

export default function PricingStep({ courseId }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { currentCourseMeta, saving } = useSelector(
    (state) => state.teacherCourse
  );

  useEffect(() => {
    if (!currentCourseMeta) return;

    form.setFieldsValue({
      price: currentCourseMeta.priceCents || 0,
      discountedPrice: currentCourseMeta.discountedPriceCents || 0,
    });
  }, [currentCourseMeta, form]);

  const handleFinish = async (values) => {
    if (!courseId) return;

    const payload = {
      ...currentCourseMeta,
      priceCents: values.price || 0,
      discountedPriceCents: values.discountedPrice || 0,
      currency: currentCourseMeta?.currency || "VND",
    };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );

    if (updateCourseThunk.fulfilled.match(action)) {
      message.success("Đã lưu giá khoá học.");
    } else {
      message.error("Không lưu được giá, vui lòng thử lại.");
    }
  };

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Pricing</div>
        <div className={styles.stepDesc}>
          Set your base course price. You can run promotions later.
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        className={styles.formGrid}
        onFinish={handleFinish}
      >
        <Form.Item
          name="price"
          label="Base price (VND)"
          rules={[{ required: true, message: "Nhập giá khoá học." }]}
        >
          <InputNumber
            min={0}
            step={1000}
            style={{ width: "100%" }}
            placeholder="Ví dụ: 499000"
          />
        </Form.Item>

        <Form.Item name="discountedPrice" label="Discounted price (VND)">
          <InputNumber
            min={0}
            step={1000}
            style={{ width: "100%" }}
            placeholder="Ví dụ: 399000 (optional)"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save pricing
          </Button>
        </Form.Item>

        <div className={styles.hintText}>
          Gợi ý: 199k–399k phù hợp cho khóa N5/N4 entry-level.
        </div>
      </Form>
    </Card>
  );
}
