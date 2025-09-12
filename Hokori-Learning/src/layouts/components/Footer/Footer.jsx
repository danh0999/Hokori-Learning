import React from "react";
import styles from "./styles.module.scss";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
const {
  footer,
  wrap,
  grid,
  brandRow,
  badge,
  badgeText,
  brand,
  desc,
  title,
  list,
  link,
  social,
  chip,
  copy,
} = styles;

export const Footer = () => {
  return (
    <footer className={footer}>
      <div className={wrap}>
        <div className={grid}>
          <div>
            <div className={brandRow}>
              <div className={badge}>
                <span className={badgeText}>H</span>
              </div>
              <span className={brand}>Hokori</span>
            </div>
            <p className={desc}>Học tiếng Nhật hiệu quả cùng Hokori</p>
          </div>

          <div>
            <h3 className={title}>Khóa học</h3>
            <ul className={list}>
              <li className={link}>Tiếng Nhật N5</li>
              <li className={link}>Tiếng Nhật N4</li>
              <li className={link}>Tiếng Nhật N3</li>
            </ul>
          </div>

          <div>
            <h3 className={title}>Hỗ trợ</h3>
            <ul className={list}>
              <li className={link}>Liên hệ</li>
              <li className={link}>FAQ</li>
              <li className={link}>Chính sách</li>
            </ul>
          </div>

          <div>
            <h3 className={title}>Theo dõi</h3>
            <div className={social}>
              <span className={chip}><FaSquareFacebook /></span>
              <span className={chip}><FaYoutube /></span>
              <span className={chip}><FaInstagram /></span>
            </div>
          </div>
        </div>

        <div className={copy}>© 2025 Hokori. Tất cả quyền được bảo lưu.</div>
      </div>
    </footer>
  );
};
