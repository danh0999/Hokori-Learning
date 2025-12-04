import React from "react";
import styles from "./Filters.module.scss";
import { Button } from "../../../../components/Button/Button";
import { SearchBar } from "../../../../components/SearchBar/SearchBar";
import { FaStar } from "react-icons/fa";
import { IoIosStarOutline } from "react-icons/io";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];

export default function Filters({ filters, setFilters, onClear }) {
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

  // NEW — search title + teacher in same field
  const handleKeywordSearch = (value) => {
    setFilters({ ...filters, keyword: value });
  };

  return (
    <aside className={styles.filters}>
      <h3 className={styles.title}>Bộ lọc</h3>

      {/* Search */}
      <div className={styles.group}>
        <h4>Tìm kiếm</h4>
        <div className={styles.searchWrap}>
          <SearchBar
            placeholder="Tìm khóa học hoặc giáo viên..."
            onSearch={handleKeywordSearch}
          />
        </div>
      </div>

      {/* JLPT Levels */}
      <div className={`${styles.group} ${styles.jlptRow}`}>
        <h4>Cấp độ JLPT</h4>
        <div className={styles.levelContainer}>
          {JLPT_LEVELS.map((level) => (
            <label key={level} className={styles.levelItem}>
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
      </div>

      {/* Price */}
      <div className={styles.group}>
        <h4>Khoảng giá (VND)</h4>

        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="Từ"
            value={filters.priceMin}
            onChange={(e) =>
              setFilters({ ...filters, priceMin: Number(e.target.value) })
            }
          />

          <span className={styles.hyphen}>-</span>

          <input
            type="number"
            placeholder="Đến"
            value={filters.priceMax}
            onChange={(e) =>
              setFilters({ ...filters, priceMax: Number(e.target.value) })
            }
          />
        </div>

        <div className={styles.presets}>
          <button
            onClick={() =>
              setFilters({ ...filters, priceMin: 0, priceMax: 500000 })
            }
          >
            Dưới 500k
          </button>
          <button
            onClick={() =>
              setFilters({ ...filters, priceMin: 500000, priceMax: 1000000 })
            }
          >
            500k – 1 triệu
          </button>
          <button
            onClick={() =>
              setFilters({ ...filters, priceMin: 1000000, priceMax: 2000000 })
            }
          >
            1 – 2 triệu
          </button>
          <button
            onClick={() =>
              setFilters({ ...filters, priceMin: 2000000, priceMax: 999999999 })
            }
          >
            Trên 2 triệu
          </button>
        </div>
      </div>

      {/* Rating */}
      <div className={styles.group}>
        <h4>Đánh giá</h4>
        {[5, 4, 3, 2, 1].map((rating) => (
          <label key={rating} className={styles.row}>
            <input
              type="checkbox"
              value={rating}
              checked={filters.ratings.includes(rating)}
              onChange={handleRatingChange}
            />
            <span className={styles.stars}>
              {Array.from({ length: 5 }, (_, i) =>
                i < rating ? (
                  <FaStar key={i} color="#facc15" size={14} />
                ) : (
                  <IoIosStarOutline key={i} color="#d1d5db" size={14} />
                )
              )}
              <span className={styles.ratingLabel}>
                ({rating === 1 ? "Tất cả" : `Từ ${rating} sao trở lên`})
              </span>
            </span>
          </label>
        ))}
      </div>

      {/* Clear Filters */}
      <div className={styles.buttonRow}>
        <div className={styles.buttonCenter}>
          <Button
            content="Xóa bộ lọc"
            onClick={onClear}
            containerClassName={`${styles.buttonContainer} ${styles.secondary}`}
          />
        </div>
      </div>
    </aside>
  );
}
