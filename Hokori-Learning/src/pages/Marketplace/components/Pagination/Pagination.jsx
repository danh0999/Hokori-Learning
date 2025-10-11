import React from "react";
import styles from "./Pagination.module.scss";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({
  page,
  pages,
  onPrev,
  onNext,
  onJump,
}) {
  const pageNumbers = [];
  pageNumbers.push(page);
  if (page + 1 <= pages) pageNumbers.push(page + 1);
  if (page + 2 <= pages) pageNumbers.push(page + 2);

  return (
    <div className={styles.pagination}>
      <button
        className={styles.button}
        onClick={onPrev}
        disabled={page === 1}
      >
        <FiChevronLeft />
        <span style={{ marginLeft: 4 }}>Trước</span>
      </button>

      {pageNumbers.map((num, index) => (
        <button
          key={index}
          className={`${styles.button} ${
            num === page ? styles.current : ""
          }`}
          onClick={() => onJump(num)}
        >
          {num}
        </button>
      ))}

      {page + 3 < pages && <span className={styles.ellipsis}>…</span>}
      {page + 3 < pages && (
        <button
          className={styles.button}
          onClick={() => onJump(pages)}
        >
          {pages}
        </button>
      )}

      <button
        className={styles.button}
        onClick={onNext}
        disabled={page === pages}
      >
        <span style={{ marginRight: 4 }}>Tiếp</span>
        <FiChevronRight />
      </button>
    </div>
  );
}
