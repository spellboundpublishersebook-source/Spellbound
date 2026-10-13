import React from "react";
import { fontBody } from "../theme";

const variants = {
  brass:        { backgroundColor: "#FDD132", color: "#111111", borderColor: "#FDD132" },
  forest:       { backgroundColor: "#1F3A30", color: "#FBF7EC", borderColor: "#1F3A30" },
  outline:      { backgroundColor: "transparent", color: "#241A14", borderColor: "#e7ded0" },
  outlineLight: { backgroundColor: "transparent", color: "#FBF7EC", borderColor: "rgba(251,247,236,0.4)" },
  danger:       { backgroundColor: "#B4423A", color: "#FBF7EC", borderColor: "#B4423A" },
  ghost:        { backgroundColor: "transparent", color: "#4A3B30", borderColor: "transparent" },
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
};

export default function Button({ children, variant = "brass", size = "md", className = "", disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded font-semibold border cursor-pointer active:scale-[0.97] hover:opacity-90 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
      style={{ ...fontBody, ...variants[variant] }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
