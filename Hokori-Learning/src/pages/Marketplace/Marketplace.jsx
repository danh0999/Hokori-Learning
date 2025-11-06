import React, { useMemo, useState, useEffect } from "react";
import styles from "./marketplace.module.scss";
import Filters from "./components/Filters/Filters";
import CourseGrid from "./components/CourseGrid/CourseGrid";
import Pagination from "./components/Pagination/Pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../../redux/features/courseSlice"; // ✅ lấy mock từ slice

export default function Marketplace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Lấy dữ liệu từ Redux Store
  const { list: courses, loading } = useSelector((state) => state.courses);

  const [filters, setFilters] = useState({
    levels: [],
    priceMax: 2000000,
    ratings: [],
    teacher: "",
  });
  const [sort, setSort] = useState("Phổ biến");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // ✅ Gọi load dữ liệu mock từ Redux (sau này thay API)
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const clearAll = () =>
    setFilters({ levels: [], priceMax: 2000000, ratings: [], teacher: "" });

  // ===== FILTER + SORT =====
  const filtered = useMemo(() => {
    let items = [...courses]; // ✅ Lấy từ Redux

    // JLPT levels
    if (filters.levels.length)
      items = items.filter((c) => filters.levels.includes(c.level));

    // Ratings
    if (filters.ratings.length) {
      const min = Math.min(...filters.ratings);
      items = items.filter((c) => c.rating >= min);
    }

    // Giá
    const max = Number(filters.priceMax) || 2000000;
    items = items.filter((c) => c.price <= max);

    // Giáo viên
    if (filters.teacher.trim()) {
      const query = filters.teacher.toLowerCase();
      items = items.filter((c) => c.teacher.toLowerCase().includes(query));
    }

    // Sort
    switch (sort) {
      case "Giá tăng":
        items.sort((a, b) => a.price - b.price);
        break;
      case "Giá giảm":
        items.sort((a, b) => b.price - a.price);
        break;
      case "Đánh giá cao":
        items.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return items;
  }, [courses, filters, sort]);

  // ===== Pagination =====
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedCourses = filtered.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  const [searchParams] = useSearchParams();
  const preselectedLevel = searchParams.get("level");

  useEffect(() => {
    if (preselectedLevel) {
      setFilters((prev) => ({
        ...prev,
        levels: [preselectedLevel.toUpperCase()],
      }));
    }
  }, [preselectedLevel]);

  return (
    <div className={styles.marketplace}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <span className={styles.link} onClick={() => navigate("/")}>
          Trang chủ
        </span>
        {" / "}
        <span>Marketplace</span>
      </nav>

      <h1 className={styles.heading}>Khóa học tiếng Nhật</h1>
      <p className={styles.subheading}>
        Khám phá các khóa học JLPT và luyện thi tiếng Nhật hiệu quả
      </p>

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <Filters
            filters={filters}
            setFilters={setFilters}
            onClear={clearAll}
            onApply={() => {}}
          />
        </aside>

        <section className={styles.content}>
          <div className={styles.topbar}>
            <p className={styles.count}>
              {filtered.length > 0
                ? `${filtered.length} khóa học được tìm thấy`
                : ""}
            </p>

            <select
              className={styles.sort}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>Phổ biến</option>
              <option>Giá tăng</option>
              <option>Giá giảm</option>
              <option>Đánh giá cao</option>
            </select>
          </div>

          {/* Courses hoặc Empty */}
          <div className={styles.resultsArea}>
            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : pagedCourses.length ? (
              <CourseGrid courses={pagedCourses} />
            ) : (
              <div className={styles.empty}>Không có khóa học nào phù hợp</div>
            )}
          </div>
        </section>
      </div>

      <div className={styles.paginationContainer}>
        <Pagination
          page={page}
          pages={pages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(pages, p + 1))}
          onJump={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
