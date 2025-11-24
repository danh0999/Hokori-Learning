// src/pages/Teacher/Courses/Create-Course/components/PricingStep/PricingStep.jsx
import React, { useEffect } from "react";
import { Card, Form, InputNumber, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchCourseTree,
  updateCourseThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";

export default function PricingStep({ courseId }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { currentCourseMeta, saving } = useSelector(
    (state) => state.teacherCourse
  );

  // Khi load meta -> set lại giá
  useEffect(() => {
    if (!currentCourseMeta) return;

    form.setFieldsValue({
      price: currentCourseMeta.priceCents || 0,
    });
  }, [currentCourseMeta, form]);

  const handleFinish = async (values) => {
    if (!courseId) return;

    const payload = {
      ...currentCourseMeta,
      // Lưu đúng số tiền VND (không nhân / chia gì nữa)
      priceCents: values.price || 0,
      currency: "VND",
    };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );

    if (updateCourseThunk.fulfilled.match(action)) {
      message.success("Đã lưu giá khoá học.");
      dispatch(fetchCourseTree(courseId));
    } else {
      message.error("Không lưu được giá, vui lòng thử lại.");
    }
  };

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Pricing</div>
        <div className={styles.stepDesc}>
          Set your course price in VND. Learners will see it with currency
          formatting.
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
          label="Price (VND)"
          rules={[
            {
              validator(_, value) {
                if (value === 0 || value > 0) return Promise.resolve();
                return Promise.reject("Giá phải lớn hơn hoặc bằng 0.");
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            step={1000}
            style={{ width: "100%" }}
            placeholder="Ví dụ: 200000"
            // Hiển thị 200000 -> "200.000 ₫"
            formatter={(value) => {
              if (value == null || value === "") return "";
              const str = String(value).replace(/\D/g, "");
              return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
            }}
            // Người dùng sửa -> convert về number (bỏ . và ₫)
            parser={(value) => {
              if (!value) return 0;
              return Number(
                value.toString().replace(/\s?₫/g, "").replace(/\./g, "")
              );
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save pricing
          </Button>
        </Form.Item>

        <div className={styles.hintText}>
          Ví dụ: gõ <b>200000</b> sẽ hiển thị là <b>200.000 ₫</b>.
        </div>
      </Form>
    </Card>
  );
}
