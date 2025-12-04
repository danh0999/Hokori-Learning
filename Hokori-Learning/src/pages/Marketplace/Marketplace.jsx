import React, { useMemo, useState, useEffect } from "react";
import styles from "./marketplace.module.scss";
import Filters from "./components/Filters/Filters";
import CourseGrid from "./components/CourseGrid/CourseGrid";
import Pagination from "./components/Pagination/Pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../../redux/features/courseSlice";

export default function Marketplace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux data
  const {
    list: courses,
    loading,
    error,
  } = useSelector((state) => state.courses);

  // ================================
  // ⭐ FILTERS STATE — MIN/MAX version
  // ================================
  const [filters, setFilters] = useState({
    levels: [],
    priceMin: 0,
    priceMax: 2000000,
    ratings: [],
    keyword: "",
  });

  const [sort, setSort] = useState("Phổ biến");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // Fetch API
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // RESET FILTERS
  const clearAll = () =>
    setFilters({
      levels: [],
      priceMin: 0,
      priceMax: 2000000,
      ratings: [],
      keyword: "",
    });

  // ============================
  // ⭐ FILTER + SORT — FINAL VERSION
  // ============================
  const filtered = useMemo(() => {
    let items = [...(courses ?? [])];

    // LEVEL FILTER
    if (filters.levels.length > 0) {
      items = items.filter((c) =>
        c.level ? filters.levels.includes(c.level) : true
      );
    }

    // RATING FILTER
    if (filters.ratings.length > 0) {
      const ratingMin = Math.min(...filters.ratings);
      items = items.filter((c) => (c.rating ?? 0) >= ratingMin);
    }

    // PRICE FILTER — MIN–MAX
    const priceMin = Number(filters.priceMin) || 0;
    const priceMax = Number(filters.priceMax) || 999999999;

    items = items.filter((c) => {
      const price = c.price ?? 0;
      return price >= priceMin && price <= priceMax;
    });

    // KEYWORD SEARCH (course title + teacher)
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();

      items = items.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const teacher = (c.teacherName ?? c.teacher ?? "").toLowerCase();
        return title.includes(q) || teacher.includes(q);
      });
    }

    // SORTING
    switch (sort) {
      case "Giá tăng":
        items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "Giá giảm":
        items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "Đánh giá cao":
        items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        break;
    }

    return items;
  }, [courses, filters, sort]);

  // ============================
  // Pagination
  // ============================
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedCourses = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  // ============================
  // URL-level preselect
  // ============================
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
        Khám phá các khóa học JLPT và tiếng Nhật hiệu quả
      </p>

      <div className={styles.container}>
        {/* SIDEBAR FILTERS */}
        <aside className={styles.sidebar}>
          <Filters
            filters={filters}
            setFilters={setFilters}
            onClear={clearAll}
            onApply={() => {}}
          />
        </aside>

        {/* CONTENT */}
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

          {/* RESULTS */}
          <div className={styles.resultsArea}>
            {loading ? (
              <div className={styles.loading}>Đang tải...</div>
            ) : error ? (
              <div className={styles.empty}>Lỗi tải dữ liệu: {error}</div>
            ) : pagedCourses.length > 0 ? (
              <CourseGrid courses={pagedCourses} />
            ) : (
              <div className={styles.empty}>Không có khóa học nào</div>
            )}
          </div>
        </section>
      </div>

      {/* PAGINATION */}
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
