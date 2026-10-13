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
              className="h-12 w-auto sm:h-[130px] md:h-[140px] object-contain block"
            />
            <div className="flex flex-col items-center text-center">
              <span
                className="text-[22px] sm:text-[56px] font-black text-[#DC2626] uppercase leading-none tracking-normal"
                style={{
                  WebkitTextStroke: "1px #DC2626",
                  ...fontBody,
                }}
              >
                SpellBound
              </span>
              <span
                className="text-[9px] sm:text-[18px] font-semibold text-[#000000] italic uppercase mt-0.5 sm:mt-[5px] leading-none tracking-tight sm:tracking-normal whitespace-nowrap"
                style={fontDisplay}
              >
                Publishers &amp; Distributors
              </span>
            </div>
          </button>

          {/* DESKTOP NAV */}
          <div className="hidden sm:flex items-center gap-5">
            <NavLinks session={session} view={view} onNavigate={onNavigate} onLogout={onLogout} />
          </div>

          {/* MOBILE RIGHT SIDE: Hamburger Menu Only (Sign In & Dashboard are inside the dropdown) */}
          <div className="flex sm:hidden items-center">
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-black cursor-pointer transition-colors"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
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
              position: "fixed", top: "58px", left: 0, right: 0,
              background: "#FFFFFF", borderBottom: "1px solid #E5E7EB",
              zIndex: 29, padding: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <DrawerItem
                icon={<Home size={18} />}
                label="Home"
                active={view === "catalog"}
                onClick={() => { onNavigate("catalog"); window.scrollTo(0, 0); close(); }}
              />

              {!session && (
                <>
                  <DrawerItem
                    icon={<FlaskConical size={18} />}
                    label="Free Trial"
                    active={view === "trial"}
                    onClick={() => { onNavigate("trial"); close(); }}
                  />
                  <div className="pt-3 mt-1 border-t border-gray-100 flex flex-col gap-2.5">
                    <AnimatedSweepButton
                      onClick={() => { onNavigate("login-reader"); close(); }}
                      variant="yellow"
                      className="w-full font-bold py-2.5 rounded-lg text-sm shadow-sm"
                    >
                      Sign In / Institution Login
                    </AnimatedSweepButton>
                    <AnimatedSweepButton
                      onClick={() => { onNavigate("login-admin"); close(); }}
                      variant="yellow-outline"
                      className="w-full font-bold py-2 rounded-lg text-sm"
                    >
                      Admin Login
                    </AnimatedSweepButton>
                  </div>
                </>
              )}

              {session && (
                <>
                  <DrawerItem
                    icon={<LayoutDashboard size={18} />}
                    label="Dashboard"
                    active={["reader-dashboard", "admin", "uploader"].includes(view)}
                    onClick={() => { onNavigate(session.role === "reader" ? "reader-dashboard" : session.role); close(); }}
                  />
                  <div className="pt-3 mt-1 border-t border-gray-100">
                    <AnimatedSweepButton
                      onClick={() => { onNavigate(session.role === "reader" ? "reader-dashboard" : session.role); close(); }}
                      variant="yellow"
                      className="w-full font-bold py-2.5 rounded-lg text-sm mb-3 shadow-sm"
                    >
                      Open Dashboard
                    </AnimatedSweepButton>
                  </div>
                  <div style={{ padding: "6px 12px", fontSize: "12px", color: "#000000" }}>
                    Signed in as <span style={{ color: "#000000", fontWeight: "600" }}>{session.name}</span>
                    <span style={{ color: "#6B7280" }}> ({session.role})</span>
                  </div>
                  <DrawerItem
                    icon={<LogOut size={18} />}
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
