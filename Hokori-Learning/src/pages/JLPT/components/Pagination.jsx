import React from "react";
import styles from "./Pagination.module.scss";

const Pagination = () => {
  return (
    <section className={styles.pagination}>
      <nav>
        <button disabled>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button className={styles.active}>1</button>
        <button>2</button>
        <button>3</button>
        <span>...</span>
        <button>10</button>
        <button>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </nav>
    </section>
  );
};

export default Pagination;
