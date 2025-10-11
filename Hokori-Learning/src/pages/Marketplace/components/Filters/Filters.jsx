import React from "react";
import styles from "./Filters.module.scss";
import { Button } from "../../../../components/Button/Button";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";
import { FaStar } from "react-icons/fa";
import { IoIosStarOutline } from "react-icons/io";
const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const RATING_OPTIONS = [4, 4.5];

export default function Filters({ filters, setFilters, onClear, onApply }) {
  const handleLevelChange = (event) => {
    const { value, checked } = event.target;
    const nextLevels = checked
      ? [...filters.levels, value]
      : filters.levels.filter((item) => item !== value);

    setFilters({ ...filters, levels: nextLevels });
  };

  const handleRatingChange = (event) => {
    const { value, checked } = event.target;
    const ratingValue = Number(value);
    const nextRatings = checked
      ? [...filters.ratings, ratingValue]
      : filters.ratings.filter((item) => item !== ratingValue);

    setFilters({ ...filters, ratings: nextRatings });
  };

  const handleTeacherSearch = (value) => {
    setFilters({ ...filters, teacher: value });
  };

  return (
    <aside className={styles.filters}>
      <h3 className={styles.title}>Bộ lọc</h3>

      <div className={styles.group}>
        <h4>Cấp độ JLPT</h4>
        {JLPT_LEVELS.map((level) => (
          <label key={level} className={styles.row}>
            <input
              type="checkbox"
              value={level}
              checked={filters.levels.includes(level)}
              onChange={handleLevelChange}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <h4>Giá (VND)</h4>

        <div className={styles.rangeContainer}>
          <input
            type="range"
            min={0}
            max={2000000}
            step={50000}
            value={filters.priceMax}
            onChange={(e) =>
              setFilters({ ...filters, priceMax: Number(e.target.value) })
            }
            className={styles.range}
          />

          {/* Các mốc giá (giống thước đo) */}
          <div className={styles.scaleMarks}>
            {[0, 500000, 1000000, 1500000, 2000000].map((mark, i) => (
              <div key={i} className={styles.mark}>
                <span className={styles.line}></span>
                <span className={styles.label}>
                  {mark.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <h4>Đánh giá</h4>
        {[
          { value: 5, label: "5 sao" },
          { value: 4, label: "Từ 4 sao trở lên" },
          { value: 3, label: "Từ 3 sao trở lên" },
          { value: 2, label: "Từ 2 sao trở lên" },
          { value: 1, label: "Tất cả" },
        ].map((rating) => (
          <label key={rating.value} className={styles.row}>
            <input
              type="checkbox"
              value={rating.value}
              checked={filters.ratings.includes(rating.value)}
              onChange={handleRatingChange}
            />
            <span className={styles.stars}>
              {Array.from({ length: 5 }, (_, i) =>
                i < rating.value ? (
                  <FaStar key={i} color="#facc15" size={14} /> // sao vàng
                ) : (
                  <IoIosStarOutline key={i} color="#d1d5db" size={14} /> // sao rỗng xám
                )
              )}
              <span className={styles.ratingLabel}> ({rating.label})</span>
            </span>
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <h4>Giáo viên</h4>
        <div className={styles.searchWrap}>
          <SearchBar
            placeholder="Tìm giáo viên..."
            onSearch={handleTeacherSearch}
          />
        </div>
      </div>

      <div className={styles.buttonRow}>
        <Button
          content="Tìm"
          onClick={onApply}
          containerClassName={styles.buttonContainer}
        />
        <Button
          content="Xóa bộ lọc"
          onClick={onClear}
          containerClassName={`${styles.buttonContainer} ${styles.secondary}`}
        />
      </div>
    </aside>
  );
}
