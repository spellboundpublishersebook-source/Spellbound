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

  // Keep hash in sync with state
  function navigate(v, bookId = null) {
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
  const [dbStatus, setDbStatus] = useState("checking");

  async function fetchAllData() {
    try {
      await fetchSettingsFromDB();
      const { data: booksData, error: booksError } = await supabase.from('books').select('*');
      if (booksError) throw booksError;
      setDbStatus("connected");
      
      if (booksData && booksData.length > 0) {
        setBooks(booksData.map(dbBook => ({
          id: dbBook.id, title: dbBook.title, author: dbBook.author, genre: dbBook.genre, pubType: dbBook.pubtype,
          publisher: dbBook.publisher, price: dbBook.price, color: dbBook.color,
          firstPublish: dbBook.firstpublish, copyright: dbBook.copyright,
          printIsbn: dbBook.printisbn, onlineIsbn: dbBook.onlineisbn, description: dbBook.description,
          totalPages: dbBook.totalpages, pages: dbBook.pages || ["This book has no content pages yet."],
          pdfUrl: dbBook.pdfurl, coverUrl: dbBook.coverurl
        })));
      }

      const { data: licData } = await supabase.from('licenses').select('*');
      if (licData && licData.length > 0) {
        setLicenses(licData.map(l => ({ ...l, bookIds: l.bookids || [], startDate: l.startdate, endDate: l.enddate })));
      }

      const { data: uplData } = await supabase.from('uploaders').select('*');
      if (uplData && uplData.length > 0) setUploaders(uplData);

      const { data: triData } = await supabase.from('trial_requests').select('*');
      if (triData && triData.length > 0) {
        setTrialRequests(triData.map(t => ({ ...t, requestedAt: t.requestedat, expiresAt: t.expiresat })));
      }

      const { data: readData } = await supabase.from('readers').select('*');
      if (readData && readData.length > 0) {
        setReaders(readData.map(r => ({ ...r, loginId: r.login_id, accountType: r.account_type, bookIds: r.bookids || [], startDate: r.startdate, endDate: r.enddate })));
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
    } catch (err) {
      console.error("Error fetching data from Supabase. Falling back to mock data.", err);
      setDbStatus("error");
    }
  }

  useEffect(() => {
    fetchAllData();

    if (!supabase) return;

    // --- REAL-TIME SUBSCRIPTIONS ---
    const channel = supabase.channel('global-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, (payload) => {
        if (payload.eventType === 'INSERT') setSubscribers(prev => [...prev, payload.new]);
        else if (payload.eventType === 'DELETE') setSubscribers(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'readers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReaders(prev => [...prev, { ...payload.new, loginId: payload.new.login_id, accountType: payload.new.account_type, bookIds: payload.new.bookids || [], startDate: payload.new.startdate, endDate: payload.new.enddate }]);
        } else if (payload.eventType === 'UPDATE') {
          setReaders(prev => prev.map(r => r.id === payload.new.id ? { ...payload.new, loginId: payload.new.login_id, accountType: payload.new.account_type, bookIds: payload.new.bookids || [], startDate: payload.new.startdate, endDate: payload.new.enddate } : r));
        } else if (payload.eventType === 'DELETE') {
          setReaders(prev => prev.filter(r => r.id !== payload.old.id));
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
          setLicenses(prev => [...prev, { ...payload.new, bookIds: payload.new.bookids || [], startDate: payload.new.startdate, endDate: payload.new.enddate }]);
        } else if (payload.eventType === 'UPDATE') {
          setLicenses(prev => prev.map(l => l.id === payload.new.id ? { ...payload.new, bookIds: payload.new.bookids || [], startDate: payload.new.startdate, endDate: payload.new.enddate } : l));
        } else if (payload.eventType === 'DELETE') {
          setLicenses(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


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
    // reader / institution — check licenses and approved trials
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
        bookIds: license.bookIds, startDate: license.startDate, endDate: license.endDate,
      });
      if (openBookId) navigate("book-details", openBookId);
      else navigate("reader-dashboard");
      return { ok: true };
    }
    
    // Check readers (individual trial / paid accounts)
    const reader = readers.find(r => r.loginId === id && r.password === password);
    if (reader) {
      if (daysUntil(reader.endDate) < 0) {
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
    if (session && session.id === id) {
      setSession(prev => ({ ...prev, bookIds }));
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

  async function handleCreateLicense(license) {
    try {
      const { bookIds, startDate, endDate, createdAt, email, ...dbLicense } = license;
      const { error } = await supabase.from('licenses').insert([{ 
        ...dbLicense, 
        bookids: bookIds, 
        startdate: startDate, 
        enddate: endDate,
        createdat: createdAt,
        email: email || null
      }]);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
      
      if (email) {
        import('./email').then(({ sendInstitutionLicenseEmail }) => {
          sendInstitutionLicenseEmail(emailTemplates, email, license.name, license.id, license.password, startDate, endDate);
        });
      }
    } catch(e) { console.error(e); }
    setLicenses((prev) => [...prev, license]);
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
  }

  async function handleToggleLicenseStatus(id, isOffline) {
    const newType = isOffline ? "offline" : "license";
    try {
      const { error } = await supabase.from('licenses').update({ type: newType }).eq('id', id);
      if (error) { console.error(error); alert("Database error: " + error.message); return; }
    } catch(e) { console.error(e); }
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, type: newType } : l)));
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
        description: book.description,
        totalpages: book.totalPages,
        pages: book.pages,
        pdfurl,
        coverurl,
        uploaded_by: session.id,
        status: "published"
      };
      
      const { error } = await supabase.from('books').insert([dbBook]);
      if (error) throw error;
      setBooks((prev) => [{...book, pdfUrl: pdfurl, coverUrl: coverurl}, ...prev]);
    } catch (err) {
      console.error("Error adding book to Supabase:", err);
      // Optimistic update fallback
      setBooks((prev) => [book, ...prev]);
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
        description: updatedBook.description,
        totalpages: updatedBook.totalPages,
        pages: updatedBook.pages,
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
        setBooks((prev) => prev.map(b => b.id === id ? { ...b, ...updatedBook, pdfUrl: pdfurl, coverUrl: coverurl } : b));
      }
    } catch (err) {
      console.error("Edit catch error:", err);
      alert("Error editing book: " + err.message);
    }
  }

  async function handleDeleteBook(id) {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Error deleting book from Supabase:", err);
      // Optimistic update fallback
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  }

  const availableBooks = useMemo(() => {
    const safeBooks = books || [];
    if (session?.role === "reader" && session.bookIds !== "all") {
      const ids = Array.isArray(session.bookIds) ? session.bookIds : [];
      return safeBooks.filter(b => ids.includes(b.id));
    }
    return safeBooks;
  }, [books, session]);

  const openBook = openBookId ? availableBooks.find((b) => b.id === openBookId) : null;

  return (
    <div>
      <Header session={session} view={view} onNavigate={navigate} onLogout={handleLogout} />

      {view === "catalog" && <CatalogPage books={availableBooks} onNavigate={navigate} />}
      {view === "authors" && <AuthorsPage books={availableBooks} featuredAuthors={featuredAuthors} onNavigate={navigate} />}
      {view === "book-details" && openBook && <BookDetailsPage book={openBook} onNavigate={navigate} session={session} />}
      {view.startsWith("page:") && <StaticPage title={getPages()[view.split(":")[1]]?.title} content={getPages()[view.split(":")[1]]?.content} onNavigate={navigate} />}
      {view === "login" && <LoginPage onLogin={handleLogin} />}
      {view === "login-admin" && <LoginPage onLogin={handleLogin} mode="admin" />}
      {view === "login-reader" && <LoginPage onLogin={handleLogin} mode="reader" />}
      {view === "trial" && <TrialPage onRequestTrial={handleRequestTrial} />}

      {view === "reader-dashboard" && session?.role === "reader" && (
        <ReaderDashboard session={session} books={availableBooks} onOpenBook={(id) => navigate("book-details", id)} />
      )}
      {view === "reading" && session && openBook && (
        <SecureReader book={openBook} session={session} onBack={() => navigate(session.role === "reader" ? "reader-dashboard" : session.role)} />
      )}

      {view === "uploader" && session?.role === "uploader" && (
        <UploaderPanel books={books} onAddBook={handleAddBook} onEditBook={handleEditBook} onDeleteBook={handleDeleteBook} dbStatus={dbStatus} onNavigate={navigate} />
      )}

      {view === "admin" && session?.role === "admin" && (
        <AdminPanel
          books={books} licenses={licenses} uploaders={uploaders} trialRequests={trialRequests} readers={readers} subscribers={subscribers} emailTemplates={emailTemplates}
          featuredAuthors={featuredAuthors}
          onCreateLicense={handleCreateLicense} onRevokeLicense={handleRevokeLicense} onToggleLicenseStatus={handleToggleLicenseStatus}
          onEditInstitutionAccess={handleEditInstitutionAccess}
          onAddUploader={handleAddUploader} onRemoveUploader={handleRemoveUploader}
          onApproveTrial={handleApproveTrial} onRejectTrial={handleRejectTrial} onEditTrialAccess={handleEditTrialAccess}
          onResendTrialEmail={handleResendTrialEmail} onResendInstitutionEmail={handleResendInstitutionEmail}
          onUpdateEmailTemplate={handleUpdateEmailTemplate}
          onAddFeaturedAuthor={handleAddFeaturedAuthor} onRemoveFeaturedAuthor={handleRemoveFeaturedAuthor}
          onAddBook={handleAddBook} onEditBook={handleEditBook} onDeleteBook={handleDeleteBook} dbStatus={dbStatus}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
