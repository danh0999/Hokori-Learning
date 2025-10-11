import React, { useState } from "react";
import styles from "./styles.module.scss";
import { GoSearch } from "react-icons/go";

export const SearchBar = ({ placeholder, onSearch }) => {
  const { searchContainer, input, icon } = styles;
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // goi ham onSearch mõi khi gõ
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={searchContainer}>
      <input
        className={input}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={handleChange}
      />
      <span className={icon}>
        <GoSearch />
      </span>
    </div>
  );
};
