import React, { forwardRef, useMemo } from "react";


const ProgressBar = forwardRef(
  (
    {
      value = 0,
      label,
      showPercent = true,
      size = "md",
      rounded = true,
      striped = false,
      animated = false,
      className = "",
      style,
      barColor = "#2563eb", // Hokori primary
      trackColor = "#e5e7eb",
      "aria-label": ariaLabel,
      "data-testid": testId,
    },
    ref
  ) => {
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));

    const heights = { sm: 6, md: 8, lg: 12 };
    const height = heights[size] ?? heights.md;
    const radius = rounded ? 999 : 6;

    const barStyle = useMemo(
      () => ({
        width: `${clamped}%`,
        height,
        background: barColor,
        borderRadius: radius,
        transition: "width 220ms ease",
        ...(striped && {
          backgroundImage:
            "linear-gradient(45deg, rgba(255,255,255,.25) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.25) 50%, rgba(255,255,255,.25) 75%, transparent 75%, transparent)",
          backgroundSize: "1rem 1rem",
          animation: animated ? "progressStripes 1s linear infinite" : undefined,
        }),
      }),
      [clamped, height, barColor, radius, striped, animated]
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
        }}
      >
        {label ? (
          <div
            style={{
              fontSize: 14,
              color: "#111827",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title={label}
          >
            {label}
          </div>
        ) : null}

        <div
          role="progressbar"
          aria-label={ariaLabel || label || "Tiến độ"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
          data-testid={testId}
          style={{
            position: "relative",
            flex: 1,
            height,
            background: trackColor,
            borderRadius: radius,
            overflow: "hidden",
          }}
        >
          <div style={barStyle} />
        </div>

        {showPercent ? (
          <div
            style={{
              minWidth: 36,
              textAlign: "right",
              fontSize: 14,
              color: "#111827",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {Math.round(clamped)}%
          </div>
        ) : null}

        {/* keyframes local */}
        <style>{`
          @keyframes progressStripes {
            from { background-position: 0 0; }
            to   { background-position: 1rem 0; }
          }
        `}</style>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
