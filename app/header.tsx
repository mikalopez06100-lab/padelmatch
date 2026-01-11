"use client";

import { AuthButton } from "./auth-button";

export function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        borderBottom: "1px solid #1f1f1f",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 100,
      }}
    >
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flex: 1,
        }}
      >
        <AuthButton />
      </div>
    </header>
  );
}
