// src/pages/Teacher/Courses/Create-Course/components/PricingStep/PricingStep.jsx
import React, { useEffect, useState } from "react";
import { Card, InputNumber, Button } from "antd";
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
export default function PricingStep({
  courseId,
  onNext,
  onBack,
  disableEditing,
}) {
  const dispatch = useDispatch();

  const { currentCourseMeta, saving } = useSelector(
    (state) => state.teacherCourse
  );

  // local state cho giá
  const [price, setPrice] = useState(0);

  // Khi load meta -> set lại giá
  useEffect(() => {
    if (!currentCourseMeta) return;

    // BE trả priceCents (VND)
    const bePrice = currentCourseMeta.priceCents;
    setPrice(typeof bePrice === "number" ? bePrice : 0);
  }, [currentCourseMeta]);

  const handleSavePrice = async () => {
    if (!courseId || !currentCourseMeta) return;

    const numericPrice = Number(price) || 0;

    // ✅ Rule: 0 (free) hoặc > 2000
    if (!(numericPrice === 0 || numericPrice > 2000)) {
      toast.error("Giá phải bằng 0 (khoá miễn phí) hoặc lớn hơn 2.000 VND.");
      return;
    }

    const payload = {
      ...currentCourseMeta,
      priceCents: numericPrice,
      currency: "VND",
    };

    const action = await dispatch(
      updateCourseThunk({ courseId, data: payload })
    );

    if (updateCourseThunk.fulfilled.match(action)) {
      toast.success("Đã lưu giá khoá học.");
      await dispatch(fetchCourseTree(courseId));

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

      <div className={styles.formGrid}>
        <div className="ant-form-item">
          <label className="ant-form-item-label">
            <span>Giá (VND)</span>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <InputNumber
              min={0}
              step={1000}
              style={{ width: "100%" }}
              placeholder="Ví dụ: 200.000"
              value={price}
              onChange={(val) => {
                // antd InputNumber onChange trả number hoặc null
                setPrice(typeof val === "number" ? val : 0);
              }}
              disabled={disableEditing}
              // Hiển thị 200000 -> "200.000"
              formatter={(value) => {
                if (value == null || value === "") return "";
                const numeric = String(value).replace(/\D/g, "");
                if (!numeric) return "";
                return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              }}
              // Convert text nhập về number
              parser={(value) => {
                if (!value) return 0;
                const numeric = value.toString().replace(/\./g, "");
                const num = Number(numeric);
                return Number.isNaN(num) ? 0 : num;
              }}
            />

            {/* Nút set giá về 0 (free) */}
            <Button
              type="default"
              onClick={() => setPrice(0)}
              disabled={disableEditing}
            >
              Miễn phí
            </Button>
          </div>
        </div>

        <div className={styles.stepFooter}>
          {typeof onBack === "function" && (
            <Button onClick={onBack}>Quay lại</Button>
          )}
          <Button
            type="primary"
            onClick={handleSavePrice}
            loading={saving}
            disabled={disableEditing}
          >
            {typeof onNext === "function" ? "Lưu & tiếp tục" : "Lưu giá"}
          </Button>
        </div>

        <div className={styles.hintText}>
          Ví dụ: gõ <b>200000</b> sẽ hiển thị là <b>200.000</b>.
        </div>
      </div>
    </Card>
  );
}
