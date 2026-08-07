import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

// ── Design tokens
const T = {
  gold: "#C9A84C", darkGold: "#8B7536", softGold: "#E8D6A7",
  cream: "#FAF7F2", lightCream: "#F5EFE6", white: "#FFFFFF",
  dark: "#1A1A1A", mid: "#4A4A4A", light: "#888888",
  border: "#E8DDD0", shadow: "0 1px 4px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08)", shadowLg: "0 8px 32px rgba(0,0,0,0.10)",
  radius: "4px", radiusMd: "8px",
  serif: "'Georgia', serif", sans: "'Arial', sans-serif",
};

// ── Responsive hook
function useResponsive() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 768, isTablet: w < 1024, w };
}

const practiceAreas = [
  { icon: "⚖️", title: "Corporate Law", desc: "Expert counsel on corporate governance, mergers, acquisitions, and business formations." },
  { icon: "🏛️", title: "Commercial Litigation", desc: "Aggressive and strategic representation in complex commercial disputes at all court levels." },
  { icon: "🔒", title: "Criminal Law", desc: "Vigorous defense and prosecution in criminal matters before all Nigerian courts." },
  { icon: "🏠", title: "Property Law", desc: "Comprehensive real estate transactions, land disputes, and property rights advisory." },
  { icon: "👨‍👩‍👧", title: "Family Law", desc: "Sensitive handling of matrimonial, custody, and family estate matters." },
  { icon: "💼", title: "Labour Law", desc: "Employment rights, industrial relations, and workplace dispute resolution." },
  { icon: "📊", title: "Tax Law", desc: "Strategic tax planning, compliance, and dispute resolution with Nigerian authorities." },
  { icon: "📜", title: "Constitutional Law", desc: "Fundamental rights litigation and constitutional interpretation before the Supreme Court." },
  { icon: "🤝", title: "Arbitration & ADR", desc: "Neutral, binding, and confidential alternative dispute resolution for commercial matters." },
  { icon: "💡", title: "Intellectual Property", desc: "Protection of patents, trademarks, copyrights, and trade secrets across Nigeria." },
  { icon: "⛽", title: "Energy & Oil and Gas", desc: "Specialized counsel for Nigeria's energy sector — upstream, midstream, and downstream." },
  { icon: "🌍", title: "International Law", desc: "Cross-border transactions, treaties, and international commercial dispute advisory." },
];

const lawyers = [
  { name: "D.D. Onietan", title: "SAN", position: "Principal Partner", area: "Constitutional & Corporate Law", exp: "30+", initials: "DO" },
  { name: "Adaeze Okonkwo", title: "Esq.", position: "Senior Partner", area: "Commercial Litigation", exp: "18", initials: "AO" },
  { name: "Emeka Nwosu", title: "Esq.", position: "Managing Partner", area: "Oil & Gas Law", exp: "15", initials: "EN" },
  { name: "Fatima Al-Hassan", title: "Esq.", position: "Partner", area: "Family & Labour Law", exp: "12", initials: "FA" },
  { name: "Chukwuemeka Eze", title: "Esq.", position: "Associate Partner", area: "Property & Tax Law", exp: "10", initials: "CE" },
  { name: "Ngozi Obi", title: "Esq.", position: "Senior Associate", area: "Intellectual Property", exp: "8", initials: "NO" },
];

const testimonials = [
  { name: "Chief Emmanuel Adesanya", pos: "CEO, Adesanya Group of Companies", text: "D.D. Onietan & Co. handled our complex corporate restructuring with unmatched professionalism. Their expertise is simply second to none in Nigeria." },
  { name: "Dr. Amina Bello", pos: "Director General, Federal Agency", text: "The firm's constitutional law expertise was instrumental in our landmark case. Their knowledge, dedication, and client care are truly exceptional." },
  { name: "Alhaji Musa Ibrahim", pos: "Chairman, Ibrahim Holdings Ltd.", text: "I have trusted this firm with my most sensitive legal matters for over a decade. Their integrity and results consistently exceed all expectations." },
];

const publications = [
  { title: "Constitutional Dimensions of Electoral Law in Nigeria 2024", author: "D.D. Onietan SAN", date: "Dec 2024", cat: "Constitutional Law", read: "12 min" },
  { title: "Oil & Gas Contracts: Navigating International Arbitration", author: "Emeka Nwosu Esq.", date: "Nov 2024", cat: "Energy Law", read: "9 min" },
  { title: "Corporate Governance Best Practices Under Nigerian Law", author: "Adaeze Okonkwo Esq.", date: "Oct 2024", cat: "Corporate Law", read: "8 min" },
  { title: "The Future of ADR in Commercial Disputes — A Nigerian Perspective", author: "D.D. Onietan SAN", date: "Sep 2024", cat: "ADR", read: "11 min" },
];

// ── Reusable components
const Divider = ({ center = false }) => (
  <div style={{ width: 60, height: 2, background: `linear-gradient(90deg,${T.gold},${T.darkGold})`, borderRadius: 1, margin: center ? "12px auto 0" : "12px 0 0" }} />
);

const SectionLabel = ({ children, light = false }) => (
  <p style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: light ? T.gold : T.gold, letterSpacing: 4, textTransform: "uppercase", margin: "0 0 8px" }}>{children}</p>
);

const Badge = ({ children, style = {} }) => (
  <span style={{ display: "inline-block", background: `${T.gold}18`, color: T.darkGold, padding: "4px 14px", borderRadius: 20, fontSize: 11, fontFamily: T.sans, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", ...style }}>{children}</span>
);

const GoldBtn = ({ children, onClick, style = {}, outline = false, type = "button" }: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  outline?: boolean;
  type?: "button" | "submit" | "reset";
}) => (
  <button type={type} onClick={onClick} style={{
    background: outline ? "transparent" : `linear-gradient(135deg,${T.gold},${T.darkGold})`,
    color: outline ? T.gold : "#fff",
    border: outline ? `2px solid ${T.gold}` : "none",
    padding: "12px 28px", borderRadius: T.radius, fontSize: 13, fontWeight: 700,
    cursor: "pointer", letterSpacing: 1.5, fontFamily: T.sans, textTransform: "uppercase",
    transition: "all 0.25s", boxShadow: outline ? "none" : `0 4px 12px ${T.gold}44`,
    ...style,
  }}>{children}</button>
);
// ── Official Firm Logo — served from /public/images/logo.png
// Size controls height; width auto-scales to maintain aspect ratio.
// objectFit: contain ensures the full logo (scales + text) is always visible.
// The logo has a black background so it looks premium on both light and dark sections.
const Logo = ({ size = 52 }: { size?: number }) => (
  <div style={{
    height: size,
    width: size * 1.0,          // logo is square so 1:1 ratio
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 4,
  }}>
    <img
      src="/images/logo.png"
      alt="D.D. Onietan (SAN) & Co. — Barristers & Solicitors"
      style={{
        height: "100%",
        width: "100%",
        objectFit: "contain",
        display: "block",
      }}
      onError={(e) => {
        // Fallback to text mark if image fails to load
        const el = e.currentTarget;
        el.style.display = "none";
        const fallback = el.parentElement;
        if (fallback) {
          fallback.style.background = "#1A1A1A";
          fallback.style.border = "2px solid #C9A84C";
          fallback.style.borderRadius = "50%";
          fallback.innerHTML = `<span style="color:#C9A84C;font-family:Georgia,serif;font-weight:bold;font-size:${size*0.27}px">DDO</span>`;
        }
      }}
    />
  </div>
);

export default function App() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [consultForm, setConsultForm] = useState({ name: "", email: "", phone: "", service: "", date: "", time: "", message: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [newsletter, setNewsletter] = useState({ name: "", email: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", s);
    const t = setInterval(() => setTestimonialIdx(p => (p + 1) % testimonials.length), 5500);
    return () => { window.removeEventListener("scroll", s); clearInterval(t); };
  }, []);

  useEffect(() => { if (menuOpen) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 4000); }, []);
  const scrollTo = useCallback((id) => {
    setActiveNav(id === "home" ? "Home" : id); setMenuOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 10);
  }, []);

  const navItems = [
    { label: "Home", id: "home" }, { label: "About", id: "about" },
    { label: "Practice Areas", id: "practice" }, { label: "Lawyers", id: "lawyers" },
    { label: "Publications", id: "publications" }, { label: "Consultation", id: "consult" },
    { label: "Contact", id: "contact" },
  ];

  // ── Main website
  const inp: React.CSSProperties = { background: T.cream, border: `1px solid ${T.border}`, borderRadius: T.radius, color: T.dark, padding: "11px 14px", fontSize: 14, fontFamily: T.sans, outline: "none", width: "100%", boxSizing: "border-box" };  const fgrp = { display: "flex", flexDirection: "column", gap: 6 };
  const flabel = { fontSize: 11, fontWeight: 700, color: T.mid, letterSpacing: 1.2, textTransform: "uppercase" };

  return (
    <div style={{ fontFamily: T.serif, background: T.cream, color: T.dark, minHeight: "100vh" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: isMobile ? 10 : 24, left: isMobile ? 10 : "auto", background: T.dark, color: "#fff", padding: "12px 18px", borderRadius: T.radiusMd, fontSize: 13, fontFamily: T.sans, zIndex: 9999, borderLeft: `4px solid ${T.gold}`, boxShadow: T.shadowLg }}>✓ {toast}</div>
      )}

      {/* ── NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`, boxShadow: scrolled ? T.shadow : "none", transition: "all 0.3s" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 1rem" : "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: isMobile ? 64 : 76 }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => scrollTo("home")}>
            <Logo size={isMobile ? 40 : 52} />
            {!isMobile && (
              <div>
                <div style={{ fontFamily: T.serif, fontSize: 13, fontWeight: "bold", color: T.dark, letterSpacing: 0.3 }}>D.D. Onietan (S.A.N) &amp; Co.</div>
                <div style={{ fontFamily: T.sans, fontSize: 9, color: T.gold, letterSpacing: 3, textTransform: "uppercase" }}>Barristers &amp; Solicitors</div>
              </div>
            )}
          </div>

          {/* Desktop nav */}
          {!isTablet && (
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {navItems.map(n => (
                <button key={n.id} onClick={() => { setActiveNav(n.label); scrollTo(n.id); }}
                  style={{ padding: "6px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 13, color: activeNav === n.label ? T.gold : T.mid, borderBottom: `2px solid ${activeNav === n.label ? T.gold : "transparent"}`, transition: "all 0.2s" }}>
                  {n.label}
                </button>
              ))}
              <div style={{ width: 1, height: 18, background: T.border, margin: "0 6px" }} />
              <button onClick={() => router.push("/login")} style={{ padding: "6px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, color: T.gold, fontWeight: 600 }}>Client Login</button>
              <button onClick={() => router.push("/login")} style={{ padding: "6px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, color: T.gold, fontWeight: 600 }}>Lawyer Login</button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isMobile && <GoldBtn onClick={() => scrollTo("consult")} style={{ fontSize: 12, padding: "9px 18px" }}>Schedule Consultation</GoldBtn>}
            {isTablet && (
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "8px 10px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 20, height: 2, background: menuOpen ? T.gold : T.dark, transition: "all 0.2s", transform: menuOpen ? (i===0?"rotate(45deg) translate(4px,4px)":i===2?"rotate(-45deg) translate(4px,-4px)":"scaleX(0)") : "none" }} />)}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isTablet && menuOpen && (
          <div style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: "1rem", boxShadow: T.shadowMd }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => { setActiveNav(n.label); scrollTo(n.id); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 15, color: activeNav === n.label ? T.gold : T.mid, borderLeft: `3px solid ${activeNav === n.label ? T.gold : "transparent"}`, marginBottom: 2 }}>
                {n.label}
              </button>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <button onClick={() => { router.push("/login"); setMenuOpen(false); }} style={{ padding: "10px", border: `1px solid ${T.gold}`, borderRadius: T.radius, background: "transparent", color: T.gold, fontFamily: T.sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Client Login</button>
              <button onClick={() => { router.push("/login"); setMenuOpen(false); }} style={{ padding: "10px", border: `1px solid ${T.gold}`, borderRadius: T.radius, background: "transparent", color: T.gold, fontFamily: T.sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Lawyer Login</button>
            </div>
            <GoldBtn onClick={() => scrollTo("consult")} style={{ width: "100%", marginTop: 10 }}>Schedule Consultation</GoldBtn>
          </div>
        )}
      </nav>

      {/* ── HERO */}
      <section id="home" style={{ minHeight: "100vh", paddingTop: isMobile ? 64 : 76, background: "linear-gradient(160deg,#111 0%,#1a1209 50%,#111 100%)", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "15%", right: "-8%", width: isMobile ? 250 : 500, height: isMobile ? 250 : 500, borderRadius: "50%", background: `radial-gradient(circle,${T.gold}10 0%,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "3rem 1.25rem" : "5rem 2rem", width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "2.5rem" : "5rem", alignItems: "center" }}>
            <div style={{ textAlign: isMobile ? "center" : "left" }}>
              <div style={{ display: "inline-block", background: `${T.gold}22`, border: `1px solid ${T.gold}44`, color: T.gold, padding: "5px 14px", borderRadius: 20, fontSize: 11, fontFamily: T.sans, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20 }}>Senior Advocate of Nigeria</div>
              <h1 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(2rem,8vw,2.8rem)" : "clamp(2.4rem,4vw,3.8rem)", color: "#ffffff", lineHeight: 1.18, margin: "0 0 16px", fontWeight: "normal" }}>
                D.D. Onietan<br /><span style={{ color: T.gold, fontStyle: "italic" }}>(S.A.N)</span> & Co.
              </h1>
              <div style={{ width: 60, height: 2, background: `linear-gradient(90deg,${T.gold},${T.darkGold})`, borderRadius: 1, margin: isMobile ? "0 auto 20px" : "0 0 20px" }} />
              <p style={{ color: "#C8B99A", fontSize: isMobile ? 16 : 18, fontFamily: T.serif, fontStyle: "italic", marginBottom: 14, lineHeight: 1.6 }}>"Committed to Excellence, Integrity and Justice."</p>
              <p style={{ color: "#777", fontSize: isMobile ? 14 : 15, fontFamily: T.sans, lineHeight: 1.75, marginBottom: 32, maxWidth: 480, margin: isMobile ? "0 auto 32px" : "0 0 32px" }}>
                Nigeria's foremost chambers of legal excellence. Three decades of landmark judgments, corporate counsel, and unwavering advocacy at the highest courts.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                <GoldBtn onClick={() => scrollTo("consult")} style={{ fontSize: isMobile ? 13 : 14 }}>Book Consultation</GoldBtn>
                <button onClick={() => scrollTo("lawyers")} style={{ background: "transparent", color: "#C8B99A", padding: "12px 28px", border: "1px solid #444", borderRadius: T.radius, fontSize: isMobile ? 13 : 14, cursor: "pointer", fontFamily: T.sans, letterSpacing: 1.5, textTransform: "uppercase" }}>Meet Our Lawyers</button>
              </div>
            </div>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ v: "40+", l: "Years of Excellence" }, { v: "2,500+", l: "Cases Resolved" }, { v: "3", l: "Expert Lawyers" }, { v: "98%", l: "Client Satisfaction" }].map((s, i) => (
                <div key={s.l} style={{ background: i % 2 === 0 ? "#111" : `${T.gold}18`, border: `1px solid ${i % 2 === 0 ? "#222" : T.gold + "44"}`, borderRadius: T.radiusMd, padding: isMobile ? "1.25rem" : "2rem 1.5rem", textAlign: "center" }}>
                  <div style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.6rem,6vw,2.4rem)" : "clamp(2rem,3vw,2.8rem)", color: T.gold, fontWeight: "bold" }}>{s.v}</div>
                  <div style={{ color: "#777", fontSize: isMobile ? 11 : 12, fontFamily: T.sans, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT */}
      <section id="about" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "2rem" : "4.5rem", alignItems: "start" }}>
            <div>
              <SectionLabel>About Our Firm</SectionLabel>
              <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.6rem,3vw,2.4rem)", margin: "0 0 10px" }}>A Legacy of <span style={{ color: T.gold }}>Legal Excellence</span> in Nigeria</h2>
              <Divider />
              <p style={{ color: T.mid, fontSize: 15, lineHeight: 1.8, marginTop: 20, marginBottom: 16, fontFamily: T.sans }}>Founded by D.D. Onietan (SAN), our chambers has been a beacon of legal excellence for over three decades — consistently delivering landmark judgments that have shaped Nigerian jurisprudence.</p>
              <p style={{ color: T.mid, fontSize: 15, lineHeight: 1.8, marginBottom: 24, fontFamily: T.sans }}>We bring together Nigeria's finest legal minds, united by an unwavering commitment to the rule of law, ethical practice, and results-driven advocacy.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ h: "Our Vision", t: "To be the foremost chambers of legal excellence in West Africa, setting the standard for ethical and impactful practice." }, { h: "Our Mission", t: "To deliver superior legal counsel with integrity, expertise, and commitment to every client's best interests." }, { h: "Core Values", t: "Excellence · Integrity · Confidentiality · Innovation · Client-Centred Service" }, { h: "Memberships", t: "NBA · SPIDEL · IBA · ACIArb · Commonwealth Lawyers Association" }].map(v => (
                  <div key={v.h} style={{ background: T.white, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: T.radius, padding: "14px 16px", boxShadow: T.shadow }}>
                    <div style={{ color: T.darkGold, fontFamily: T.serif, fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>{v.h}</div>
                    <div style={{ color: T.light, fontSize: 12, fontFamily: T.sans, lineHeight: 1.6 }}>{v.t}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Principal card */}
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderTop: `4px solid ${T.gold}`, borderRadius: T.radiusMd, padding: isMobile ? "1.5rem" : "2.5rem", textAlign: "center", boxShadow: T.shadowMd }}>
              <div style={{ width: 110, height: 110, borderRadius: "50%", background: `linear-gradient(135deg,${T.dark},#333)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36, fontWeight: "bold", color: T.gold, fontFamily: T.serif, border: `3px solid ${T.gold}33`, boxShadow: T.shadowMd }}>DO</div>
              <Badge style={{ marginBottom: 10 }}>Principal Partner</Badge>
              <h3 style={{ fontFamily: T.serif, fontSize: 22, color: T.dark, margin: "8px 0 4px" }}>D.D. Onietan</h3>
              <div style={{ color: T.gold, fontSize: 15, fontFamily: T.serif, fontStyle: "italic", marginBottom: 14 }}>Senior Advocate of Nigeria (SAN)</div>
              <p style={{ color: T.mid, fontSize: 14, lineHeight: 1.75, fontFamily: T.sans, marginBottom: 18 }}>Called to the Nigerian Bar in 1985. Over 40 years of exceptional practice spanning constitutional law, corporate governance, and commercial litigation at all levels of the Nigerian court system, including the Supreme Court.</p>
              {[["Specializations", "Constitutional Law · Corporate Governance · Commercial Litigation"], ["Court Admissions", "Supreme Court · Court of Appeal · Federal High Court"], ["Memberships", "NBA · SPIDEL · Commonwealth Lawyers Association"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, textAlign: "left", marginBottom: 8 }}>
                  <span style={{ color: T.gold, fontSize: 10, fontFamily: T.sans, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", minWidth: 100, paddingTop: 2 }}>{k}:</span>
                  <span style={{ color: T.mid, fontSize: 12, fontFamily: T.sans }}>{v}</span>
                </div>
              ))}
              <GoldBtn onClick={() => {}} style={{ marginTop: 20, width: "100%" }}>View Full Profile</GoldBtn>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRACTICE AREAS */}
      <section id="practice" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem", background: T.lightCream }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "2rem" : "3.5rem" }}>
            <SectionLabel>Our Expertise</SectionLabel>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.5rem)", margin: "0 0 8px" }}>Practice Areas</h2>
            <Divider center />
            <p style={{ color: T.mid, fontSize: 15, fontFamily: T.sans, maxWidth: 520, margin: "16px auto 0", lineHeight: 1.7 }}>Comprehensive legal services across all major areas of Nigerian and international law.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 16 }}>
            {practiceAreas.map(p => (
              <div key={p.title} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, padding: "1.5rem", transition: "all 0.25s", boxShadow: T.shadow, cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = T.shadowMd; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontFamily: T.serif, fontSize: 16, color: T.dark, marginBottom: 8, fontWeight: "bold" }}>{p.title}</div>
                <div style={{ color: T.light, fontSize: 13, lineHeight: 1.7, fontFamily: T.sans, marginBottom: 12 }}>{p.desc}</div>
                <div style={{ color: T.gold, fontSize: 12, fontFamily: T.sans, fontWeight: 700 }}>Learn More →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US */}
      <section style={{ padding: isMobile ? "4rem 1.25rem" : "5rem 2rem", background: T.white }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "2rem" : "3rem" }}>
            <SectionLabel>Why Choose Us</SectionLabel>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.4rem)", margin: "0 0 8px" }}>The Onietan Advantage</h2>
            <Divider center />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 16 }}>
            {[{ i: "🏆", h: "30+ Years of Excellence", t: "Three decades of landmark victories and trusted counsel for Nigeria's most complex legal matters." }, { i: "⚖️", h: "Supreme Court Experience", t: "Proven track record before all Nigerian courts including the Supreme Court and Court of Appeal." }, { i: "🔐", h: "Absolute Confidentiality", t: "Your matters are handled with the strictest confidentiality and the highest professional ethics." }, { i: "🌍", h: "International Network", t: "Strategic alliances with top legal firms across the UK, USA, UAE, and South Africa." }, { i: "💡", h: "Innovative Legal Strategy", t: "We combine traditional legal wisdom with modern technology for superior outcomes." }, { i: "🤝", h: "Client-First Approach", t: "Personalized attention, regular updates, and unwavering commitment to your interests." }].map(w => (
              <div key={w.h} style={{ display: "flex", gap: 14, padding: "1.25rem", border: `1px solid ${T.border}`, borderRadius: T.radiusMd, background: T.cream, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.white; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.cream; }}>
                <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{w.i}</div>
                <div>
                  <div style={{ fontFamily: T.serif, fontSize: 15, color: T.dark, marginBottom: 6 }}>{w.h}</div>
                  <div style={{ color: T.light, fontSize: 13, fontFamily: T.sans, lineHeight: 1.7 }}>{w.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAWYERS */}
      <section id="lawyers" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem", background: T.lightCream }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "2rem" : "3.5rem" }}>
            <SectionLabel>Our Team</SectionLabel>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.5rem)", margin: "0 0 8px" }}>Meet Our Lawyers</h2>
            <Divider center />
            <p style={{ color: T.mid, fontSize: 15, fontFamily: T.sans, maxWidth: 480, margin: "16px auto 0", lineHeight: 1.7 }}>Accomplished legal professionals dedicated to delivering exceptional results.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(3,1fr)", gap: isMobile ? 12 : 18 }}>
            {lawyers.map(l => (
              <div key={l.name} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, padding: isMobile ? "1.25rem 1rem" : "1.75rem", textAlign: "center", transition: "all 0.25s", boxShadow: T.shadow }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = T.shadowMd; e.currentTarget.style.borderColor = T.gold; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.borderColor = T.border; }}>
                <div style={{ width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: "50%", background: `linear-gradient(135deg,${T.dark},#2d2d2d)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: isMobile ? 18 : 22, fontWeight: "bold", color: T.gold, fontFamily: T.serif, border: `2px solid ${T.gold}33` }}>{l.initials}</div>
                <div style={{ fontFamily: T.serif, fontSize: isMobile ? 14 : 16, color: T.dark, marginBottom: 3 }}>{l.name}</div>
                <div style={{ color: T.gold, fontSize: isMobile ? 11 : 12, fontFamily: T.sans, fontWeight: 700, marginBottom: 3 }}>{l.title} · {isMobile ? l.title : l.position}</div>
                {!isMobile && <div style={{ color: T.light, fontSize: 12, fontFamily: T.sans, marginBottom: 3 }}>{l.area}</div>}
                <div style={{ color: T.light, fontSize: isMobile ? 11 : 12, fontFamily: T.sans, marginBottom: 14 }}>{l.exp} Yrs</div>
                <GoldBtn outline onClick={() => {}} style={{ fontSize: isMobile ? 11 : 12, padding: isMobile ? "7px 14px" : "8px 18px" }}>View Profile</GoldBtn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS */}
      <section style={{ padding: isMobile ? "4rem 1.25rem" : "5rem 2rem", background: T.dark }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <SectionLabel>Client Testimonials</SectionLabel>
          <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.4rem,5vw,1.9rem)" : "clamp(1.8rem,3vw,2.4rem)", color: "#fff", margin: "0 0 8px" }}>What Our Clients Say</h2>
          <Divider center />
          <div style={{ background: "#111", border: `1px solid ${T.gold}33`, borderRadius: T.radiusMd, padding: isMobile ? "2rem 1.25rem" : "3rem 2.5rem", marginTop: "2rem" }}>
            <div style={{ fontSize: isMobile ? 32 : 44, color: T.gold, lineHeight: 1, marginBottom: 14, fontFamily: T.serif }}>"</div>
            <p style={{ fontFamily: T.serif, fontSize: isMobile ? 15 : 18, color: "#E0D5C5", fontStyle: "italic", lineHeight: 1.8, marginBottom: 22 }}>{testimonials[testimonialIdx].text}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 16 }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: T.gold, fontSize: 14 }}>★</span>)}
            </div>
            <div style={{ fontFamily: T.serif, color: "#fff", fontSize: 15, fontWeight: "bold" }}>{testimonials[testimonialIdx].name}</div>
            <div style={{ color: "#888", fontSize: 13, fontFamily: T.sans, marginTop: 3 }}>{testimonials[testimonialIdx].pos}</div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
            {testimonials.map((_, i) => <button key={i} onClick={() => setTestimonialIdx(i)} style={{ width: i === testimonialIdx ? 22 : 8, height: 8, borderRadius: 4, background: i === testimonialIdx ? T.gold : "#333", border: "none", cursor: "pointer", transition: "all 0.3s" }} />)}
          </div>
        </div>
      </section>

      {/* ── PUBLICATIONS */}
      <section id="publications" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: isMobile ? "1.75rem" : "3rem", flexWrap: "wrap", gap: 14 }}>
            <div>
              <SectionLabel>Legal Insights</SectionLabel>
              <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.4rem)", margin: "0 0 8px" }}>Publications & Articles</h2>
              <Divider />
            </div>
            <GoldBtn outline onClick={() => {}}>View All</GoldBtn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 16 }}>
            {publications.map(p => (
              <div key={p.title} style={{ background: T.white, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.gold}`, borderRadius: T.radiusMd, padding: "1.25rem", cursor: "pointer", transition: "all 0.2s", boxShadow: T.shadow }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = T.shadowMd; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadow; }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ background: `${T.gold}18`, color: T.darkGold, padding: "2px 9px", borderRadius: 20, fontSize: 10, fontFamily: T.sans, fontWeight: 700, letterSpacing: 0.5 }}>{p.cat}</span>
                  <span style={{ color: T.light, fontSize: 10, fontFamily: T.sans }}>{p.read}</span>
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.dark, lineHeight: 1.5, marginBottom: 10 }}>{p.title}</div>
                <div style={{ color: T.light, fontSize: 12, fontFamily: T.sans, marginBottom: 12 }}>{p.author} · {p.date}</div>
                <div style={{ color: T.gold, fontSize: 12, fontFamily: T.sans, fontWeight: 700 }}>Read Article →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER */}
      <section style={{ padding: isMobile ? "3rem 1.25rem" : "4rem 2rem", background: `linear-gradient(135deg,${T.dark} 0%,#1a1209 50%,${T.dark} 100%)` }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <SectionLabel>Stay Informed</SectionLabel>
          <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? 22 : 26, color: "#fff", margin: "0 0 10px" }}>Subscribe to Our Newsletter</h2>
          <p style={{ color: "#888", fontSize: 14, fontFamily: T.sans, marginBottom: 24 }}>Receive legal updates, publications, and insights from D.D. Onietan & Co.</p>
          <form onSubmit={e => { e.preventDefault(); showToast("Thank you for subscribing to our newsletter!"); setNewsletter({ name: "", email: "" }); }}
            style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <input style={{ ...inp, background: "#111", border: "1px solid #333", color: "#fff", flex: 1 }} placeholder="Full Name" value={newsletter.name} onChange={e => setNewsletter(p => ({ ...p, name: e.target.value }))} required />
            <input type="email" style={{ ...inp, background: "#111", border: "1px solid #333", color: "#fff", flex: 1 }} placeholder="Email Address" value={newsletter.email} onChange={e => setNewsletter(p => ({ ...p, email: e.target.value }))} required />
            <GoldBtn style={{ flexShrink: 0, width: isMobile ? "100%" : "auto" }}>Subscribe</GoldBtn>
          </form>
        </div>
      </section>

      {/* ── CONSULTATION */}
      <section id="consult" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem", background: T.lightCream }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "1.75rem" : "3rem" }}>
            <SectionLabel>Get Expert Help</SectionLabel>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.4rem)", margin: "0 0 8px" }}>Book a Consultation</h2>
            <Divider center />
            <p style={{ color: T.mid, fontSize: 15, fontFamily: T.sans, maxWidth: 500, margin: "14px auto 0", lineHeight: 1.7 }}>Schedule a confidential consultation with our experienced legal team. All enquiries are handled with the utmost discretion.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); showToast("Your consultation has been booked! We will contact you within 24 hours."); setConsultForm({ name: "", email: "", phone: "", service: "", date: "", time: "", message: "" }); }}
            style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, padding: isMobile ? "1.5rem 1.25rem" : "2.5rem", boxShadow: T.shadowMd }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={fgrp}><label style={flabel}>Full Name *</label><input style={inp} required placeholder="Your full name" value={consultForm.name} onChange={e => setConsultForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div style={fgrp}><label style={flabel}>Email Address *</label><input type="email" style={inp} required placeholder="your@email.com" value={consultForm.email} onChange={e => setConsultForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div style={fgrp}><label style={flabel}>Phone Number *</label><input style={inp} required placeholder="+234 XXX XXXX XXX" value={consultForm.phone} onChange={e => setConsultForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div style={fgrp}>
                <label style={flabel}>Service Needed</label>
                <select style={{ ...inp, cursor: "pointer" }} value={consultForm.service} onChange={e => setConsultForm(p => ({ ...p, service: e.target.value }))}>
                  <option value="">Select a Practice Area</option>
                  {practiceAreas.map(p => <option key={p.title} value={p.title}>{p.title}</option>)}
                </select>
              </div>
              <div style={fgrp}><label style={flabel}>Preferred Date</label><input type="date" style={inp} value={consultForm.date} onChange={e => setConsultForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div style={fgrp}><label style={flabel}>Preferred Time</label><input type="time" style={inp} value={consultForm.time} onChange={e => setConsultForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div style={{ ...fgrp, marginBottom: 24 }}>
              <label style={flabel}>Brief Description of Your Matter</label>
              <textarea style={{ ...inp, minHeight: 120, resize: "vertical" }} placeholder="Please briefly describe your legal matter..." value={consultForm.message} onChange={e => setConsultForm(p => ({ ...p, message: e.target.value }))} />
            </div>
            <div style={{ textAlign: "center" }}>
              <GoldBtn style={{ padding: "14px 40px", fontSize: isMobile ? 13 : 14, width: isMobile ? "100%" : "auto" }}>Submit Consultation Request</GoldBtn>
            </div>
          </form>
        </div>
      </section>

      {/* ── CONTACT */}
      <section id="contact" style={{ padding: isMobile ? "4rem 1.25rem" : "6rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? "1.75rem" : "3rem" }}>
            <SectionLabel>Get in Touch</SectionLabel>
            <h2 style={{ fontFamily: T.serif, fontSize: isMobile ? "clamp(1.5rem,5vw,2rem)" : "clamp(1.8rem,3vw,2.4rem)", margin: "0 0 8px" }}>Contact Us</h2>
            <Divider center />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.6fr", gap: isMobile ? "1.5rem" : "3rem" }}>
            <div>
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, padding: "1.5rem", marginBottom: 14, boxShadow: T.shadow }}>
                <div style={{ fontFamily: T.serif, fontSize: 16, color: T.dark, marginBottom: 18, fontWeight: "bold" }}>Office Information</div>
                {[{ i: "📍", l: "Address", v: "Plot 14B, Adetokunbo Ademola Crescent, Wuse II, Abuja, FCT, Nigeria" }, { i: "📞", l: "Phone", v: "+234 803 XXX XXXX · +234 805 XXX XXXX" }, { i: "✉️", l: "Email", v: "info@ddonietanandco.com" }, { i: "🕐", l: "Hours", v: "Mon–Fri: 8:00 AM – 6:00 PM · Sat: 9:00 AM – 2:00 PM" }].map(c => (
                  <div key={c.l} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{c.i}</div>
                    <div>
                      <div style={{ color: T.gold, fontSize: 10, fontFamily: T.sans, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{c.l}</div>
                      <div style={{ color: T.mid, fontSize: 13, fontFamily: T.sans, lineHeight: 1.5 }}>{c.v}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ height: 180, background: T.lightCream, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, display: "flex", alignItems: "center", justifyContent: "center", color: T.light, fontFamily: T.sans, fontSize: 13 }}>📍 Google Maps — Wuse II, Abuja</div>
            </div>
            <form onSubmit={e => { e.preventDefault(); showToast("Message received! We will respond within 24 hours."); setContactForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
              style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: T.radiusMd, padding: isMobile ? "1.5rem 1.25rem" : "2rem", boxShadow: T.shadow }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={fgrp}><label style={flabel}>Name *</label><input style={inp} required placeholder="Full name" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div style={fgrp}><label style={flabel}>Email *</label><input type="email" style={inp} required placeholder="Email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div style={fgrp}><label style={flabel}>Phone</label><input style={inp} placeholder="Phone number" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div style={fgrp}><label style={flabel}>Subject *</label><input style={inp} required placeholder="Subject" value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))} /></div>
              </div>
              <div style={{ ...fgrp, marginBottom: 20 }}>
                <label style={flabel}>Message *</label>
                <textarea style={{ ...inp, minHeight: 150, resize: "vertical" }} required placeholder="Your message..." value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} />
              </div>
              <GoldBtn style={{ width: "100%", padding: "14px" }}>Send Message</GoldBtn>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER */}
      <footer style={{ background: T.dark, padding: isMobile ? "3rem 1.25rem 1.5rem" : "4rem 2rem 2rem" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "1fr 1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? "1.5rem" : "3rem", marginBottom: "2.5rem" }}>
            <div style={{ gridColumn: isMobile ? "1/-1" : "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Logo size={56} />
                <div>
                  <div style={{ fontFamily: T.serif, color: T.gold, fontSize: 14, fontWeight: "bold", letterSpacing: 0.5 }}>D.D. Onietan (S.A.N) &amp; Co.</div>
                  <div style={{ color: "#888", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", fontFamily: T.sans, marginTop: 3 }}>Barristers &amp; Solicitors</div>
                </div>
              </div>
              <p style={{ color: "#555", fontSize: 13, fontFamily: T.sans, lineHeight: 1.7, marginBottom: 16, maxWidth: 280 }}>Nigeria's premier legal chambers. Delivering excellence in legal counsel and advocacy since 1994.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["f", "in", "ig", "𝕏"].map(s => <div key={s} style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2d2d2d", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.gold, fontSize: 12 }}>{s}</div>)}
              </div>
            </div>
            {[
              { title: "Quick Links", links: [{ l: "Home", id: "home" }, { l: "About Us", id: "about" }, { l: "Practice Areas", id: "practice" }, { l: "Our Lawyers", id: "lawyers" }, { l: "Publications", id: "publications" }] },
              { title: "Practice Areas", links: [{ l: "Corporate Law" }, { l: "Commercial Litigation" }, { l: "Criminal Law" }, { l: "Property Law" }, { l: "Energy Law" }, { l: "Constitutional Law" }] },
              { title: "Client Services", links: [{ l: "Client Portal", action: () => router.push("/login") }, { l: "Lawyer Portal", action: () => router.push("/login") }, { l: "Book Consultation", id: "consult" }, { l: "Privacy Policy" }, { l: "Terms & Conditions" }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontFamily: T.serif, fontSize: 13, color: T.gold, marginBottom: 14, letterSpacing: 0.5 }}>{col.title}</div>
                {col.links.map(link => (
                  <div key={link.l} style={{ color: "#555", fontSize: 13, fontFamily: T.sans, marginBottom: 9, cursor: link.id || link.action ? "pointer" : "default", transition: "color 0.2s" }}
                    onClick={() => { if (link.action) link.action(); else if (link.id) scrollTo(link.id); }}
                    onMouseEnter={e => { if (link.id || link.action) e.target.style.color = T.gold; }}
                    onMouseLeave={e => { e.target.style.color = "#555"; }}>
                    {link.l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ color: "#3d3d3d", fontSize: 12, fontFamily: T.sans }}>© {new Date().getFullYear()} D.D. Onietan (SAN) & Co. All Rights Reserved · Abuja, Nigeria</div>
            <div style={{ color: "#3d3d3d", fontSize: 12, fontFamily: T.sans, fontStyle: "italic" }}>Excellence · Integrity · Justice</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
