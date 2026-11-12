import React from "react";
import { fontBody } from "../theme";

const variants = {
  brass:        { backgroundColor: "#F5F23B", color: "#111214", borderColor: "rgba(17,18,20,0.12)" },
  forest:       { backgroundColor: "#111214", color: "#F5F23B", borderColor: "#111214" },
  outline:      { backgroundColor: "rgba(255,255,255,0.78)", color: "#111214", borderColor: "rgba(15,23,42,0.15)" },
  outlineLight: { backgroundColor: "rgba(255,255,255,0.12)", color: "#F8FAFC", borderColor: "rgba(255,255,255,0.38)" },
  danger:       { backgroundColor: "#DC2626", color: "#FFFFFF", borderColor: "#DC2626" },
  ghost:        { backgroundColor: "transparent", color: "#334155", borderColor: "transparent" },
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
};

export default function Button({ children, variant = "brass", size = "md", className = "", disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold border cursor-pointer active:scale-[0.98] hover:opacity-95 hover:shadow-md transition-all disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
      style={{ ...fontBody, ...variants[variant] }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
