// src/pages/Teacher/Courses/Create-Course/components/PricingStep/PricingStep.jsx
import React, { useEffect } from "react";
import { Card, Form, InputNumber, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchCourseTree,
  updateCourseThunk,
} from "../../../../../../redux/features/teacherCourseSlice.js";

import styles from "./styles.module.scss";
import { toast } from "react-toastify";

/**
 * Props:
 *  - courseId
 *  - onNext?: () => void
 *  - onBack?: () => void
 */
export default function PricingStep({ courseId, onNext, onBack }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { currentCourseMeta, saving } = useSelector(
    (state) => state.teacherCourse
  );

  // Khi load meta -> set lại giá
  useEffect(() => {
    if (!currentCourseMeta) return;

    form.setFieldsValue({
      price: currentCourseMeta.priceCents ?? 0,
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
      toast.success("Đã lưu giá khoá học.");
      dispatch(fetchCourseTree(courseId));

      // Sau khi lưu thành công, chuyển step nếu onNext có truyền vào
      if (typeof onNext === "function") {
        onNext();
      }
    } else {
      toast.error("Không lưu được giá, vui lòng thử lại.");
    }
  };

  return (
    <Card className={styles.cardBig}>
      <div className={styles.stepHeader}>
        <div className={styles.stepTitle}>Giá khoá học</div>
      </div>

      <Form
        form={form}
        layout="vertical"
        className={styles.formGrid}
        onFinish={handleFinish}
      >
        <Form.Item
          name="price"
          label="Giá (VND)"
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
            placeholder="Ví dụ: 200.000"
            // Hiển thị 200000 -> "200.000"
            formatter={(value) => {
              if (value == null || value === "") return "";
              // chỉ lấy phần số và format dấu chấm
              const numeric = String(value).replace(/\D/g, "");
              if (!numeric) return "";
              return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }}
            // Người dùng sửa -> convert về number (bỏ .)
            parser={(value) => {
              if (!value) return 0;
              const numeric = value.toString().replace(/\./g, "");
              const num = Number(numeric);
              return Number.isNaN(num) ? 0 : num;
            }}
          />
        </Form.Item>

        <Form.Item>
          <div className={styles.stepFooter}>
            {typeof onBack === "function" && (
              <Button onClick={onBack}>Quay lại</Button>
            )}
            <Button type="primary" htmlType="submit" loading={saving}>
              {typeof onNext === "function" ? "Lưu & tiếp tục" : "Lưu giá"}
            </Button>
          </div>
        </Form.Item>

        <div className={styles.hintText}>
          Ví dụ: gõ <b>200000</b> sẽ hiển thị là <b>200.000</b>.
        </div>
      </Form>
    </Card>
  );
}
