import React from "react";

/**
 * AnimatedSweepButton:
 * A high-performance button featuring a smooth directional loading sweep fill on hover.
 * Uses counter-translation dual-layer masking so that the text and animated background
 * NEVER mix or become unreadable at any point during the transition.
 */
export default function AnimatedSweepButton({
  children,
  onClick,
  className = "",
  variant = "outline", // "outline" | "yellow" | "black" | "card-outline" | "card-subtle"
  type = "button",
  disabled = false,
  title,
  style,
  ...props
}) {
  // Variant configurations
  let baseClasses = "";
  let baseTextColor = "";
  let fillBg = "";
  let hoverTextColor = "";

  switch (variant) {
    case "yellow":
      // Base: Yellow with black text. Hover: Deep black fill with yellow contrasting text.
      baseClasses = "bg-[#FDD132] border border-[#FDD132] hover:border-black hover:ring-2 hover:ring-black/20";
      baseTextColor = "text-black";
      fillBg = "bg-[#111111]";
      hoverTextColor = "text-[#FDD132]";
      break;

    case "black":
      // Base: Solid black with white text. Hover: Vibrant gold fill with crisp black text.
      baseClasses = "bg-black border border-black hover:border-[#FDD132] hover:ring-2 hover:ring-[#FDD132]/60";
      baseTextColor = "text-white";
      fillBg = "bg-[#FDD132]";
      hoverTextColor = "text-black";
      break;

    case "card-outline":
      // Base: Light card outline. Hover: Black sweep with white text and blue outline.
      baseClasses = "bg-white border border-gray-300 hover:border-[#4D8BDB] hover:ring-2 hover:ring-[#4D8BDB]";
      baseTextColor = "text-black";
      fillBg = "bg-black";
      hoverTextColor = "text-white";
      break;

    case "card-subtle":
      // Base: Off-white subtle card button. Hover: Black sweep with white text and blue outline.
      baseClasses = "bg-[#F9FAFB] border border-gray-200 hover:border-[#4D8BDB] hover:ring-2 hover:ring-[#4D8BDB]";
      baseTextColor = "text-black";
      fillBg = "bg-black";
      hoverTextColor = "text-white";
      break;

    case "outline":
    default:
      // Base: White with 1px black border. Hover: Black sweep with white text and blue outline.
      baseClasses = "bg-white border border-black hover:border-[#4D8BDB] hover:ring-2 hover:ring-[#4D8BDB]";
      baseTextColor = "text-black";
      fillBg = "bg-black";
      hoverTextColor = "text-white";
      break;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
      className={`relative overflow-hidden group/btn inline-flex items-center justify-center cursor-pointer select-none transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${baseClasses} ${className}`}
      {...props}
    >
      {/* ── LAYER 1: BASE LAYER (Always stationary, visible at rest) ── */}
      <span className={`inline-flex items-center justify-center gap-1.5 w-full h-full font-medium ${baseTextColor}`}>
        {children}
      </span>

      {/* ── LAYER 2: ANIMATED SWEEP OVERLAY (Clips and sweeps from left to right) ── */}
      <div 
        aria-hidden="true"
        className={`absolute inset-0 ${fillBg} -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out pointer-events-none flex items-center justify-center overflow-hidden`}
      >
        {/* Counter-translated inner content: stays stationary relative to button boundaries */}
        <span 
          className={`inline-flex items-center justify-center gap-1.5 w-full h-full font-medium ${hoverTextColor} translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out whitespace-nowrap`}
        >
          {children}
        </span>
      </div>
    </button>
  );
}
