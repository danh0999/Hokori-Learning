import React from "react";
import styles from "./styles.module.scss";

export const SearchBar = ({ placeholder }) => {
  const { searchContainer, input, icon } = styles;

  return (
    <div className={searchContainer}>
      <input className={input} type="text" placeholder={placeholder} />
      <span className={icon}>🔍</span>
    </div>
  );
};
