import React from "react";
import styles from "./styles.module.scss";
import { useNavigate } from "react-router-dom";

const joinClassNames = (...classes) => classes.filter(Boolean).join(" ");

export const Button = ({
  content = "Tim kiem",
  to,
  onClick,
  type = "button",
  className = "",
  containerClassName = ""
}) => {
  const { buttonContainer, button } = styles;
  const navigate = useNavigate();

  const handleClick = async (event) => {
    if (onClick) {
      await onClick(event);
      return;
    }
    if (to) {
      navigate(to);
    }
  };

  const mergedContainerClass = joinClassNames(buttonContainer, containerClassName);
  const mergedButtonClass = joinClassNames(button, className);

  return (
    <div className={mergedContainerClass}>
      <button className={mergedButtonClass} onClick={handleClick} type={type}>
        {content}
      </button>
    </div>
  );
};
