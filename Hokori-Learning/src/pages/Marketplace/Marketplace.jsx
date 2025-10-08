import React, { useMemo, useState, useEffect } from "react";
import styles from "./marketplace.module.scss";
import Filters from "./components/Filters/Filters";
import CourseGrid from "./components/CourseGrid/CourseGrid";
import Pagination from "./components/Pagination/Pagination";
import { useNavigate, useSearchParams } from "react-router-dom";
const MOCK = [
  {
    id: 1,
    title: "JLPT N5 – Nền tảng",
    teacher: "Sensei Tanaka",
    level: "N5",
    rating: 4.8,
    students: 1200,
    price: 499000,
    tags: ["Kèm AI", "Bán chạy"],
  },
  {
    id: 2,
    title: "JLPT N4 – Trung cấp",
    teacher: "Sensei Yamada",
    level: "N4",
    rating: 4.7,
    students: 890,
    price: 699000,
    tags: ["Mới"],
  },
  {
    id: 3,
    title: "JLPT N3 – Cao cấp",
    teacher: "Sensei Sato",
    level: "N3",
    rating: 4.9,
    students: 650,
    price: 899000,
    tags: ["Kèm AI"],
  },
  {
    id: 4,
    title: "JLPT N2 – Chuyên sâu",
    teacher: "Sensei Suzuki",
    level: "N2",
    rating: 4.6,
    students: 540,
    price: 999000,
    tags: ["Hot"],
  },
  {
    id: 5,
    title: "JLPT N1 – Luyện thi",
    teacher: "Sensei Ito",
    level: "N1",
    rating: 4.5,
    students: 410,
    price: 1199000,
    tags: ["Mới"],
  },
  {
    id: 6,
    title: "Từ vựng N5 mở rộng",
    teacher: "Sensei Arai",
    level: "N5",
    rating: 4.3,
    students: 380,
    price: 299000,
    tags: [],
  },
  {
    id: 7,
    title: "Ngữ pháp N4 chuyên sâu",
    teacher: "Sensei Kato",
    level: "N4",
    rating: 4.2,
    students: 290,
    price: 399000,
    tags: [],
  },
  {
    id: 8,
    title: "Đọc hiểu N3 nâng cao",
    teacher: "Sensei Mori",
    level: "N3",
    rating: 4.4,
    students: 230,
    price: 459000,
    tags: [],
  },
  {
    id: 9,
    title: "Nghe hiểu N2",
    teacher: "Sensei Ogawa",
    level: "N2",
    rating: 4.1,
    students: 210,
    price: 499000,
    tags: [],
  },
  {
    id: 10,
    title: "Tổng hợp N1",
    teacher: "Sensei Aki",
    level: "N1",
    rating: 4.0,
    students: 180,
    price: 699000,
    tags: [],
  },
];

export default function Marketplace() {
  const [filters, setFilters] = useState({
    levels: [],
    priceMax: 2000000,
    ratings: [],
    teacher: "",
  });
  const [sort, setSort] = useState("Phổ biến");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const clearAll = () =>
    setFilters({ levels: [], priceMax: 2000000, ratings: [], teacher: "" });

  // FILTER + SORT
  const filtered = useMemo(() => {
    let items = [...MOCK];

    // JLPT levels
    if (filters.levels.length)
      items = items.filter((c) => filters.levels.includes(c.level));

    // Ratings
    if (filters.ratings.length) {
      const min = Math.min(...filters.ratings);
      items = items.filter((c) => c.rating >= min);
    }

    // Giá
    items = items.filter((c) => c.price <= filters.priceMax);

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
  }, [filters, sort]);

  // Pagination logic
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pagedCourses = filtered.slice(start, start + PAGE_SIZE);
  const navigate = useNavigate();
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);
  const [searchParams] = useSearchParams();
  const preselectedLevel = searchParams.get("level");

  useEffect(() => {
    if (preselectedLevel) {
      setFilters((prev) => ({
        ...prev,
        levels: [preselectedLevel.toUpperCase()], // đảm bảo viết hoa cho khớp dữ liệu
      }));
    }
  }, [preselectedLevel]);

  return (
    <div className={styles.marketplace}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        {/* ✅ Trang chủ click điều hướng */}
        <span
          className={styles.link}
          onClick={() => navigate("/")} // <-- đường dẫn Home
        >
          Trang chủ
        </span>
        {" / "}
        <span>Marketplace</span>
      </nav>

      <h1 className={styles.heading}>Khóa học tiếng Nhật</h1>
      <p className={styles.subheading}>
        Khám phá các khóa học JLPT và luyện thi tiếng Nhật hiệu quả
      </p>

      {/* Layout chính */}
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

          {/* Courses hoặc empty */}
          <div className={styles.resultsArea}>
            {pagedCourses.length ? (
              <CourseGrid courses={pagedCourses} />
            ) : (
              <div className={styles.empty}>Không có khóa học nào phù hợp</div>
            )}
          </div>
        </section>
      </div>

      {/* Pagination tách riêng, cố định gần footer */}
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
