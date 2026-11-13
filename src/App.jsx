import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import AuthorsPage from "./pages/AuthorsPage";
import LoginPage from "./pages/LoginPage";
import TrialPage from "./pages/TrialPage";
import ReaderDashboard from "./pages/ReaderDashboard";
import SecureReader from "./pages/SecureReader";
import UploaderPanel from "./pages/UploaderPanel";
import AdminPanel from "./pages/AdminPanel";
import BookDetailsPage from "./pages/BookDetailsPage";
import StaticPage from "./pages/StaticPage";
import { supabase } from "./supabaseClient";
import { getPages, fetchSettingsFromDB } from "./theme";
import {
  initialBooks, initialLicenses, initialUploaders, initialTrialRequests,
  superAdmin, addMonths, today, daysUntil, genPassword,
} from "./data/mockData";

function useGoogleFonts() {
  useEffect(() => {
    const id = "athenaeum-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700&family=Source+Sans+3:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function App() {
  useGoogleFonts();

  // ── Hash-based routing so refresh/back keeps the correct page ──────────
  function parseHash() {
    const raw = window.location.hash.replace(/^#/, "") || "catalog";
    if (raw.startsWith("page:")) return { v: raw, bookId: null };
    const [v, bookId] = raw.split(":");
    return { v, bookId: bookId || null };
  }

  const [view, setView] = useState(() => parseHash().v);
  const [openBookId, setOpenBookId] = useState(() => parseHash().bookId);
  const [initialReaderPage, setInitialReaderPage] = useState(null);

  // Keep hash in sync with state
  function navigate(v, bookId = null, targetPage = null) {
    if (targetPage) {
      setInitialReaderPage(targetPage);
    } else if (v !== "reading") {
      setInitialReaderPage(null);
    }
    const hash = bookId ? `${v}:${bookId}` : v;
    window.location.hash = hash;
    setView(v);
    if (bookId) {
      setOpenBookId(bookId);
    } else if (v === "catalog") {
      setOpenBookId(null);
    }
  }

  // Sync state when user presses browser Back / Forward
  useEffect(() => {
    function onHashChange() {
      const { v, bookId } = parseHash();
      setView(v);
      setOpenBookId(bookId);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("athenaeum_session");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem("athenaeum_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("athenaeum_session");
    }
  }, [session]);

    // Inactivity auto-logout (Highly optimized)
  useEffect(() => {
    if (!session) return;
    
    let lastActivity = Date.now();
    let isThrottled = false;
    
    const updateActivity = () => {
      if (isThrottled) return;
      lastActivity = Date.now();
      isThrottled = true;
      setTimeout(() => { isThrottled = false; }, 2000); // Throttle events to max once per 2 seconds
    };

    // Use passive listeners so scrolling isn't blocked by the browser!
    const listenerOptions = { passive: true };
    
    window.addEventListener("mousemove", updateActivity, listenerOptions);
    window.addEventListener("keydown", updateActivity, listenerOptions);
    window.addEventListener("scroll", updateActivity, listenerOptions);
    window.addEventListener("click", updateActivity, listenerOptions);

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > 30 * 60 * 1000) {
        setSession(null);
        setView("catalog");
        setOpenBookId(null);
        alert("You have been automatically logged out due to 30 minutes of inactivity.");
      }
    }, 60 * 1000); // Check once per minute

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", updateActivity, listenerOptions);
      window.removeEventListener("keydown", updateActivity, listenerOptions);
      window.removeEventListener("scroll", updateActivity, listenerOptions);
      window.removeEventListener("click", updateActivity, listenerOptions);
    };
  }, [session]);

  const [books, setBooks] = useState(initialBooks);
  const [licenses, setLicenses] = useState(initialLicenses);
  const [uploaders, setUploaders] = useState(initialUploaders);
  const [trialRequests, setTrialRequests] = useState(initialTrialRequests);
  const [admins, setAdmins] = useState([superAdmin]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [featuredAuthors, setFeaturedAuthors] = useState([]);
  const [readers, setReaders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [activeReadingSessions, setActiveReadingSessions] = useState([]);
  const [dbStatus, setDbStatus] = useState("checking");

  async function fetchAllData() {
    try {
      await fetchSettingsFromDB();
      const { data: booksData, error: booksError } = await supabase.from('books').select('*');
      if (booksError) throw booksError;
      setDbStatus("connected");
      
      if (booksData && booksData.length > 0) {
        setBooks(booksData.map(dbBook => {
          let epubData = null;
          if (dbBook.pages && typeof dbBook.pages === 'object' && !Array.isArray(dbBook.pages) && (dbBook.pages.type === 'epub' || dbBook.pages.format === 'epub')) {
            epubData = dbBook.pages;
          } else if (dbBook.description && dbBook.description.includes("__EPUB_DATA__:")) {
            try {
              const rawJson = dbBook.description.split("__EPUB_DATA__:")[1].split("__CUSTOM_FILTERS__:")[0].trim();
              epubData = JSON.parse(rawJson);
            } catch (e) {}
          }
          const cleanDescription = (dbBook.description || "")
            .split("__CUSTOM_FILTERS__:")[0]
            .split("__EPUB_DATA__:")[0]
            .trim();

          return {
            id: dbBook.id, title: dbBook.title, author: dbBook.author, genre: dbBook.genre, pubType: dbBook.pubtype,
            publisher: dbBook.publisher, price: dbBook.price, color: dbBook.color,
            firstPublish: dbBook.firstpublish, copyright: dbBook.copyright,
            printIsbn: dbBook.printisbn, onlineIsbn: dbBook.onlineisbn,
            description: cleanDescription,
            totalPages: dbBook.totalpages, pages: dbBook.pages || ["This book has no content pages yet."],
            epubData,
            pdfUrl: dbBook.pdfurl, coverUrl: dbBook.coverurl
          };
        }));
      }

      const { data: licData } = await supabase.from('licenses').select('*');
      if (licData && licData.length > 0) {
        setLicenses(licData.map(l => ({
          ...l,
          bookIds: l.bookids || [],
          startDate: l.startdate,
          endDate: l.enddate,
          departments: Array.isArray(l.departments) ? l.departments : []
        })));
      }

      const { data: uplData } = await supabase.from('uploaders').select('*');
      if (uplData && uplData.length > 0) setUploaders(uplData);

      const { data: triData } = await supabase.from('trial_requests').select('*');
      if (triData && triData.length > 0) {
        setTrialRequests(triData.map(t => ({ ...t, requestedAt: t.requestedat, expiresAt: t.expiresat })));
      }

      const { data: readData } = await supabase.from('readers').select('*');
      if (readData && readData.length > 0) {
        setReaders(readData.map(r => ({
          ...r,
          loginId: r.login_id,
          accountType: r.account_type,
          bookIds: r.bookids || [],
          startDate: r.startdate,
          endDate: r.enddate,
          status: r.status || (daysUntil(r.enddate) < 0 ? 'expired' : 'active'),
          price: Number(r.price || 0),
          type: r.type || 'individual'
        })));
      }

      const { data: subData } = await supabase.from('subscribers').select('*');
      if (subData && subData.length > 0) setSubscribers(subData);

      const { data: admData } = await supabase.from('admins').select('*');
      if (admData && admData.length > 0) setAdmins(admData);

      const { data: tplData } = await supabase.from('email_templates').select('*');
      if (tplData && tplData.length > 0) setEmailTemplates(tplData);

      const { data: authData } = await supabase.from('featured_authors').select('*');
      if (authData && authData.length > 0) {
        setFeaturedAuthors(authData.map(a => ({ ...a, photoUrl: a.photo_url })));
      }

      // Fetch active reading sessions (last 15 minutes) for traffic spike telemetry
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
      const { data: sessData } = await supabase.from('reading_sessions').select('*').gte('last_active', fifteenMinsAgo);
      if (sessData) setActiveReadingSessions(sessData);
    } catch (err) {
      console.error("Error fetching data from Supabase. Falling back to mock data.", err);
      setDbStatus("error");
    }
  }

  useEffect(() => {
    fetchAllData();

    if (!supabase) return;

    const fetchActiveSessions = async () => {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
        const { data: sessData } = await supabase.from('reading_sessions').select('*').gte('last_active', fifteenMinsAgo);
        if (sessData) setActiveReadingSessions(sessData);
      } catch (err) {
        console.warn("Telemetry refresh error:", err);
      }
    };
    const sessionInterval = setInterval(fetchActiveSessions, 30000);

    // --- REAL-TIME SUBSCRIPTIONS ---
    const channel = supabase.channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const dbBook = payload.new;
          let epubData = null;
          if (dbBook.pages && typeof dbBook.pages === 'object' && !Array.isArray(dbBook.pages) && (dbBook.pages.type === 'epub' || dbBook.pages.format === 'epub')) {
            epubData = dbBook.pages;
          } else if (dbBook.description && dbBook.description.includes("__EPUB_DATA__:")) {
            try {
              const rawJson = dbBook.description.split("__EPUB_DATA__:")[1].split("__CUSTOM_FILTERS__:")[0].trim();
              epubData = JSON.parse(rawJson);
            } catch (e) {}
          }
          const cleanDescription = (dbBook.description || "")
            .split("__CUSTOM_FILTERS__:")[0]
            .split("__EPUB_DATA__:")[0]
            .trim();

          const newB = {
            id: dbBook.id, title: dbBook.title, author: dbBook.author, genre: dbBook.genre, pubType: dbBook.pubtype,
            publisher: dbBook.publisher, price: dbBook.price, color: dbBook.color,
            firstPublish: dbBook.firstpublish, copyright: dbBook.copyright,
            printIsbn: dbBook.printisbn, onlineIsbn: dbBook.onlineisbn,
            description: cleanDescription,
            totalPages: dbBook.totalpages, pages: dbBook.pages || ["This book has no content pages yet."],
            epubData,
            pdfUrl: dbBook.pdfurl, coverUrl: dbBook.coverurl
          };
          setBooks(prev => prev.some(b => b.id === newB.id) ? prev : [newB, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const dbBook = payload.new;
          let epubData = null;
          if (dbBook.pages && typeof dbBook.pages === 'object' && !Array.isArray(dbBook.pages) && (dbBook.pages.type === 'epub' || dbBook.pages.format === 'epub')) {
            epubData = dbBook.pages;
          } else if (dbBook.description && dbBook.description.includes("__EPUB_DATA__:")) {
            try {
              const rawJson = dbBook.description.split("__EPUB_DATA__:")[1].split("__CUSTOM_FILTERS__:")[0].trim();
              epubData = JSON.parse(rawJson);
            } catch (e) {}
          }
          const cleanDescription = dbBook.description !== undefined
            ? (dbBook.description || "").split("__CUSTOM_FILTERS__:")[0].split("__EPUB_DATA__:")[0].trim()
            : undefined;

          setBooks(prev => prev.map(b => b.id === dbBook.id ? {
            ...b,
            title: dbBook.title !== undefined ? dbBook.title : b.title,
            author: dbBook.author !== undefined ? dbBook.author : b.author,
            genre: dbBook.genre !== undefined ? dbBook.genre : b.genre,
            pubType: dbBook.pubtype !== undefined ? dbBook.pubtype : b.pubType,
            publisher: dbBook.publisher !== undefined ? dbBook.publisher : b.publisher,
            price: dbBook.price !== undefined ? dbBook.price : b.price,
            color: dbBook.color !== undefined ? dbBook.color : b.color,
            firstPublish: dbBook.firstpublish !== undefined ? dbBook.firstpublish : b.firstPublish,
            copyright: dbBook.copyright !== undefined ? dbBook.copyright : b.copyright,
            printIsbn: dbBook.printisbn !== undefined ? dbBook.printisbn : b.printIsbn,
            onlineIsbn: dbBook.onlineisbn !== undefined ? dbBook.onlineisbn : b.onlineIsbn,
            description: cleanDescription !== undefined ? cleanDescription : b.description,
            totalPages: dbBook.totalpages !== undefined ? dbBook.totalpages : b.totalPages,
            pages: dbBook.pages !== undefined ? dbBook.pages : b.pages,
            epubData: epubData || b.epubData,
            pdfUrl: dbBook.pdfurl !== undefined ? dbBook.pdfurl : b.pdfUrl,
            coverUrl: dbBook.coverurl !== undefined ? dbBook.coverurl : b.coverUrl
          } : b));
        } else if (payload.eventType === 'DELETE') {
          setBooks(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, (payload) => {
        if (payload.eventType === 'INSERT') setSubscribers(prev => [...prev, payload.new]);
        else if (payload.eventType === 'DELETE') setSubscribers(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'readers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReaders(prev => [...prev, {
            ...payload.new,
            loginId: payload.new.login_id,
            accountType: payload.new.account_type,
            bookIds: payload.new.bookids || [],
            startDate: payload.new.startdate,
            endDate: payload.new.enddate,
            status: payload.new.status || (daysUntil(payload.new.enddate) < 0 ? 'expired' : 'active'),
            price: Number(payload.new.price || 0),
            type: payload.new.type || 'individual'
          }]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedBookIds = payload.new.bookids || [];
          const isOfflineOrRevoked = payload.new.status === "offline" || payload.new.status === "revoked" || daysUntil(payload.new.enddate) < 0;
          setReaders(prev => prev.map(r => r.id === payload.new.id ? {
            ...payload.new,
            loginId: payload.new.login_id,
            accountType: payload.new.account_type,
            bookIds: updatedBookIds,
            startDate: payload.new.startdate,
            endDate: payload.new.enddate,
            status: payload.new.status || (daysUntil(payload.new.enddate) < 0 ? 'expired' : 'active'),
            price: Number(payload.new.price || 0),
            type: payload.new.type || 'individual'
          } : r));
          setSession(prev => {
            if (!prev || prev.role !== "reader") return prev;
            if (prev.id === payload.new.id || prev.id === payload.new.login_id || prev.loginId === payload.new.login_id || (prev.email && prev.email === payload.new.login_id)) {
              if (isOfflineOrRevoked) {
                alert("Your account access has expired or been suspended.");
                return null;
              }
              return {
                ...prev,
                bookIds: updatedBookIds.length ? updatedBookIds : "all"
              };
            }
            return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          setReaders(prev => prev.filter(r => r.id !== payload.old.id));
          setSession(prev => {
            if (!prev || prev.role !== "reader") return prev;
            if (prev.id === payload.old.id || prev.id === payload.old.login_id || prev.loginId === payload.old.login_id) {
              alert("Your account has been removed.");
              return null;
            }
            return prev;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trial_requests' }, (payload) => {
        console.log("Realtime Trial Request:", payload);
        if (payload.eventType === 'INSERT') {
          setTrialRequests(prev => [...prev, { ...payload.new, requestedAt: payload.new.requestedat, expiresAt: payload.new.expiresat }]);
        } else if (payload.eventType === 'UPDATE') {
          setTrialRequests(prev => prev.map(t => t.id === payload.new.id ? { ...payload.new, requestedAt: payload.new.requestedat, expiresAt: payload.new.expiresat } : t));
        } else if (payload.eventType === 'DELETE') {
          setTrialRequests(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLicenses(prev => [...prev, {
            ...payload.new,
            bookIds: payload.new.bookids || [],
            startDate: payload.new.startdate,
            endDate: payload.new.enddate,
            departments: Array.isArray(payload.new.departments) ? payload.new.departments : []
          }]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedBookIds = payload.new.bookids || [];
          const updatedDepts = Array.isArray(payload.new.departments) ? payload.new.departments : [];
          const isSuspendedOrExpired = payload.new.type === "offline" || daysUntil(payload.new.enddate) < 0;

          setLicenses(prev => prev.map(l => l.id === payload.new.id ? {
            ...payload.new,
            bookIds: updatedBookIds,
            startDate: payload.new.startdate,
            endDate: payload.new.enddate,
            departments: updatedDepts
          } : l));
          setSession(prev => {
            if (!prev || prev.role !== "reader") return prev;
            if (prev.id === payload.new.id || prev.institutionId === payload.new.id) {
              if (isSuspendedOrExpired) {
                alert("Your institution's access has been temporarily suspended or expired.");
                return null;
              }
              // If department, check if still exists
              if (prev.type === "department" && !updatedDepts.some(d => d.id === prev.deptId || d.loginId === prev.id)) {
                alert("This department is no longer active.");
                return null;
              }
              // If student, check if still exists
              if (prev.type === "student") {
                const targetDept = updatedDepts.find(d => d.id === prev.deptId);
                const stuExists = targetDept && Array.isArray(targetDept.students) && targetDept.students.some(s => s.studentId === prev.studentId || s.id === prev.studentId);
                if (!stuExists) {
                  alert("Your student profile has been removed.");
                  return null;
                }
              }
              return {
                ...prev,
                bookIds: updatedBookIds,
                departments: updatedDepts
              };
            }
            return prev;
          });
        } else if (payload.eventType === 'DELETE') {
          setLicenses(prev => prev.filter(l => l.id !== payload.old.id));
          setSession(prev => {
            if (!prev || prev.role !== "reader") return prev;
            if (prev.id === payload.old.id || prev.institutionId === payload.old.id) {
              alert("Your institution license has been removed.");
              return null;
            }
            return prev;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_sessions' }, () => {
        fetchActiveSessions();
      })
      .subscribe();

    return () => {
      clearInterval(sessionInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-sync session book access, validity, and departments with latest database state
  useEffect(() => {
    if (!session || session.role !== "reader") return;

    // Institution / Department / Student profile under license
    const licId = session.institutionId || (session.type === "license" ? session.id : null);
    if (licId && licenses.length > 0) {
      const lic = licenses.find(l => l.id === licId);
      if (!lic) {
        alert("Your institution license is no longer available.");
        handleLogout();
        return;
      }
      if (lic.type === "offline") {
        alert("Your institution's access has been temporarily suspended.");
        handleLogout();
        return;
      }
      if (daysUntil(lic.endDate) < 0) {
        alert("Your institution license has expired.");
        handleLogout();
        return;
      }

      const depts = Array.isArray(lic.departments) ? lic.departments : [];
      if (session.type === "department") {
        const deptExists = depts.some(d => d.id === session.deptId || d.loginId === session.id);
        if (!deptExists) {
          alert("This department is no longer available.");
          handleLogout();
          return;
        }
      }

      if (session.type === "student") {
        const dept = depts.find(d => d.id === session.deptId);
        const stuExists = dept && Array.isArray(dept.students) && dept.students.some(s => s.studentId === session.studentId || s.id === session.studentId);
        if (!stuExists) {
          alert("Your student profile has been removed.");
          handleLogout();
          return;
        }
      }

      const latestBookIds = Array.isArray(lic.bookIds) ? lic.bookIds : [];
      const currentBookIds = Array.isArray(session.bookIds) ? session.bookIds : [];
      const isBooksDiff = latestBookIds.length !== currentBookIds.length ||
                          latestBookIds.some(id => !currentBookIds.includes(id)) ||
                          currentBookIds.some(id => !latestBookIds.includes(id));
      const isDeptsDiff = JSON.stringify(session.departments || []) !== JSON.stringify(depts);

      if (isBooksDiff || isDeptsDiff) {
        setSession(prev => prev ? ({ ...prev, bookIds: latestBookIds, departments: depts }) : null);
      }
      return;
    }

    // Individual reader profile
    if (readers.length > 0) {
      const r = readers.find(x => x.id === session.id || x.loginId === session.id || (session.email && x.email === session.email));
      if (!r) {
        alert("Your reader account is no longer available.");
        handleLogout();
        return;
      }
      if (r.status === "offline") {
        alert("Your account has been temporarily suspended.");
        handleLogout();
        return;
      }
      if (r.status === "revoked" || daysUntil(r.endDate) < 0) {
        alert("Your access period has expired.");
        handleLogout();
        return;
      }

      const latestBookIds = r.bookIds?.length ? r.bookIds : "all";
      if (JSON.stringify(session.bookIds) !== JSON.stringify(latestBookIds)) {
        setSession(prev => prev ? ({ ...prev, bookIds: latestBookIds }) : null);
      }
    }
  }, [licenses, readers, session?.id, session?.institutionId, session?.type, session?.deptId, session?.studentId, session?.bookIds, session?.departments]);


  function handleLogin(tab, id, password) {
    if (tab === "admin") {
      const a = admins.find((x) => x.id === id && x.password === password);
      if (a) {
        setSession({ role: "admin", id, name: a.name });
        navigate("admin");
        return { ok: true };
      }
      return { ok: false, message: "Incorrect admin ID or password." };
    }
    if (tab === "uploader") {
      const u = uploaders.find((x) => x.id === id && x.password === password);
      if (u) {
        setSession({ role: "uploader", id, name: u.name });
        navigate("uploader");
        return { ok: true };
      }
      return { ok: false, message: "Incorrect uploader ID or password." };
    }
    // reader / institution — check licenses, departments, students, and approved trials
    const license = licenses.find((l) => l.id === id && l.password === password);
    if (license) {
      if (license.type === "offline") {
        return { ok: false, message: "Your institution's access has been temporarily suspended." };
      }
      if (daysUntil(license.endDate) < 0) {
        return { ok: false, message: "This license has expired. Contact the publisher to renew." };
      }
      setSession({
        role: "reader", id, name: license.name, type: "license",
        email: license.email || null, institution: license.institution || license.name,
        institutionId: license.id,
        bookIds: license.bookIds, startDate: license.startDate, endDate: license.endDate,
        departments: license.departments || []
      });
      if (openBookId) navigate("book-details", openBookId);
      else navigate("reader-dashboard");
      return { ok: true };
    }

    // Check college departments and student profiles under licenses
    for (const lic of licenses) {
      const depts = Array.isArray(lic.departments) ? lic.departments : [];

      // 1. Department Login
      const deptMatch = depts.find((d) => (d.loginId === id || d.id === id) && d.password === password);
      if (deptMatch) {
        if (lic.type === "offline") {
          return { ok: false, message: "Your institution's access has been temporarily suspended." };
        }
        if (daysUntil(lic.endDate) < 0) {
          return { ok: false, message: "This institution license has expired. Contact the publisher to renew." };
        }
        setSession({
          role: "reader",
          id: deptMatch.loginId || deptMatch.id,
          deptId: deptMatch.id,
          deptCode: deptMatch.code,
          name: `${lic.name} — ${deptMatch.name}`,
          type: "department",
          institution: lic.name,
          institutionId: lic.id,
          department: deptMatch.name,
          bookIds: lic.bookIds,
          startDate: lic.startDate,
          endDate: lic.endDate,
          currentStudent: null,
          departments: lic.departments || []
        });
        if (openBookId) navigate("book-details", openBookId);
        else navigate("reader-dashboard");
        return { ok: true };
      }

      // 2. Personal Student Profile Login within Department
      for (const d of depts) {
        const students = Array.isArray(d.students) ? d.students : [];
        const stuMatch = students.find((s) => (s.studentId === id || s.id === id) && s.password === password);
        if (stuMatch) {
          if (lic.type === "offline") {
            return { ok: false, message: "Your institution's access has been temporarily suspended." };
          }
          if (daysUntil(lic.endDate) < 0) {
            return { ok: false, message: "This institution license has expired. Contact the publisher to renew." };
          }
          setSession({
            role: "reader",
            id: stuMatch.studentId || stuMatch.id,
            studentId: stuMatch.studentId,
            studentName: stuMatch.name,
            deptId: d.id,
            deptCode: d.code,
            name: stuMatch.name,
            type: "student",
            institution: lic.name,
            institutionId: lic.id,
            department: d.name,
            bookIds: lic.bookIds,
            startDate: lic.startDate,
            endDate: lic.endDate,
            currentStudent: stuMatch,
            departments: lic.departments || []
          });
          if (openBookId) navigate("book-details", openBookId);
          else navigate("reader-dashboard");
          return { ok: true };
        }
      }
    }
    
    // Check readers (individual trial / paid accounts)
    const reader = readers.find(r => r.loginId === id && r.password === password);
    if (reader) {
      if (reader.status === "offline") {
        return { ok: false, message: "Your account has been temporarily suspended." };
      }
      if (reader.status === "revoked" || daysUntil(reader.endDate) < 0) {
        return { ok: false, message: "Your access has expired." };
      }
      setSession({
        role: "reader", id, name: reader.name, type: reader.accountType || "trial",
        email: reader.email || null, institution: reader.institution || null,
        bookIds: reader.bookIds?.length ? reader.bookIds : "all", startDate: reader.startDate, endDate: reader.endDate,
      });
      if (openBookId) navigate("book-details", openBookId);
      else navigate("reader-dashboard");
      return { ok: true };
    }

    const trial = trialRequests.find((t) => t.status === "approved" && t.email === id && t.password === password);
    if (trial) {
      if (daysUntil(trial.expiresAt) < 0) {
        return { ok: false, message: "Your trial has ended." };
      }
      setSession({
        role: "reader", id, name: trial.name, type: "trial",
        bookIds: trial.bookids || "all", startDate: trial.requestedAt, endDate: trial.expiresAt,
      });
      if (openBookId) navigate("book-details", openBookId);
      else navigate("reader-dashboard");
      return { ok: true };
    }
    return { ok: false, message: "No matching account found." };
  }

  function handleLogout() {
    setSession(null);
    navigate("catalog");
  }

  async function handleRequestTrial(form) {
    const newTrial = { id: `t${Date.now()}`, name: form.name, email: form.email, institution: form.institution || "Independent reader", status: "pending", requestedAt: today(), password: null, expiresAt: null };
    try {
      const { requestedAt, expiresAt, ...dbTrial } = newTrial;
      await supabase.from('trial_requests').insert([{ ...dbTrial, requestedat: requestedAt, expiresat: expiresAt }]);
    } catch(e) { console.error(e); }
    setTrialRequests((prev) => [...prev, newTrial]);
  }

  async function handleApproveTrial(id, bookIds = null) {
    const pwd = genPassword();
    const exp = addMonths(today(), 1);
    try {
      const trial = trialRequests.find(t => t.id === id);
      
      if (trial) {
        await supabase.from('readers').insert([{
          login_id: trial.email,
          password: pwd,
          name: trial.name,
          email: trial.email,
          account_type: 'free_trial',
          bookids: bookIds,
          startdate: today(),
          enddate: exp
        }]);
      }

      await supabase.from('trial_requests').update({ status: 'approved', password: pwd, expiresat: exp, bookids: bookIds }).eq('id', id);
      
      if (trial && trial.email) {
        import('./email').then(({ sendTrialApprovalEmail }) => {
          sendTrialApprovalEmail(emailTemplates, trial, pwd, exp);
        });
      }
    } catch(e) { console.error(e); }
    setTrialRequests((prev) => prev.map((t) => (t.id === id ? { ...t, status: "approved", password: pwd, expiresAt: exp, bookids: bookIds } : t)));
  }

  async function handleEditInstitutionAccess(id, bookIds) {
    try {
      const { error } = await supabase.from('licenses').update({ bookids: bookIds }).eq('id', id);
      if (error) {
        console.error("Error updating institution access in DB:", error);
        alert("Database error updating access: " + error.message);
        return;
      }
    } catch(e) { 
      console.error(e); 
      alert("Error updating access: " + e.message);
      return;
    }
    setLicenses((prev) => prev.map(l => l.id === id ? { ...l, bookIds } : l));
    setSession(prev => {
      if (!prev || prev.role !== "reader") return prev;
      if (prev.id === id || prev.institutionId === id) {
        return { ...prev, bookIds };
      }
      return prev;
    });
  }

  async function handleRotateSemesterPassword(id, newPassword) {
    try {
      const { error } = await supabase.from('licenses').update({ password: newPassword }).eq('id', id);
      if (error) {
        console.error("Error updating semester password in DB:", error);
        alert("Database error rotating semester password: " + error.message);
        return false;
      }
    } catch (e) {
      console.error(e);
      alert("Error rotating password: " + e.message);
      return false;
    }
    setLicenses((prev) => prev.map(l => l.id === id ? { ...l, password: newPassword } : l));
    return true;
  }

  async function handleUpdateInstitutionDepartments(licenseId, updatedDepartments) {
    try {
      const { error } = await supabase.from('licenses').update({ departments: updatedDepartments }).eq('id', licenseId);
      if (error) {
        console.error("Error updating institution departments in DB:", error);
        alert("Database error updating departments: " + error.message);
        return false;
      }
    } catch(e) {
      console.error(e);
      alert("Error updating departments: " + e.message);
      return false;
    }
    setLicenses((prev) => prev.map(l => l.id === licenseId ? { ...l, departments: updatedDepartments } : l));
    if (session && (session.id === licenseId || session.institutionId === licenseId)) {
      setSession(prev => ({ ...prev, departments: updatedDepartments }));
    }
    return true;
  }

  async function handleCreateStudentProfile(licenseId, deptId, studentData) {
    try {
      const targetLic = licenses.find(l => l.id === licenseId);
      if (!targetLic) return { ok: false, message: "Institution license not found." };

      const depts = Array.isArray(targetLic.departments) ? [...targetLic.departments] : [];
      const deptIdx = depts.findIndex(d => d.id === deptId);
      if (deptIdx === -1) return { ok: false, message: "Department not found." };

      const currentStudents = Array.isArray(depts[deptIdx].students) ? [...depts[deptIdx].students] : [];
      const studentIdClean = (studentData.studentId || "").trim();
      if (currentStudents.some(s => s.studentId?.toLowerCase() === studentIdClean.toLowerCase())) {
        return { ok: false, message: "A student with this ID / Roll No already exists in this department." };
      }

      const newStudent = {
        id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: studentIdClean,
        name: (studentData.name || "").trim(),
        password: (studentData.password || "").trim(),
        createdAt: new Date().toISOString(),
        customizations: {}
      };

      depts[deptIdx] = {
        ...depts[deptIdx],
        students: [...currentStudents, newStudent]
      };

      const { error } = await supabase.from('licenses').update({ departments: depts }).eq('id', licenseId);
      if (error) throw error;

      setLicenses(prev => prev.map(l => l.id === licenseId ? { ...l, departments: depts } : l));

      // Switch active session to this student
      setSession(prev => ({
        ...prev,
        role: "reader",
        type: "student",
        id: newStudent.studentId,
        studentId: newStudent.studentId,
        studentName: newStudent.name,
        deptId: depts[deptIdx].id,
        deptCode: depts[deptIdx].code,
        name: newStudent.name,
        institution: targetLic.name,
        institutionId: targetLic.id,
        department: depts[deptIdx].name,
        currentStudent: newStudent,
        departments: depts
      }));

      return { ok: true, student: newStudent };
    } catch(err) {
      console.error("Error creating student profile:", err);
      alert("Error creating student profile: " + err.message);
      return { ok: false, message: err.message };
    }
  }

  async function handleSwitchStudentProfile(licenseId, deptId, studentId, studentPassword) {
    const targetLic = licenses.find(l => l.id === licenseId);
    if (!targetLic) return { ok: false, message: "Institution not found" };
    const dept = (targetLic.departments || []).find(d => d.id === deptId);
    if (!dept) return { ok: false, message: "Department not found" };
    const stu = (dept.students || []).find(s => s.studentId === studentId);
    if (!stu) return { ok: false, message: "Student profile not found" };
    if (studentPassword && stu.password && stu.password !== studentPassword) {
      return { ok: false, message: "Incorrect password for this student profile" };
    }
    setSession(prev => ({
      ...prev,
      role: "reader",
      type: "student",
      id: stu.studentId,
      studentId: stu.studentId,
      studentName: stu.name,
      deptId: dept.id,
      deptCode: dept.code,
      name: stu.name,
      institution: targetLic.name,
      institutionId: targetLic.id,
      department: dept.name,
      currentStudent: stu,
      readingProgress: undefined,
      departments: targetLic.departments || []
    }));
    return { ok: true };
  }

  function handleSwitchToDeptLogin(licenseId, deptId) {
    const targetLic = licenses.find(l => l.id === licenseId) || licenses.find(l => l.id === session?.institutionId);
    const depts = targetLic?.departments || session?.departments || [];
    const dept = depts.find(d => d.id === deptId) || depts.find(d => d.id === session?.deptId) || depts[0];

    const deptLoginId = dept?.loginId || `${targetLic?.id || session?.institutionId || 'COL'}-${dept?.code || 'DEPT'}`;
    const deptName = dept?.name || session?.department || "Department";

    setSession(prev => ({
      ...prev,
      role: "reader",
      type: "department",
      id: deptLoginId,
      studentId: null,
      studentName: null,
      currentStudent: null,
      readingProgress: undefined,
      deptId: dept?.id || prev?.deptId,
      deptCode: dept?.code || prev?.deptCode,
      department: deptName,
      name: `${targetLic?.name || prev?.institution || 'College'} — ${deptName}`,
      institution: targetLic?.name || prev?.institution,
      institutionId: targetLic?.id || prev?.institutionId,
      departments: depts
    }));

    return { ok: true };
  }

  async function handleSaveStudentCustomizations(licenseId, deptId, studentId, bookId, customizations) {
    try {
      if (!studentId) return;

      // 1. Instant local persistence for annotations & preferences per student
      const storageKey = `reader_custom_${studentId}_${bookId}`;
      localStorage.setItem(storageKey, JSON.stringify(customizations));

      // 2. Instant local persistence for reading progress per student
      if (customizations.progress) {
        localStorage.setItem(`reader_progress_${studentId}_${bookId}`, JSON.stringify(customizations.progress));
        try {
          const recentKey = `continue_reading_${studentId}`;
          const currentList = JSON.parse(localStorage.getItem(recentKey) || "[]");
          const filtered = currentList.filter(item => item.bookId !== bookId);
          filtered.unshift({ bookId, ...customizations.progress });
          localStorage.setItem(recentKey, JSON.stringify(filtered.slice(0, 15)));
        } catch (_) {}
      }

      if (!licenseId || !deptId) return;

      const targetLic = licenses.find(l => l.id === licenseId);
      if (!targetLic) return;
      const depts = Array.isArray(targetLic.departments) ? [...targetLic.departments] : [];
      const deptIdx = depts.findIndex(d => d.id === deptId);
      if (deptIdx === -1) return;

      const dept = { ...depts[deptIdx] };
      // Increment readsCount tracking if opening or reading
      dept.readsCount = (dept.readsCount || 0) + 1;

      if (Array.isArray(dept.students)) {
        dept.students = dept.students.map(s => {
          if (s.studentId === studentId || s.id === studentId) {
            const stuCustom = s.customizations || {};
            const stuBooks = stuCustom.books || {};
            const stuProgress = stuCustom.readingProgress || {};
            return {
              ...s,
              customizations: {
                ...stuCustom,
                ...customizations.global,
                books: {
                  ...stuBooks,
                  [bookId]: customizations.book
                },
                readingProgress: customizations.progress ? {
                  ...stuProgress,
                  [bookId]: customizations.progress
                } : stuProgress
              }
            };
          }
          return s;
        });
      }

      depts[deptIdx] = dept;
      await supabase.from('licenses').update({ departments: depts }).eq('id', licenseId);
      setLicenses(prev => prev.map(l => l.id === licenseId ? { ...l, departments: depts } : l));

      // Realtime session sync so ReaderDashboard updates instantly without reload
      if (session && (session.studentId === studentId || session.id === studentId)) {
        setSession(prev => {
          const prevCustom = prev.currentStudent?.customizations || {};
          const prevBooks = prevCustom.books || {};
          const prevProgress = prevCustom.readingProgress || {};
          return {
            ...prev,
            currentStudent: {
              ...prev.currentStudent,
              customizations: {
                ...prevCustom,
                ...customizations.global,
                books: {
                  ...prevBooks,
                  [bookId]: customizations.book
                },
                readingProgress: customizations.progress ? {
                  ...prevProgress,
                  [bookId]: customizations.progress
                } : prevProgress
              }
            }
          };
        });
      }
    } catch (err) {
      console.warn("Non-blocking student customization sync notice:", err);
    }
  }
  
  async function handleEditTrialAccess(id, bookIds) {
    try {
      const { error } = await supabase.from('trial_requests').update({ bookids: bookIds }).eq('id', id);
      if (error) console.error("Error updating trial in DB:", error);
      
      const trial = trialRequests.find(t => t.id === id);
      if (trial && trial.email) {
        await supabase.from('readers').update({ bookids: bookIds }).eq('login_id', trial.email);
        setReaders(prev => prev.map(r => r.loginId === trial.email ? { ...r, bookIds } : r));
      }
    } catch(e) { console.error(e); }
    setTrialRequests((prev) => prev.map(t => t.id === id ? { ...t, bookids: bookIds } : t));
    if (session && (session.id === id || (session.email && trialRequests.find(t => t.id === id)?.email === session.email))) {
      setSession(prev => ({ ...prev, bookIds }));
    }
  }

  async function handleRejectTrial(id) {
    try {
      await supabase.from('trial_requests').update({ status: 'rejected' }).eq('id', id);
      
      const trial = trialRequests.find(t => t.id === id);
      if (trial && trial.email) {
        import('./email').then(({ sendTrialRejectionEmail }) => {
          sendTrialRejectionEmail(emailTemplates, trial);
        });
      }
    } catch(e) { console.error(e); }
    setTrialRequests((prev) => prev.map((t) => (t.id === id ? { ...t, status: "rejected" } : t)));
  }

  async function handleDeleteTrial(id) {
    const trial = trialRequests.find((t) => t.id === id);
    try {
      const { error } = await supabase.from('trial_requests').delete().eq('id', id);
      if (error) {
        console.error("Error deleting trial request:", error);
        alert("Database error deleting trial request: " + error.message);
        return false;
      }
      if (trial?.email) {
        await supabase.from('readers').delete().eq('login_id', trial.email).eq('account_type', 'free_trial');
      }
    } catch (e) {
      console.error("Error deleting trial request:", e);
      alert("Error deleting trial request: " + e.message);
      return false;
    }
    setTrialRequests((prev) => prev.filter((t) => t.id !== id));
    if (trial?.email) {
      setReaders((prev) => prev.filter((r) => !(r.loginId === trial.email && r.accountType === 'free_trial')));
    }
    return true;
  }

  async function handleDeleteRejectedTrials() {
    try {
      const { error } = await supabase.from('trial_requests').delete().eq('status', 'rejected');
      if (error) {
        console.error("Error deleting rejected trial requests:", error);
        alert("Database error deleting rejected trial requests: " + error.message);
        return false;
      }
    } catch (e) {
      console.error("Error deleting rejected trial requests:", e);
      alert("Error deleting rejected trial requests: " + e.message);
      return false;
    }
    setTrialRequests((prev) => prev.filter((t) => t.status !== 'rejected'));
    return true;
  }

  async function handleCreateLicense(license) {
    try {
      const { bookIds, startDate, endDate, createdAt, email, departments, ...dbLicense } = license;
      const { error } = await supabase.from('licenses').insert([{ 
        ...dbLicense, 
        bookids: bookIds, 
        startdate: startDate, 
        enddate: endDate,
        createdat: createdAt,
        email: email || null,
        departments: Array.isArray(departments) ? departments : (Array.isArray(license.departments) ? license.departments : [])
      }]);
      if (error) { 
        console.error("Error creating institution license:", error); 
        alert("Database error: " + error.message); 
        return false; 
      }
      
      if (email) {
        import('./email').then(({ sendInstitutionLicenseEmail }) => {
          sendInstitutionLicenseEmail(emailTemplates, email, license.name, license.id, license.password, startDate, endDate);
        });
      }
      setLicenses((prev) => [...prev, { ...license, departments: Array.isArray(departments) ? departments : [] }]);
      return true;
    } catch(e) { 
      console.error("Error in handleCreateLicense:", e); 
      alert("Error: " + e.message);
      return false;
    }
  }

  async function handleResendTrialEmail(id, type) {
    const trial = trialRequests.find(t => t.id === id);
    if (!trial || !trial.email) {
      alert("No email address found for this trial.");
      return;
    }
    try {
      if (type === 'approved') {
        import('./email').then(({ sendTrialApprovalEmail }) => {
          sendTrialApprovalEmail(emailTemplates, trial, trial.password, trial.expiresAt);
        });
      } else {
        import('./email').then(({ sendTrialRejectionEmail }) => {
          sendTrialRejectionEmail(emailTemplates, trial);
        });
      }
      alert("Email resent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to resend email.");
    }
  }

  async function handleResendInstitutionEmail(id) {
    const license = licenses.find(l => l.id === id);
    if (!license || !license.email) {
      alert("No email address saved for this institution.");
      return;
    }
    try {
      import('./email').then(({ sendInstitutionLicenseEmail }) => {
        sendInstitutionLicenseEmail(emailTemplates, license.email, license.name, license.id, license.password, license.startDate, license.endDate);
      });
      alert("Email resent successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to resend email.");
    }
  }

  async function handleUpdateEmailTemplate(templateId, subject, body) {
    try {
      const { error } = await supabase.from('email_templates')
        .upsert({ id: templateId, subject, body, name: templateId });
      if (error) throw error;
      
      setEmailTemplates(prev => {
        const exists = prev.find(t => t.id === templateId);
        if (exists) return prev.map(t => t.id === templateId ? { ...t, subject, body } : t);
        return [...prev, { id: templateId, name: templateId, subject, body }];
      });
      alert("Template saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save template: " + e.message);
    }
  }

  async function handleRevokeLicense(id) {
    try {
      const { error } = await supabase.from('licenses').update({ enddate: today() }).eq('id', id);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
    } catch(e) { console.error(e); }
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, endDate: today() } : l)));
    if (session && (session.id === id || session.institutionId === id)) {
      alert("Your institution license has expired or was revoked.");
      handleLogout();
    }
  }

  async function handleDeleteLicense(id) {
    try {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) {
        console.error("Error deleting institution license:", error);
        alert("Database error deleting institution: " + error.message);
        return false;
      }
      // Best-effort cleanup of active telemetry sessions for this institution
      await supabase.from('reading_sessions').delete().eq('license_id', id);
    } catch (e) {
      console.error("Error deleting institution license:", e);
      alert("Error deleting institution: " + e.message);
      return false;
    }
    setLicenses((prev) => prev.filter((l) => l.id !== id));
    setActiveReadingSessions((prev) => prev.filter((s) => s.license_id !== id));
    if (session && (session.id === id || session.institutionId === id)) {
      alert("Your institution license has been removed.");
      handleLogout();
    }
    return true;
  }

  async function handleToggleLicenseStatus(id, isOffline) {
    const newType = isOffline ? "offline" : "license";
    try {
      const { error } = await supabase.from('licenses').update({ type: newType }).eq('id', id);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
    } catch(e) { console.error(e); }
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, type: newType } : l)));
    if (isOffline && session && (session.id === id || session.institutionId === id)) {
      alert("Your institution's access has been temporarily suspended.");
      handleLogout();
    }
  }

  async function handleCreateReader(readerData) {
    try {
      const dbRow = {
        login_id: readerData.loginId,
        password: readerData.password,
        name: readerData.name,
        email: readerData.email || null,
        account_type: readerData.accountType || "individual",
        bookids: readerData.bookIds || [],
        startdate: readerData.startDate,
        enddate: readerData.endDate,
        status: "active",
        price: Number(readerData.price) || 0,
        type: "individual"
      };
      const { data, error } = await supabase.from('readers').insert([dbRow]).select();
      if (error) { console.error(error); alert("Database error: " + error.message); return; }

      if (readerData.email) {
        import('./email').then(({ sendIndividualReaderEmail }) => {
          sendIndividualReaderEmail(emailTemplates, readerData.email, readerData.name, readerData.loginId, readerData.password, readerData.startDate, readerData.endDate);
        });
      }

      const inserted = data && data[0]
        ? { ...data[0], loginId: data[0].login_id, accountType: data[0].account_type, bookIds: data[0].bookids || [], startDate: data[0].startdate, endDate: data[0].enddate, status: "active", price: Number(data[0].price || 0) }
        : { ...readerData, id: `r_${Date.now()}`, status: "active" };
      setReaders(prev => [...prev, inserted]);
    } catch (e) {
      console.error("Error creating reader:", e);
      alert("Database error: " + e.message);
    }
  }

  async function handleEditReaderAccess(readerId, bookIds) {
    try {
      const { error } = await supabase.from('readers').update({ bookids: bookIds }).eq('id', readerId);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
      setReaders(prev => prev.map(r => r.id === readerId ? { ...r, bookIds } : r));
      const targetReader = readers.find(r => r.id === readerId);
      setSession(prev => {
        if (!prev || prev.role !== "reader") return prev;
        if (prev.id === readerId || (targetReader && (prev.id === targetReader.loginId || prev.email === targetReader.email || prev.loginId === targetReader.loginId))) {
          return { ...prev, bookIds: bookIds?.length ? bookIds : "all" };
        }
        return prev;
      });
      alert("Reader access updated successfully!");
    } catch (e) {
      console.error("Error updating reader access:", e);
      alert("Failed to update access: " + e.message);
    }
  }

  async function handleToggleReaderStatus(readerId, isOffline) {
    const newStatus = isOffline ? "offline" : "active";
    try {
      const { error } = await supabase.from('readers').update({ status: newStatus }).eq('id', readerId);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
      setReaders(prev => prev.map(r => r.id === readerId ? { ...r, status: newStatus } : r));
      const targetReader = readers.find(r => r.id === readerId);
      if (isOffline && session && (session.id === readerId || session.loginId === readerId || (targetReader && session.id === targetReader.loginId))) {
        alert("Your account has been temporarily suspended.");
        handleLogout();
      }
    } catch (e) {
      console.error("Error toggling reader status:", e);
      alert("Database error: " + e.message);
    }
  }

  async function handleRevokeReader(readerId) {
    try {
      const { error } = await supabase.from('readers').update({ enddate: today(), status: "revoked" }).eq('id', readerId);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
      setReaders(prev => prev.map(r => r.id === readerId ? { ...r, endDate: today(), status: "revoked" } : r));
      const targetReader = readers.find(r => r.id === readerId);
      if (session && (session.id === readerId || session.loginId === readerId || (targetReader && session.id === targetReader.loginId))) {
        alert("Your reader account has expired.");
        handleLogout();
      }
    } catch (e) {
      console.error("Error revoking reader:", e);
      alert("Database error: " + e.message);
    }
  }

  async function handleDeleteReader(readerId) {
    const reader = readers.find(r => r.id === readerId);
    try {
      const { error } = await supabase.from('readers').delete().eq('id', readerId);
      if (error) {
        console.error("Error deleting individual user:", error);
        alert("Database error deleting user: " + error.message);
        return false;
      }
      const sessionLicenseKey = reader?.loginId || readerId;
      await supabase.from('reading_sessions').delete().eq('license_id', sessionLicenseKey);
    } catch (e) {
      console.error("Error deleting individual user:", e);
      alert("Error deleting user: " + e.message);
      return false;
    }
    setReaders(prev => prev.filter(r => r.id !== readerId));
    if (session && (session.id === readerId || session.loginId === readerId || (reader && session.id === reader.loginId))) {
      alert("Your reader account has been removed.");
      handleLogout();
    }
    return true;
  }

  async function handleResendReaderEmail(readerId) {
    const reader = readers.find(r => r.id === readerId);
    if (!reader || !reader.email) {
      alert("No email address saved for this user.");
      return;
    }
    try {
      const { sendIndividualReaderEmail } = await import('./email');
      await sendIndividualReaderEmail(emailTemplates, reader.email, reader.name, reader.loginId, reader.password, reader.startDate, reader.endDate);
      alert("Email resent successfully!");
    } catch (e) {
      console.error("Error resending email:", e);
      alert("Failed to resend email.");
    }
  }

  async function handleAddUploader(u) {
    try {
      const { error } = await supabase.from('uploaders').insert([u]);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
    } catch(e) { console.error(e); }
    setUploaders((prev) => [...prev, u]);
  }

  async function handleRemoveUploader(id) {
    try {
      await supabase.from('uploaders').delete().eq('id', id);
    } catch(e) { console.error(e); }
    setUploaders((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleAddFeaturedAuthor(author) {
    const id = "author_" + Date.now();
    const newAuthor = { ...author, id };
    try {
      const { error } = await supabase.from('featured_authors').insert([{ id: newAuthor.id, name: newAuthor.name, photo_url: newAuthor.photo_url, bio: newAuthor.bio }]);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
    } catch(e) { console.error(e); }
    setFeaturedAuthors((prev) => [...prev, { ...newAuthor, photoUrl: newAuthor.photo_url }]);
  }

  async function handleRemoveFeaturedAuthor(id) {
    try {
      await supabase.from('featured_authors').delete().eq('id', id);
    } catch(e) { console.error(e); }
    setFeaturedAuthors((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAddBook(book) {
    try {
      let pdfurl = null;
      let coverurl = null;

      if (book.pdfFile) {
        const fileExt = book.pdfFile.name.split('.').pop();
        const fileName = `${book.id}.${fileExt}`;
        const { error } = await supabase.storage.from('pdfs').upload(fileName, book.pdfFile);
        if (error) console.error("PDF upload error:", error);
        else pdfurl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
      }
      
      if (book.coverImage) {
        const fileExt = book.coverImage.name.split('.').pop();
        const fileName = `${book.id}.${fileExt}`;
        const { error } = await supabase.storage.from('covers').upload(fileName, book.coverImage);
        if (error) console.error("Cover upload error:", error);
        else coverurl = supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
      }

      // Handle EPUB / Multi-section uploads
      let epubData = book.epubData || null;
      if (book.uploadFormat === "epub" || (book.chapters && book.chapters.length > 0)) {
        let firstPageUrl = book.firstPageUrl || null;
        if (book.firstPageFile) {
          const ext = book.firstPageFile.name.split('.').pop();
          const fileName = `${book.id}_first_page_${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from('pdfs').upload(fileName, book.firstPageFile);
          if (error) console.error("First page upload error:", error);
          else firstPageUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
        }

        let contentsPageUrl = book.contentsPageUrl || null;
        if (book.contentsPageFile) {
          const ext = book.contentsPageFile.name.split('.').pop();
          const fileName = `${book.id}_contents_${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from('pdfs').upload(fileName, book.contentsPageFile);
          if (error) console.error("Contents page upload error:", error);
          else contentsPageUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
        }

        const uploadedChapters = [];
        const chaptersList = book.chapters || [];
        for (let i = 0; i < chaptersList.length; i++) {
          const chap = chaptersList[i];
          let chapUrl = chap.url || null;
          if (chap.file) {
            const ext = chap.file.name.split('.').pop();
            const fileName = `${book.id}_chap_${chap.number || i + 1}_${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('pdfs').upload(fileName, chap.file);
            if (error) console.error(`Chapter ${i + 1} upload error:`, error);
            else chapUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
          }
          uploadedChapters.push({
            id: chap.id || `chap-${i + 1}`,
            number: chap.number || (i + 1),
            title: chap.title || `Chapter ${i + 1}`,
            url: chapUrl,
            fileName: chap.file ? chap.file.name : (chap.fileName || null)
          });
        }

        epubData = {
          type: "epub",
          format: "epub",
          coverPage: { url: coverurl },
          firstPage: { url: firstPageUrl, fileName: book.firstPageFile?.name || null },
          contentsPage: { url: contentsPageUrl, fileName: book.contentsPageFile?.name || null },
          chapters: uploadedChapters
        };

        if (!pdfurl) {
          pdfurl = firstPageUrl || uploadedChapters.find(c => c.url)?.url || null;
        }
      }

      const finalPages = epubData ? epubData : (book.pages || ["This book has no content pages yet."]);
      const finalDescription = epubData
        ? `${book.description || ""}\n\n__EPUB_DATA__:${JSON.stringify(epubData)}`
        : book.description;

      const dbBook = {
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        pubtype: book.pubType,
        publisher: book.publisher,
        price: book.price,
        color: book.color,
        firstpublish: book.firstPublish,
        copyright: book.copyright,
        printisbn: book.printIsbn,
        onlineisbn: book.onlineIsbn,
        description: finalDescription,
        totalpages: book.totalPages,
        pages: finalPages,
        pdfurl,
        coverurl,
        uploaded_by: session?.id || "admin",
        status: "published"
      };
      
      const { error } = await supabase.from('books').insert([dbBook]);
      if (error) {
        console.error("Error adding book to Supabase:", error);
        alert("Database error adding book: " + error.message);
        return false;
      }
      setBooks((prev) => [{...book, pdfUrl: pdfurl, coverUrl: coverurl, epubData}, ...prev]);
      return true;
    } catch (err) {
      console.error("Error adding book to Supabase:", err);
      alert("Error adding book: " + err.message);
      return false;
    }
  }
  
  async function handleEditBook(id, updatedBook) {
    try {
      let pdfurl = updatedBook.pdfUrl || null;
      let coverurl = updatedBook.coverUrl || null;

      if (updatedBook.pdfFile) {
        const fileExt = updatedBook.pdfFile.name.split('.').pop();
        const fileName = `${id}.${fileExt}`;
        const { error } = await supabase.storage.from('pdfs').upload(fileName, updatedBook.pdfFile, { upsert: true });
        if (!error) pdfurl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
      }
      
      if (updatedBook.coverImage) {
        const fileExt = updatedBook.coverImage.name.split('.').pop();
        const fileName = `${id}.${fileExt}`;
        const { error } = await supabase.storage.from('covers').upload(fileName, updatedBook.coverImage, { upsert: true });
        if (!error) coverurl = supabase.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
      }

      // Handle EPUB / Multi-section uploads on edit
      let epubData = updatedBook.epubData || null;
      if (updatedBook.uploadFormat === "epub" || (updatedBook.chapters && updatedBook.chapters.length > 0)) {
        let firstPageUrl = updatedBook.firstPageUrl || null;
        if (updatedBook.firstPageFile) {
          const ext = updatedBook.firstPageFile.name.split('.').pop();
          const fileName = `${id}_first_page_${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from('pdfs').upload(fileName, updatedBook.firstPageFile, { upsert: true });
          if (!error) firstPageUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
        }

        let contentsPageUrl = updatedBook.contentsPageUrl || null;
        if (updatedBook.contentsPageFile) {
          const ext = updatedBook.contentsPageFile.name.split('.').pop();
          const fileName = `${id}_contents_${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from('pdfs').upload(fileName, updatedBook.contentsPageFile, { upsert: true });
          if (!error) contentsPageUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
        }

        const uploadedChapters = [];
        const chaptersList = updatedBook.chapters || [];
        for (let i = 0; i < chaptersList.length; i++) {
          const chap = chaptersList[i];
          let chapUrl = chap.url || null;
          if (chap.file) {
            const ext = chap.file.name.split('.').pop();
            const fileName = `${id}_chap_${chap.number || i + 1}_${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('pdfs').upload(fileName, chap.file, { upsert: true });
            if (!error) chapUrl = supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl;
          }
          uploadedChapters.push({
            id: chap.id || `chap-${i + 1}`,
            number: chap.number || (i + 1),
            title: chap.title || `Chapter ${i + 1}`,
            url: chapUrl,
            fileName: chap.file ? chap.file.name : (chap.fileName || null)
          });
        }

        epubData = {
          type: "epub",
          format: "epub",
          coverPage: { url: coverurl },
          firstPage: { url: firstPageUrl, fileName: updatedBook.firstPageFile?.name || (updatedBook.epubData?.firstPage?.fileName || null) },
          contentsPage: { url: contentsPageUrl, fileName: updatedBook.contentsPageFile?.name || (updatedBook.epubData?.contentsPage?.fileName || null) },
          chapters: uploadedChapters
        };

        if (!pdfurl) {
          pdfurl = firstPageUrl || uploadedChapters.find(c => c.url)?.url || null;
        }
      }

      const finalPages = epubData ? epubData : (updatedBook.pages || ["This book has no content pages yet."]);
      const finalDescription = epubData
        ? `${updatedBook.description || ""}\n\n__EPUB_DATA__:${JSON.stringify(epubData)}`
        : updatedBook.description;

      const dbBook = {
        title: updatedBook.title,
        author: updatedBook.author,
        genre: updatedBook.genre,
        pubtype: updatedBook.pubType,
        publisher: updatedBook.publisher,
        price: updatedBook.price,
        color: updatedBook.color,
        firstpublish: updatedBook.firstPublish,
        copyright: updatedBook.copyright,
        printisbn: updatedBook.printIsbn,
        onlineisbn: updatedBook.onlineIsbn,
        description: finalDescription,
        totalpages: updatedBook.totalPages,
        pages: finalPages,
        pdfurl,
        coverurl
      };
      
      const { error, data } = await supabase.from('books').update(dbBook).eq('id', id).select();
      if (!error && (!data || data.length === 0)) {
        // Fallback: If book was not yet in the Supabase table, insert it so it persists
        const { error: insertErr } = await supabase.from('books').insert([{ id, ...dbBook, uploaded_by: session?.id || null, status: "published" }]);
        if (insertErr) console.error("Insert fallback error:", insertErr);
      }
      if (error) {
        console.error("Supabase update error:", error);
        alert("Failed to update book in Supabase: " + error.message);
      } else {
        setBooks((prev) => prev.map(b => b.id === id ? { ...b, ...updatedBook, pdfUrl: pdfurl, coverUrl: coverurl, epubData } : b));
      }
    } catch (err) {
      console.error("Edit catch error:", err);
      alert("Error editing book: " + err.message);
    }
  }

  async function handleDeleteBook(id) {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) {
        console.error("Error deleting book from Supabase:", error);
        alert("Database error deleting book: " + error.message);
        return false;
      }
      setBooks((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting book from Supabase:", err);
      alert("Error deleting book: " + err.message);
      return false;
    }
  }

  async function handleRenameBookMetadata(field, oldValue, newValue) {
    const colMap = {
      genre: { stateKey: "genre", dbCol: "genre" },
      pubType: { stateKey: "pubType", dbCol: "pubtype" },
      publisher: { stateKey: "publisher", dbCol: "publisher" },
    };
    const mapping = colMap[field];
    if (!mapping || !oldValue || !newValue || oldValue === newValue) return;

    setBooks((prev) =>
      prev.map((b) => (b[mapping.stateKey] === oldValue ? { ...b, [mapping.stateKey]: newValue } : b))
    );
    try {
      const { error } = await supabase
        .from("books")
        .update({ [mapping.dbCol]: newValue })
        .eq(mapping.dbCol, oldValue);
      if (error) console.error("Error renaming metadata in Supabase:", error);
    } catch (err) {
      console.error("Error renaming metadata in Supabase:", err);
    }
  }

  const availableBooks = useMemo(() => {
    const safeBooks = books || [];
    if (session?.role === "reader") {
      let allowedIds = session.bookIds;
      // Authoritatively resolve allowed IDs from licenses or readers
      const licId = session.institutionId || (session.type === "license" ? session.id : null);
      if (licId) {
        const lic = licenses.find(l => l.id === licId);
        if (lic && Array.isArray(lic.bookIds)) {
          allowedIds = lic.bookIds;
        }
      } else {
        const r = readers.find(x => x.id === session.id || x.loginId === session.id || (session.email && x.email === session.email));
        if (r && r.bookIds) {
          allowedIds = r.bookIds?.length ? r.bookIds : "all";
        }
      }

      if (allowedIds === "all") return safeBooks;
      const ids = Array.isArray(allowedIds) ? allowedIds : [];
      return safeBooks.filter(b => ids.includes(b.id));
    }
    return safeBooks;
  }, [books, session, licenses, readers]);

  const openBook = openBookId ? availableBooks.find((b) => b.id === openBookId) : null;

  // If access to open book is revoked, safely redirect back to reader-dashboard
  useEffect(() => {
    if (session?.role === "reader" && openBookId && !openBook) {
      if (view === "reading" || view === "book-details") {
        alert("You no longer have access to this title. Returning to your library.");
        setInitialReaderPage(null);
        setOpenBookId(null);
        navigate("reader-dashboard");
      }
    }
  }, [session?.role, openBookId, openBook, view]);

  return (
    <div className="min-h-screen w-full max-w-full admin-glass-backdrop relative">
      <Header session={session} view={view} onNavigate={navigate} onLogout={handleLogout} />

      {view === "catalog" && <CatalogPage books={availableBooks} onNavigate={navigate} />}
      {view === "authors" && <AuthorsPage books={availableBooks} featuredAuthors={featuredAuthors} onNavigate={navigate} />}
      {view === "book-details" && openBook && <BookDetailsPage book={openBook} onNavigate={navigate} session={session} />}
      {view.startsWith("page:") && <StaticPage title={getPages()[view.split(":")[1]]?.title} content={getPages()[view.split(":")[1]]?.content} onNavigate={navigate} />}
      {view === "login" && <LoginPage onLogin={handleLogin} />}
      {view === "login-admin" && <LoginPage onLogin={handleLogin} mode="admin" />}
      {view === "login-reader" && <LoginPage onLogin={handleLogin} mode="reader" />}
      {view === "trial" && <TrialPage onRequestTrial={handleRequestTrial} onNavigate={navigate} />}

      {view === "reader-dashboard" && session?.role === "reader" && (
        <ReaderDashboard
          session={session}
          books={availableBooks}
          onOpenBook={(id, pageNum) => {
            if (pageNum) {
              navigate("reading", id, pageNum);
            } else {
              navigate("book-details", id);
            }
          }}
          onCreateStudentProfile={handleCreateStudentProfile}
          onSwitchStudentProfile={handleSwitchStudentProfile}
          onSwitchToDeptLogin={handleSwitchToDeptLogin}
        />
      )}
      {view === "reading" && session && openBook && (
        <SecureReader
          book={openBook}
          session={session}
          initialPage={initialReaderPage}
          onBack={() => {
            setInitialReaderPage(null);
            navigate(session.role === "reader" ? "reader-dashboard" : session.role);
          }}
          onSaveStudentCustomizations={handleSaveStudentCustomizations}
        />
      )}

      {view === "uploader" && session?.role === "uploader" && (
        <UploaderPanel books={books} onAddBook={handleAddBook} onEditBook={handleEditBook} onDeleteBook={handleDeleteBook} dbStatus={dbStatus} onNavigate={navigate} />
      )}

      {view === "admin" && session?.role === "admin" && (
        <AdminPanel
          books={books} licenses={licenses} uploaders={uploaders} trialRequests={trialRequests} readers={readers} subscribers={subscribers} emailTemplates={emailTemplates}
          featuredAuthors={featuredAuthors} activeReadingSessions={activeReadingSessions}
          onCreateLicense={handleCreateLicense} onRevokeLicense={handleRevokeLicense} onDeleteLicense={handleDeleteLicense} onToggleLicenseStatus={handleToggleLicenseStatus}
          onEditInstitutionAccess={handleEditInstitutionAccess} onRotateSemesterPassword={handleRotateSemesterPassword}
          onUpdateInstitutionDepartments={handleUpdateInstitutionDepartments}
          onCreateReader={handleCreateReader} onRevokeReader={handleRevokeReader} onDeleteReader={handleDeleteReader} onToggleReaderStatus={handleToggleReaderStatus}
          onEditReaderAccess={handleEditReaderAccess} onResendReaderEmail={handleResendReaderEmail}
          onAddUploader={handleAddUploader} onRemoveUploader={handleRemoveUploader}
          onApproveTrial={handleApproveTrial} onRejectTrial={handleRejectTrial} onDeleteTrial={handleDeleteTrial} onDeleteRejectedTrials={handleDeleteRejectedTrials} onEditTrialAccess={handleEditTrialAccess}
          onResendTrialEmail={handleResendTrialEmail} onResendInstitutionEmail={handleResendInstitutionEmail}
          onUpdateEmailTemplate={handleUpdateEmailTemplate}
          onAddFeaturedAuthor={handleAddFeaturedAuthor} onRemoveFeaturedAuthor={handleRemoveFeaturedAuthor}
          onAddBook={handleAddBook} onEditBook={handleEditBook} onDeleteBook={handleDeleteBook}
          onRenameBookMetadata={handleRenameBookMetadata} dbStatus={dbStatus}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
