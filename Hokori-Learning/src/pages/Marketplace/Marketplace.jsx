// src/pages/Marketplace/Marketplace.jsx
import React, { useMemo, useState, useEffect } from "react";
import styles from "./marketplace.module.scss";
import Filters from "./components/Filters/Filters";
import CourseGrid from "./components/CourseGrid/CourseGrid";
import Pagination from "./components/Pagination/Pagination";
import SortBar from "./components/SortBar/SortBar"; // Component SortBar mới
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../../redux/features/courseSlice";

export default function Marketplace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux data
  const { list: courses, loading, error } = useSelector(
    (state) => state.courses
  );

  // Filters State
  const [filters, setFilters] = useState({
    levels: [],
    priceMin: 0,
    priceMax: 999999999, 
    ratings: [],
    keyword: "",
  });

  // Sort State (Mặc định: Mới nhất)
  const [sort, setSort] = useState("Mới nhất");
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
      priceMax: 999999999,
      ratings: [],
      keyword: "",
    });

  // ============================
  // ⭐ FILTER + SORT — LOGIC
  // ============================
  const filtered = useMemo(() => {
    let items = [...(courses ?? [])];

    // 1. Filter by Level
    if (filters.levels.length > 0) {
      items = items.filter((c) =>
        c.level ? filters.levels.includes(c.level) : true
      );
    }

    // 2. Filter by Rating
    if (filters.ratings.length > 0) {
      const ratingMin = Math.min(...filters.ratings);
      items = items.filter((c) => (c.rating ?? 0) >= ratingMin);
    }

    // 3. Filter by Price Range (Sidebar)
    const priceMin = Number(filters.priceMin) || 0;
    const priceMax = Number(filters.priceMax) || 999999999;

    items = items.filter((c) => {
      const effectivePrice =
        c.discountedPriceCents && c.discountedPriceCents > 0
          ? c.discountedPriceCents
          : c.priceCents ?? 0;
      
      return effectivePrice >= priceMin && effectivePrice <= priceMax;
    });

    // 4. ⭐ Search keyword (Title, Teacher OR Exact Price)
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase();
      const searchNumber = Number(q); // Ép kiểu để tìm giá

      items = items.filter((c) => {
        const title = (c.title ?? "").toLowerCase();
        const teacher = (c.teacherName ?? c.teacher ?? "").toLowerCase();
        
        // Giá thực tế
        const effectivePrice =
          c.discountedPriceCents && c.discountedPriceCents > 0
            ? c.discountedPriceCents
            : c.priceCents ?? 0;

        // Logic: Tìm chữ trong Tên/GV HOẶC Tìm đúng giá
        const matchText = title.includes(q) || teacher.includes(q);
        const matchPrice = !isNaN(searchNumber) && effectivePrice === searchNumber;

        return matchText || matchPrice;
      });
    }

    // 5. ⭐ Xử lý Sort Dropdown
    switch (sort) {
      case "Miễn phí":
        // Lọc lấy khóa có giá = 0
        items = items.filter((c) => {
           const price = c.discountedPriceCents > 0 ? c.discountedPriceCents : (c.priceCents ?? 0);
           return price === 0;
        });
        break;

      case "Giá tăng":
        items.sort(
          (a, b) =>
            ((a.discountedPriceCents > 0 ? a.discountedPriceCents : a.priceCents) ?? 0) -
            ((b.discountedPriceCents > 0 ? b.discountedPriceCents : b.priceCents) ?? 0)
        );
        break;

      case "Giá giảm":
        items.sort(
          (a, b) =>
            ((b.discountedPriceCents > 0 ? b.discountedPriceCents : b.priceCents) ?? 0) -
            ((a.discountedPriceCents > 0 ? a.discountedPriceCents : a.priceCents) ?? 0)
        );
        break;

      case "Đánh giá cao":
        items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;

      case "Mới nhất":
        // Sắp xếp theo ngày tạo (giả sử có trường createdAt)
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      
      case "Phổ biến":
      default:
        // Giữ nguyên hoặc sort theo logic khác nếu có
        break;
    }

    return items;
  }, [courses, filters, sort]);

  // Pagination Logic
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pagedCourses = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  // URL Params Logic
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
        {/* Filters Sidebar */}
        <aside className={styles.sidebar}>
          <Filters
            filters={filters}
            setFilters={setFilters}
            onClear={clearAll}
          />
        </aside>

        {/* Content Area */}
        <section className={styles.content}>
          <div className={styles.topbar}>
            {/* SortBar mới với đầy đủ tính năng */}
            <SortBar 
              total={filtered.length} 
              sort={sort} 
              onSort={setSort} 
            />
          </div>

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

      {/* Pagination */}
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