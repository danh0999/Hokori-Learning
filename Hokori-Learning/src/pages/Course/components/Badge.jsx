import React from "react";
import styles from "./badge.module.scss";

export const Badge = ({ text, small }) => {
  const { badge, badgeSmall } = styles;
  return (
    <span className={`${badge} ${small ? badgeSmall : ""}`}>{text}</span>
  );
};
