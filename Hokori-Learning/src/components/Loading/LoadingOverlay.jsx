import React from "react";
import "./LoadingOverlay.scss";

export default function LoadingOverlay() {
  return (
    <div className="hokori-loading-overlay">
      <div className="hokori-loading-card">
        <div className="hokori-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
