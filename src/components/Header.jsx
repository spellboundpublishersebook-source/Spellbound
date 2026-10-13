import React, { useState } from "react";
import { LogOut, Menu, X, Home, LayoutDashboard, FlaskConical, ShieldCheck, User } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import AnimatedSweepButton from "./AnimatedSweepButton";

export default function Header({ session, view, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <>
      <header
        style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
        className="sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-auto py-1">

          {/* LOGO + BRAND */}
          <button
            onClick={() => { onNavigate("catalog"); window.scrollTo(0, 0); close(); }}
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="SpellBound Logo"
              style={{ height: "90px", width: "auto", display: "block", objectFit: "contain" }}
              className="sm:h-[140px]"
            />
            <div className="hidden sm:flex flex-col items-center">
              <span style={{
                color: "#DC2626", fontWeight: "900", fontSize: "56px", letterSpacing: "normal", WebkitTextStroke: "1px #DC2626", textTransform: "uppercase", lineHeight: "1", ...fontBody,
              }}>
                SpellBound
              </span>
              <span style={{
                color: "#000000", fontWeight: "600", fontSize: "18px", fontStyle: "italic", textTransform: "uppercase", marginTop: "5px", lineHeight: "1", letterSpacing: "normal", ...fontDisplay
              }}>
                Publishers &amp; Distributors
              </span>
            </div>
            {/* Mobile: show just "SPELLBOUND" text */}
            <span className="sm:hidden" style={{
              color: "#DC2626", fontWeight: "900", fontSize: "32px",
              letterSpacing: "normal", WebkitTextStroke: "1px #DC2626", textTransform: "uppercase", ...fontDisplay,
            }}>
              SpellBound
            </span>
          </button>

          {/* DESKTOP NAV */}
          <div className="hidden sm:flex items-center gap-5">
            <NavLinks session={session} view={view} onNavigate={onNavigate} onLogout={onLogout} />
          </div>

          {/* MOBILE RIGHT SIDE: Sign In button + Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {!session && (
              <button
                onClick={() => { onNavigate("login-reader"); close(); }}
                style={{
                  backgroundColor: "#FDD132", color: "#111111",
                  fontWeight: "700", fontSize: "13px",
                  padding: "7px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                }}
              >
                Sign In
              </button>
            )}
            {session && (
              <button
                onClick={() => { onNavigate(session.role === "reader" ? "reader-dashboard" : session.role); close(); }}
                style={{
                  backgroundColor: "#FDD132", color: "#111111",
                  fontWeight: "700", fontSize: "13px",
                  padding: "7px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                }}
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: "#F3F4F6", border: "1px solid #E5E7EB",
                borderRadius: "8px", padding: "8px", color: "#000000",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              zIndex: 28, backdropFilter: "blur(2px)",
            }}
          />
          {/* Drawer */}
          <div
            style={{
              position: "fixed", top: "64px", left: 0, right: 0,
              background: "#FFFFFF", borderBottom: "1px solid #E5E7EB",
              zIndex: 29, padding: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <DrawerItem
                icon={<Home size={16} />}
                label="Home"
                active={view === "catalog"}
                onClick={() => { onNavigate("catalog"); window.scrollTo(0, 0); close(); }}
              />

              {!session && (
                <>
                  <DrawerItem
                    icon={<FlaskConical size={16} />}
                    label="Free Trial"
                    active={view === "trial"}
                    onClick={() => { onNavigate("trial"); close(); }}
                  />
                  <DrawerItem
                    icon={<ShieldCheck size={16} />}
                    label="Admin Login"
                    active={view === "login-admin"}
                    onClick={() => { onNavigate("login-admin"); close(); }}
                  />
                  <DrawerItem
                    icon={<User size={16} />}
                    label="Institution Login"
                    active={view === "login-reader"}
                    onClick={() => { onNavigate("login-reader"); close(); }}
                  />
                </>
              )}

              {session && (
                <>
                  <DrawerItem
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                    active={["reader-dashboard", "admin", "uploader"].includes(view)}
                    onClick={() => { onNavigate(session.role === "reader" ? "reader-dashboard" : session.role); close(); }}
                  />
                  <div style={{ borderTop: "1px solid #E5E7EB", margin: "8px 0" }} />
                  <div style={{ padding: "8px 12px", fontSize: "12px", color: "#000000" }}>
                    Signed in as <span style={{ color: "#000000", fontWeight: "600" }}>{session.name}</span>
                    <span style={{ color: "#000000" }}> · {session.role}</span>
                  </div>
                  <DrawerItem
                    icon={<LogOut size={16} />}
                    label="Log out"
                    active={false}
                    danger
                    onClick={() => { onLogout(); close(); }}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLinks({ session, view, onNavigate, onLogout }) {
  const btn = (isActive) => ({
    color: isActive ? "#111111" : "#6B7280",
    fontWeight: "600", fontSize: "14px",
    background: "none", border: "none", cursor: "pointer", transition: "color 0.15s",
  });

  return (
    <>
      <button
        style={btn(view === "catalog")}
        onClick={() => { onNavigate("catalog"); window.scrollTo(0, 0); }}
        onMouseEnter={e => { if (view !== "catalog") e.target.style.color = "#111111"; }}
        onMouseLeave={e => { if (view !== "catalog") e.target.style.color = "#6B7280"; }}
      >
        Home
      </button>

      {!session && (
        <>
          <button
            style={btn(view === "trial")}
            onClick={() => onNavigate("trial")}
            onMouseEnter={e => { if (view !== "trial") e.target.style.color = "#111111"; }}
            onMouseLeave={e => { if (view !== "trial") e.target.style.color = "#6B7280"; }}
          >
            Free Trial
          </button>
          <AnimatedSweepButton
            onClick={() => onNavigate("login-admin")}
            variant="yellow-outline"
            className="font-bold text-sm px-4 py-2 rounded-md"
          >
            Admin Login
          </AnimatedSweepButton>
          <AnimatedSweepButton
            onClick={() => onNavigate("login-reader")}
            variant="yellow"
            className="font-bold text-sm px-5 py-2 rounded-md"
          >
            Institution Login
          </AnimatedSweepButton>
        </>
      )}

      {session && (
        <>
          <button
            style={btn(["reader-dashboard","admin","uploader"].includes(view))}
            onClick={() => onNavigate(session.role === "reader" ? "reader-dashboard" : session.role)}
            onMouseEnter={e => { e.target.style.color = "#111111"; }}
            onMouseLeave={e => { e.target.style.color = ["reader-dashboard","admin","uploader"].includes(view) ? "#111111" : "#6B7280"; }}
          >
            Dashboard
          </button>
          
          {/* PROFILE DROPDOWN */}
          <div className="relative group ml-2 flex items-center">
            {/* The hit area is extended slightly downward so hovering to the menu doesn't lose hover state */}
            <div className="pb-4 absolute inset-0 -bottom-4 z-10" />
            
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black hover:bg-gray-200 hover:text-black transition-colors border border-gray-200 relative z-20">
              <User size={20} />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute top-[100%] right-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-black truncate">{session.name}</p>
                <p className="text-xs text-black capitalize">{session.role} Account</p>
              </div>
              <div className="py-1 border-b border-gray-100">
                <button 
                  onClick={() => onNavigate(session.role === "reader" ? "reader-dashboard" : session.role)}
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>
              </div>
              <div className="py-1">
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function DrawerItem({ icon, label, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 14px", borderRadius: "10px", border: "none",
        cursor: "pointer", textAlign: "left", width: "100%",
        background: active ? "rgba(253,209,50,0.08)" : "transparent",
        color: danger ? "#DC2626" : active ? "#111111" : "#6B7280",
        fontWeight: "600", fontSize: "14px",
        transition: "background 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
