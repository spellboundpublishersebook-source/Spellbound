import React from "react";

/**
 * Geometric 3D-styled hourglass/nexus emblem matching the glassy admin rail header.
 */
export function BrandEmblem3D({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="emblemDark" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#26282e" />
          <stop offset="100%" stopColor="#0e0f12" />
        </linearGradient>
        <linearGradient id="emblemHighlight" x1="10" y1="6" x2="28" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M9 7.5C9 6.67 9.67 6 10.5 6H29.5C30.33 6 31 6.67 31 7.5C31 8.15 30.72 8.76 30.24 9.2L20.8 17.85C20.35 18.27 19.65 18.27 19.2 17.85L9.76 9.2C9.28 8.76 9 8.15 9 7.5Z" fill="url(#emblemDark)" />
      <path d="M9 32.5C9 33.33 9.67 34 10.5 34H29.5C30.33 34 31 33.33 31 32.5C31 31.85 30.72 31.24 30.24 30.8L20.8 22.15C20.35 21.73 19.65 21.73 19.2 22.15L9.76 30.8C9.28 31.24 9 31.85 9 32.5Z" fill="url(#emblemDark)" />
      <circle cx="20" cy="20" r="2.6" fill="#F2F032" />
      <path d="M11 7.5H29L20 15.8L11 7.5Z" fill="url(#emblemHighlight)" />
    </svg>
  );
}

/**
 * Multi-layered 3D glossy gradient SVG icons for each Admin Dashboard tab.
 */
export function AdminTabIcon3D({ id, active = false, size = 22 }) {
  const uid = `adm3d_${id}`;
  const opacityRest = active ? 1 : 0.86;

  switch (id) {
    case "institutions":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE14D" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id={`${uid}_b`} x1="6" y1="10" x2="26" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2A2D35" />
              <stop offset="100%" stopColor="#111216" />
            </linearGradient>
          </defs>
          <path d="M16 4L27 10.5H5L16 4Z" fill={`url(#${uid}_a)`} />
          <rect x="6.5" y="11" width="19" height="13" rx="3" fill={`url(#${uid}_b)`} />
          <rect x="9.5" y="13.5" width="3" height="8" rx="1.2" fill="#ffffff" fillOpacity="0.88" />
          <rect x="14.5" y="13.5" width="3" height="8" rx="1.2" fill="#FFE14D" />
          <rect x="19.5" y="13.5" width="3" height="8" rx="1.2" fill="#ffffff" fillOpacity="0.88" />
          <rect x="4.5" y="24.5" width="23" height="3.2" rx="1.6" fill={`url(#${uid}_a)`} />
        </svg>
      );

    case "readers":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="5" x2="28" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id={`${uid}_b`} x1="8" y1="12" x2="24" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="24" height="20" rx="6" fill={`url(#${uid}_a)`} />
          <circle cx="16" cy="13.2" r="3.8" fill={`url(#${uid}_b)`} />
          <path d="M9.5 23C10.5 19.8 13 18.5 16 18.5C19 18.5 21.5 19.8 22.5 23" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="23.5" cy="9.5" r="2" fill="#FDE047" />
        </svg>
      );

    case "uploaders":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="6" x2="28" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <path d="M9.5 24H23C26 24 28 21.8 28 19C28 16.5 26.2 14.5 23.8 14.2C23 10.2 19.6 7.5 15.5 7.5C11 7.5 7.5 11 7.4 15.3C5.4 16 4 17.8 4 20C4 22.3 6 24 9.5 24Z" fill={`url(#${uid}_a)`} />
          <path d="M16 21V13M16 13L12.5 16.5M16 13L19.5 16.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="14" cy="11" rx="4" ry="1.6" fill="#ffffff" fillOpacity="0.3" />
        </svg>
      );

    case "trials":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="5" y1="8" x2="27" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id={`${uid}_b`} x1="5" y1="8" x2="27" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>
          </defs>
          <rect x="6" y="13.5" width="20" height="13.5" rx="3.5" fill={`url(#${uid}_a)`} />
          <rect x="4.5" y="9" width="23" height="5.5" rx="2.2" fill={`url(#${uid}_b)`} />
          <rect x="14" y="9" width="4" height="18" rx="1" fill="#18181B" fillOpacity="0.82" />
          <path d="M16 9C13.5 9 11 7.8 11 6C11 4.6 12.8 4.2 14.3 5.5L16 9ZM16 9C18.5 9 21 7.8 21 6C21 4.6 19.2 4.2 17.7 5.5L16 9Z" fill="#FACC15" stroke="#18181B" strokeWidth="1.2" />
        </svg>
      );

    case "books":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="6" y="5" width="18" height="22" rx="3.5" fill="#1F2937" />
          <rect x="8.5" y="4.5" width="17.5" height="21" rx="3.5" fill={`url(#${uid}_a)`} />
          <rect x="11.5" y="8" width="11" height="4.5" rx="1.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="11.5" y="15" width="8" height="2" rx="1" fill="#ffffff" fillOpacity="0.65" />
          <path d="M8.5 22.5H25V24.5C25 25.6 24.1 26.5 23 26.5H10.5C9.4 26.5 8.5 25.6 8.5 24.5V22.5Z" fill="#FEF08A" />
        </svg>
      );

    case "authors":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="5" y1="4" x2="27" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="11.5" fill={`url(#${uid}_a)`} />
          <path d="M16 8.5L18.2 13.1L23.2 13.8L19.6 17.3L20.5 22.3L16 19.9L11.5 22.3L12.4 17.3L8.8 13.8L13.8 13.1L16 8.5Z" fill="#FDE047" />
          <circle cx="12" cy="10" r="2.2" fill="#ffffff" fillOpacity="0.3" />
        </svg>
      );

    case "filters":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="23" height="23" rx="6.5" fill={`url(#${uid}_a)`} />
          <line x1="9.5" y1="11.5" x2="22.5" y2="11.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="13.5" cy="11.5" r="2.5" fill="#FDE047" />
          <line x1="9.5" y1="16.5" x2="22.5" y2="16.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="19" cy="16.5" r="2.5" fill="#ffffff" />
          <line x1="9.5" y1="21.5" x2="22.5" y2="21.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12.5" cy="21.5" r="2.5" fill="#ffffff" />
        </svg>
      );

    case "homepage":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="10.5" height="13" rx="3.2" fill={`url(#${uid}_a)`} />
          <rect x="17" y="4.5" width="10.5" height="9" rx="3.2" fill="#18181B" />
          <rect x="4.5" y="19.5" width="10.5" height="8" rx="3.2" fill="#FB923C" />
          <rect x="17" y="15.5" width="10.5" height="12" rx="3.2" fill="#334155" />
        </svg>
      );

    case "pages":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
          </defs>
          <rect x="6" y="4.5" width="20" height="23" rx="4.5" fill={`url(#${uid}_a)`} />
          <rect x="10" y="10" width="12" height="2.4" rx="1.2" fill="white" />
          <rect x="10" y="15" width="12" height="2.4" rx="1.2" fill="white" fillOpacity="0.82" />
          <rect x="10" y="20" width="8" height="2.4" rx="1.2" fill="#FEF08A" />
        </svg>
      );

    case "emails":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="4" y1="7" x2="28" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <rect x="4" y="7" width="24" height="18" rx="4.5" fill={`url(#${uid}_a)`} />
          <path d="M5.5 9.5L16 17L26.5 9.5" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="25.5" cy="8.5" r="3" fill="#EF4444" stroke="white" strokeWidth="1.2" />
        </svg>
      );

    case "subscribers":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_a`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>
          <path d="M16 5C11.5 5 8.5 8.2 8.5 12.8V17.5L6.5 21.5H25.5L23.5 17.5V12.8C23.5 8.2 20.5 5 16 5Z" fill={`url(#${uid}_a)`} />
          <circle cx="16" cy="24.5" r="2.8" fill="#18181B" />
          <circle cx="22.5" cy="8.5" r="2.6" fill="#FACC15" />
        </svg>
      );
  }
}

/**
 * Geometric textured pattern graphic for Card 1 (Yellow Bento Card)
 */
export function YellowCardPatternSVG() {
  return (
    <svg className="w-full h-24 pointer-events-none select-none" viewBox="0 0 320 96" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="dotMatrix" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.35" fill="#111214" fillOpacity="0.34" />
        </pattern>
        <pattern id="diagHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#111214" strokeWidth="3.2" strokeOpacity="0.85" />
        </pattern>
        <linearGradient id="darkColGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141518" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#141518" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#141518" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect x="6" y="72" width="66" height="24" rx="10" fill="#111214" fillOpacity="0.08" />
      <rect x="82" y="48" width="66" height="48" rx="12" fill="url(#dotMatrix)" />
      <rect x="158" y="28" width="68" height="68" rx="14" fill="url(#diagHatch)" />
      <rect x="236" y="8" width="76" height="88" rx="16" fill="url(#darkColGrad)" />
    </svg>
  );
}

/**
 * Textured radial pie graphic for Card 2 (Orange Bento Card)
 */
export function OrangePiePatternSVG() {
  return (
    <svg className="w-36 h-36 sm:w-40 sm:h-40 pointer-events-none select-none" viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <defs>
        <pattern id="orangeDots" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="#181412" fillOpacity="0.6" />
        </pattern>
        <pattern id="orangeHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#181412" strokeWidth="2.6" strokeOpacity="0.78" />
        </pattern>
        <linearGradient id="wedgeDark" x1="25" y1="20" x2="110" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#171412" />
          <stop offset="100%" stopColor="#FF8B47" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {/* Left dark shaded wedge */}
      <path d="M90 18 A76 76 0 0 0 18 118 L90 128 Z" fill="url(#wedgeDark)" />
      {/* Top right dotted wedge */}
      <path d="M94 18 A76 76 0 0 1 164 88 L94 122 Z" fill="url(#orangeDots)" />
      {/* Bottom right hatched wedge */}
      <path d="M164 94 A76 76 0 0 1 110 164 L96 126 Z" fill="url(#orangeHatch)" />
      {/* Accent dark slice */}
      <path d="M112 162 A76 76 0 0 1 72 164 L94 132 Z" fill="#111214" />
    </svg>
  );
}

/**
 * Fallback 3D book graphic for Spotlight card when coverUrl is absent.
 */
export function Book3DFallbackSVG({ color = "#F97316" }) {
  return (
    <svg width="72" height="92" viewBox="0 0 72 92" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bk3dCover" x1="8" y1="8" x2="64" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="52" height="72" rx="8" fill="#000000" fillOpacity="0.35" transform="translate(4 4)" />
      <rect x="10" y="10" width="52" height="72" rx="8" fill="url(#bk3dCover)" stroke="#ffffff" strokeOpacity="0.25" />
      <rect x="18" y="20" width="36" height="10" rx="3" fill="#ffffff" fillOpacity="0.22" />
      <rect x="18" y="36" width="26" height="4" rx="2" fill="#FDE047" />
      <rect x="18" y="44" width="32" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.45" />
    </svg>
  );
}

/**
 * Bespoke 3D glossy icons for the Secure Reader Tools navigation rail.
 * Matches the visual fidelity and colorful 3D palette of the Admin Dashboard.
 */
export function ReaderToolIcon3D({ id, active = false, size = 22 }) {
  const uid = `rdr3d_${id}`;
  const opacityRest = active ? 1 : 0.88;

  switch (id) {
    case "theme":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_p`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id={`${uid}_hi`} x1="6" y1="5" x2="20" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Palette body */}
          <path
            d="M16 4.5C9.6 4.5 4.5 9.6 4.5 16C4.5 20.2 7.2 23.6 11 25.2C12 25.6 12.8 26.5 12.8 27.6V27.8C12.8 28.5 13.4 29 14.1 29H16C23.2 29 28.5 23.2 28.5 16C28.5 9.6 22.9 4.5 16 4.5Z"
            fill={`url(#${uid}_p)`}
          />
          {/* Top gloss curve */}
          <path
            d="M6.5 15.5C6.5 10.5 10.5 6.5 16 6.5C19.5 6.5 23 8.5 25 11.5C21 8.5 15.5 8 10 11C7.8 12.2 6.8 13.8 6.5 15.5Z"
            fill={`url(#${uid}_hi)`}
          />
          {/* Thumb hole */}
          <ellipse cx="20.5" cy="22.5" rx="2.5" ry="2.2" fill="#18181B" fillOpacity="0.75" />
          {/* Colorful paint dots */}
          <circle cx="10" cy="11.5" r="2.2" fill="#F43F5E" />
          <circle cx="16" cy="9.2" r="2.2" fill="#FBBF24" />
          <circle cx="22" cy="11.5" r="2.2" fill="#34D399" />
          <circle cx="9.5" cy="17.5" r="2.2" fill="#38BDF8" />
          <circle cx="14" cy="20.5" r="1.8" fill="#F472B6" />
        </svg>
      );

    case "lights":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_s`} x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id={`${uid}_r`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          {/* Radiating rounded rays */}
          <rect x="14.5" y="2.5" width="3" height="4.5" rx="1.5" fill={`url(#${uid}_r)`} />
          <rect x="14.5" y="25" width="3" height="4.5" rx="1.5" fill={`url(#${uid}_r)`} />
          <rect x="2.5" y="14.5" width="4.5" height="3" rx="1.5" fill={`url(#${uid}_r)`} />
          <rect x="25" y="14.5" width="4.5" height="3" rx="1.5" fill={`url(#${uid}_r)`} />
          <rect x="6" y="6" width="3.2" height="4.2" rx="1.6" transform="rotate(-45 7.6 8.1)" fill={`url(#${uid}_r)`} />
          <rect x="22" y="22" width="3.2" height="4.2" rx="1.6" transform="rotate(-45 23.6 24.1)" fill={`url(#${uid}_r)`} />
          <rect x="22" y="6" width="3.2" height="4.2" rx="1.6" transform="rotate(45 23.6 8.1)" fill={`url(#${uid}_r)`} />
          <rect x="6" y="22" width="3.2" height="4.2" rx="1.6" transform="rotate(45 7.6 24.1)" fill={`url(#${uid}_r)`} />
          {/* Sun body */}
          <circle cx="16" cy="16" r="7.5" fill={`url(#${uid}_s)`} />
          <circle cx="13.5" cy="13.5" r="3" fill="#ffffff" fillOpacity="0.45" />
          <circle cx="16" cy="16" r="5" fill="#FFE14D" fillOpacity="0.3" />
        </svg>
      );

    case "epubStyle":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_bg`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="23" height="23" rx="6.5" fill={`url(#${uid}_bg)`} />
          {/* Bold Serif 'A' */}
          <path
            d="M11 21.5L14.2 11H17.8L21 21.5H18.7L18 19H14L13.3 21.5H11ZM14.5 17.2H17.5L16 12.6L14.5 17.2Z"
            fill="#ffffff"
          />
          {/* 4-point golden sparkle */}
          <path
            d="M23 6L23.8 8.2L26 9L23.8 9.8L23 12L22.2 9.8L20 9L22.2 8.2L23 6Z"
            fill="#FDE047"
          />
          <circle cx="9" cy="9" r="1.5" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      );

    case "voice":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_head`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id={`${uid}_cup`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          {/* Headband arch */}
          <path
            d="M6 16C6 10.5 10.5 6 16 6C21.5 6 26 10.5 26 16"
            stroke={`url(#${uid}_head)`}
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {/* Earcups */}
          <rect x="4" y="14" width="4.8" height="9" rx="2.4" fill={`url(#${uid}_cup)`} stroke="#34D399" strokeWidth="1.2" />
          <rect x="23.2" y="14" width="4.8" height="9" rx="2.4" fill={`url(#${uid}_cup)`} stroke="#34D399" strokeWidth="1.2" />
          {/* Audio soundwave bars in center */}
          <rect x="11.5" y="15" width="2" height="6" rx="1" fill="#FDE047" />
          <rect x="15" y="12" width="2" height="12" rx="1" fill="#34D399" />
          <rect x="18.5" y="14" width="2" height="8" rx="1" fill="#FDE047" />
        </svg>
      );

    case "lineFocus":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_bg`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="23" height="23" rx="6.5" fill={`url(#${uid}_bg)`} />
          {/* Masked dark regions */}
          <rect x="6.5" y="6.5" width="19" height="5" rx="1.5" fill="#0F172A" fillOpacity="0.75" />
          <rect x="6.5" y="20.5" width="19" height="5" rx="1.5" fill="#0F172A" fillOpacity="0.75" />
          {/* Reading spotlight focus slit in middle */}
          <rect x="6.5" y="12.5" width="19" height="7" rx="1.8" fill="#ffffff" fillOpacity="0.95" />
          <rect x="8" y="14.5" width="11" height="1.6" rx="0.8" fill="#1E293B" />
          <rect x="8" y="17" width="7" height="1.4" rx="0.7" fill="#64748B" />
          {/* Focal amber indicator */}
          <circle cx="22" cy="16" r="2.2" fill="#F59E0B" />
        </svg>
      );

    case "highlighter":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_pen`} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>
          {/* Marker body tilted */}
          <path
            d="M17.5 5.5L24.5 12.5L14 23L7 16L17.5 5.5Z"
            fill={`url(#${uid}_pen)`}
          />
          {/* Grip collar */}
          <path d="M10.5 19.5L7 16L9.5 13.5L13 17L10.5 19.5Z" fill="#18181B" />
          {/* Chisel tip */}
          <path d="M7 16L4 21L9 19.5L7 16Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
          {/* Neon highlight swatch beneath */}
          <rect x="4.5" y="25" width="23" height="3" rx="1.5" fill="#FACC15" fillOpacity="0.9" />
          <circle cx="21" cy="9" r="1.5" fill="#ffffff" fillOpacity="0.7" />
        </svg>
      );

    case "sticky":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_n`} x1="5" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>
          </defs>
          {/* Sticky paper */}
          <path
            d="M5.5 8C5.5 6.6 6.6 5.5 8 5.5H24C25.4 5.5 26.5 6.6 26.5 8V19L19.5 26.5H8C6.6 26.5 5.5 25.4 5.5 24V8Z"
            fill={`url(#${uid}_n)`}
          />
          {/* Folded corner dog-ear */}
          <path d="M19.5 19H26.5L19.5 26.5V19Z" fill="#CA8A04" />
          <path d="M19.5 19L26.5 26.5H19.5V19Z" fill="#EAB308" fillOpacity="0.4" />
          {/* Pushpin / Header tape */}
          <rect x="13.5" y="4" width="5" height="3.5" rx="1.2" fill="#EF4444" />
          {/* Note content lines */}
          <rect x="9" y="11" width="13" height="1.8" rx="0.9" fill="#1E293B" fillOpacity="0.45" />
          <rect x="9" y="15" width="11" height="1.8" rx="0.9" fill="#1E293B" fillOpacity="0.45" />
          <rect x="9" y="19" width="7" height="1.8" rx="0.9" fill="#1E293B" fillOpacity="0.3" />
        </svg>
      );

    case "notebook":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_c`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          {/* Hardcover book */}
          <rect x="6" y="4.5" width="20" height="23" rx="4" fill={`url(#${uid}_c)`} />
          {/* Spine on left */}
          <rect x="6" y="4.5" width="4.5" height="23" rx="2" fill="#064E3B" />
          {/* Gold bookmark ribbon */}
          <path d="M18 4.5V15L20 13.5L22 15V4.5H18Z" fill="#F59E0B" />
          {/* Gold embossed emblem */}
          <circle cx="15.5" cy="18" r="3.2" fill="#FDE047" />
          <circle cx="15.5" cy="18" r="1.8" fill="#047857" />
          {/* Page edge slivers */}
          <rect x="25" y="6" width="1.5" height="20" rx="0.75" fill="#F1F5F9" />
        </svg>
      );

    case "bookmark":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_rb`} x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="60%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>
          </defs>
          {/* Ribbon with swallowtail bottom */}
          <path
            d="M8.5 5C8.5 4.2 9.2 3.5 10 3.5H22C22.8 3.5 23.5 4.2 23.5 5V27.5L16 22.5L8.5 27.5V5Z"
            fill={`url(#${uid}_rb)`}
          />
          {/* Golden star badge pinned on top */}
          <circle cx="16" cy="11" r="5" fill="#FEF08A" />
          <path
            d="M16 7.5L17.2 10.2L20.1 10.5L18 12.4L18.6 15.2L16 13.8L13.4 15.2L14 12.4L11.9 10.5L14.8 10.2L16 7.5Z"
            fill="#D97706"
          />
          {/* Ribbon sheen */}
          <line x1="11.5" y1="17" x2="11.5" y2="23" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "zoomSection":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity: opacityRest }} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}_lens`} x1="6" y1="6" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="60%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
          </defs>
          {/* Magnifier lens outer rim */}
          <circle cx="13.5" cy="13.5" r="9" fill={`url(#${uid}_lens)`} stroke="#1E293B" strokeWidth="2.2" />
          {/* Lens reflection crescent */}
          <path
            d="M7.5 12C7.8 8.5 10.5 6.2 14 6C11 6.5 8.5 8.5 8 12L7.5 12Z"
            fill="#ffffff"
            fillOpacity="0.8"
          />
          {/* Focus reticle in center */}
          <line x1="13.5" y1="9.5" x2="13.5" y2="17.5" stroke="#FDE047" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="9.5" y1="13.5" x2="17.5" y2="13.5" stroke="#FDE047" strokeWidth="1.6" strokeLinecap="round" />
          {/* Handle */}
          <path d="M20 20L27.5 27.5" stroke="#1E293B" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M20 20L27.5 27.5" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}
