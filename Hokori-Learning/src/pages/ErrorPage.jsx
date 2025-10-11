import React from "react";
import { Link, useRouteError } from "react-router-dom";
import "./ErrorPage.scss";

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="error-page">
      <div className="error-box">
        {/* --- HOKORI BOT V4 --- */}
        <div className="hokori-bot">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 230"
            width="120"
            height="120"
          >
            {/* Antennas */}
            <line
              x1="80"
              y1="35"
              x2="80"
              y2="15"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="120"
              y1="35"
              x2="120"
              y2="15"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="80" cy="13" r="3.5" fill="#2563eb" />
            <circle cx="120" cy="13" r="3.5" fill="#2563eb" />

            {/* Head */}
            <rect
              x="55"
              y="35"
              width="90"
              height="60"
              rx="25"
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
            />
            <circle cx="80" cy="65" r="6" fill="#000" />
            <circle cx="120" cy="65" r="6" fill="#000" />
            <rect x="90" y="80" width="20" height="3" rx="1.5" fill="#000" />

            {/* Body */}
            <rect
              x="65"
              y="100"
              width="70"
              height="70"
              rx="20"
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
            />
            {/* Letter H in belly */}
            <text
              x="100"
              y="145"
              textAnchor="middle"
              fontSize="40"
              fontWeight="800"
              fontFamily="'Poppins', sans-serif"
              fill="#000"
            >
              H
            </text>

            {/* Arms */}
            <rect
              x="40"
              y="110"
              width="15"
              height="40"
              rx="8"
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
            />
            <rect
              x="145"
              y="110"
              width="15"
              height="40"
              rx="8"
              fill="#fff"
              stroke="#000"
              strokeWidth="3"
            />

            {/* Legs */}
            <rect x="80" y="170" width="15" height="25" rx="5" fill="#000" />
            <rect x="105" y="170" width="15" height="25" rx="5" fill="#000" />
          </svg>
        </div>

        <h1>おっと! (Oops!)</h1>
        <h2>Something went wrong...</h2>
        <p className="message">
          {error?.statusText ||
            error?.message ||
            "Page not found or an unexpected error occurred."}
        </p>

        <Link to="/" className="home-btn">
          ← Back to Home
        </Link>
      </div>

      <footer>© {new Date().getFullYear()} Hokori Learning</footer>
    </div>
  );
};

export default ErrorPage;
