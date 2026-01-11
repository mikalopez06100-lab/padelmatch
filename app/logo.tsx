"use client";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showTagline?: boolean;
}

export function Logo({ size = "medium", showTagline = false }: LogoProps) {
  const sizes = {
    small: { fontSize: 24, iconSize: 32, taglineSize: 12 },
    medium: { fontSize: 32, iconSize: 40, taglineSize: 14 },
    large: { fontSize: 48, iconSize: 56, taglineSize: 16 },
  };

  const config = sizes[size];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: config.iconSize,
            lineHeight: 1,
          }}
        >
          🎾
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: config.fontSize,
              fontWeight: 700,
              color: "#1e40af",
              letterSpacing: -0.5,
            }}
          >
            PÁDEL
          </span>
          <span
            style={{
              fontSize: config.fontSize * 0.9,
              fontWeight: 700,
              color: "#3b82f6",
              letterSpacing: -0.3,
            }}
          >
            MATCH
          </span>
        </div>
      </div>
      {showTagline && (
        <span
          style={{
            fontSize: config.taglineSize,
            color: "#6b7280",
            fontWeight: 400,
            marginTop: 2,
          }}
        >
          Organise your game.
        </span>
      )}
    </div>
  );
}
