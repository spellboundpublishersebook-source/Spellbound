import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X, Home, LayoutDashboard, FlaskConical, ShieldCheck, User } from "lucide-react";
import { fontDisplay, fontBody } from "../theme";
import AnimatedSweepButton from "./AnimatedSweepButton";

export default function Header({ session, view, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  // Prevent background scrolling when mobile shutter is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close menu on Escape or screen resize to desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) close();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <header
        style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
        className="sticky top-0 z-[100] shadow-sm relative w-full max-w-full"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-auto py-1">

          {/* LOGO + BRAND */}
          <button
            onClick={() => { onNavigate("catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); close(); }}
            className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="SpellBound Logo"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain block flex-shrink-0"
            />
            <div className="flex flex-col items-center text-center">
              <span
                className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] font-black text-[#DC2626] uppercase leading-none tracking-normal"
                style={{
                  WebkitTextStroke: "1px #DC2626",
                  ...fontBody,
                }}
              >
                SpellBound
              </span>
              <span
                className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-semibold text-[#000000] italic uppercase mt-0.5 leading-none tracking-tight sm:tracking-normal whitespace-nowrap"
                style={fontDisplay}
              >
                Publishers &amp; Distributors
              </span>
            </div>
          </button>

          {/* DESKTOP NAV (Only visible on large desktop screens >= 1024px) */}
          <div className="hidden lg:flex items-center gap-5">
            <NavLinks session={session} view={view} onNavigate={onNavigate} onLogout={onLogout} />
          </div>

          {/* MOBILE / TABLET RIGHT SIDE: 3-line Hamburger Menu Toggle */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              className="p-2 sm:p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 text-black cursor-pointer transition-all shadow-xs flex items-center justify-center"
            >
              {menuOpen ? <X size={22} className="stroke-[2.5]" /> : <Menu size={22} className="stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* MOBILE SHUTTER DRAWER (Inside <header> so it shares z-[100] and is never hidden behind hero or page elements) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-1.5 max-h-[calc(100vh-80px)] overflow-y-auto">
                <DrawerItem
                  icon={<Home size={18} />}
                  label="Home"
                  active={view === "catalog"}
                  onClick={() => { onNavigate("catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); close(); }}
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
                    <div className="px-3.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                      <span>Signed in as <strong className="text-black">{session.name}</strong></span>
                      <span className="text-gray-500 font-semibold capitalize">({session.role})</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AnimatedNavItem({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group/nav relative px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none ${
        isActive 
          ? "text-black font-extrabold" 
          : "text-gray-600 hover:text-black hover:-translate-y-0.5"
      }`}
    >
      {/* Animation 1: Ambient Capsule Hover Glow */}
      <span className="absolute inset-0 rounded-lg bg-gray-100/90 scale-95 opacity-0 group-hover/nav:scale-100 group-hover/nav:opacity-100 transition-all duration-200 -z-10 pointer-events-none" />

      {/* Interactive Micro-Icon on Hover */}
      {Icon && (
        <Icon 
          size={16} 
          className={`transition-transform duration-200 group-hover/nav:scale-110 ${
            isActive ? "text-black" : "text-gray-500 group-hover/nav:text-black"
          }`} 
        />
      )}

      {/* Navigation Label */}
      <span className="relative z-10 tracking-tight">{label}</span>

      {/* Animation 2: Active Sliding Indicator Bar (glides seamlessly between Home & Dashboard) */}
      {isActive && (
        <motion.span
          layoutId="activeNavIndicator"
          className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#111111] rounded-full shadow-sm"
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
        />
      )}

      {/* Non-active Expanding Gold Hover Line (blossoms outward from center on hover) */}
      {!isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#FDD132] rounded-full group-hover/nav:w-2/3 transition-all duration-300 ease-out pointer-events-none" />
      )}
    </button>
  );
}

function NavLinks({ session, view, onNavigate, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileOpen]);

  const isHomeActive = view === "catalog";
  const isDashboardActive = ["reader-dashboard", "admin", "uploader"].includes(view);
  const isTrialActive = view === "trial";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Home Navigation with Animated Sliding Indicator & Hover Sweep */}
      <AnimatedNavItem
        label="Home"
        icon={Home}
        isActive={isHomeActive}
        onClick={() => { onNavigate("catalog"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />

      {!session && (
        <>
          <AnimatedNavItem
            label="Free Trial"
            icon={FlaskConical}
            isActive={isTrialActive}
            onClick={() => onNavigate("trial")}
          />
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
          {/* Dashboard Navigation with Animated Sliding Indicator & Hover Sweep */}
          <AnimatedNavItem
            label="Dashboard"
            icon={LayoutDashboard}
            isActive={isDashboardActive}
            onClick={() => onNavigate(session.role === "reader" ? "reader-dashboard" : session.role)}
          />
          
          {/* PROFILE DROPDOWN */}
          <div className="relative ml-2 flex items-center" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="User menu"
              aria-expanded={profileOpen}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border cursor-pointer ${
                profileOpen
                  ? "bg-gray-200 text-black border-gray-300"
                  : "bg-gray-100 text-black hover:bg-gray-200 border-gray-200"
              }`}
            >
              <User size={20} />
            </button>
            
            {/* Dropdown menu */}
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-[120]">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-black truncate">{session.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{session.role} Account</p>
                </div>
                <div className="py-1 border-b border-gray-100">
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate(session.role === "reader" ? "reader-dashboard" : session.role);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </button>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DrawerItem({ icon, label, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-left font-semibold text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : active
          ? "bg-[#FDD132]/20 text-black font-bold shadow-xs border border-[#FDD132]/40"
          : "text-gray-700 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <span className={active ? "text-black" : danger ? "text-red-600" : "text-gray-500"}>
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <span className="ml-auto w-2 h-2 rounded-full bg-[#111111]" />
      )}
    </button>
  );
}
