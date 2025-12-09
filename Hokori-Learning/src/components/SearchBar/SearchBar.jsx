import React from "react";
import styles from "./styles.module.scss";
import { GoSearch } from "react-icons/go";

export const SearchBar = ({ placeholder, onSearch, value }) => {
  const { searchContainer, input, icon } = styles;

  const handleChange = (e) => {
    const val = e.target.value;

    if (onSearch) onSearch(val);
  };

  return (
    <div className={searchContainer}>
      <input
        className={input}
        type="text"
        value={value} // ⭐ controlled từ Filters
        placeholder={placeholder}
        onChange={handleChange}
      />
      <span className={icon}>
        <GoSearch />
      </span>
    </div>
  );
};
