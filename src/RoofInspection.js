import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  black:     "#0a0a0a",
  charcoal:  "#111111",
  graphite:  "#1a1a1a",
  steel:     "#222222",
  border:    "#2a2a2a",
  mist:      "#666",
  silver:    "#999",
  white:     "#f0ede8",
  gold:      "#c9a84c",
  goldLight: "#e8c97a",
};

export default function RoofInspection() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    // Honeypot: bot filled the hidden field — silently succeed
    if (form.company) { setSuccess(true); return; }

    // Validate name
    if (!form.name.trim()) { setError("Please enter your full name."); return; }

    // Validate phone/email — need at least one
    const digits = form.phone.replace(/\D/g, "");
    const hasPhone = form.phone.trim().length > 0;
    const hasEmail = form.email.trim().length > 0;
    if (!hasPhone && !hasEmail) {
      setError("Please enter a phone number or email so we can reach you.");
      return;
    }
    if (hasPhone && digits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("leads").insert([{
      source:   "meta",
      stage:    "new",
      division: "Retail",
      name:     form.name.trim(),
      phone:    digits || null,
      email:    form.email.trim() || null,
      address:  form.address.trim() || null,
      notes:    "Captured from Meta landing page (/lp/roof-inspection) on " + new Date().toISOString(),
    }]);

    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong. Please try again or call us directly.");
    } else {
      setSuccess(true);
    }
  };

  const s = {
    page: {
      background: COLORS.black,
      color: COLORS.white,
      fontFamily: "'Barlow', 'Helvetica Neue', sans-serif",
      fontWeight: 300,
    },

    // ── HERO ────────────────────────────────────────────────
    hero: {
      minHeight: "100vh",
      background: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)),
                   url('/images/roof-finished.jpg') center/cover no-repeat`,
      display: "flex",
      flexDirection: "column",
      padding: mobile ? "0 20px" : "0 48px",
    },
    topbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: mobile ? "20px 0" : "28px 0",
      borderBottom: "1px solid rgba(42,42,42,0.6)",
    },
    logoNum: {
      fontFamily: "'Georgia', serif",
      fontSize: mobile ? 24 : 30,
      fontWeight: 700,
      color: COLORS.gold,
      letterSpacing: -1,
    },
    logoTxt: {
      fontSize: mobile ? 11 : 13,
      fontWeight: 600,
      letterSpacing: 4,
      color: COLORS.white,
      textTransform: "uppercase",
      paddingLeft: 7,
    },
    serviceArea: {
      fontSize: mobile ? 10 : 12,
      color: COLORS.silver,
      letterSpacing: 2,
    },
    heroBody: {
      flex: 1,
      display: "flex",
      flexDirection: mobile ? "column" : "row",
      alignItems: mobile ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: mobile ? 36 : 64,
      paddingTop: mobile ? 40 : 88,
      paddingBottom: mobile ? 48 : 88,
    },
    heroLeft: {
      flex: 1,
      maxWidth: mobile ? "100%" : 560,
    },
    pill: {
      display: "inline-block",
      background: COLORS.gold,
      color: COLORS.black,
      fontSize: mobile ? 11 : 12,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      padding: "6px 18px",
      borderRadius: 100,
      marginBottom: 24,
    },
    headline: {
      fontFamily: "'Georgia', serif",
      fontSize: "clamp(40px, 7vw, 68px)",
      fontWeight: 700,
      color: COLORS.white,
      lineHeight: 1.1,
      margin: "0 0 24px",
    },
    subhead: {
      fontSize: "clamp(19px, 2.6vw, 24px)",
      color: "#b0aba4",
      lineHeight: 1.7,
      margin: "0 0 36px",
      fontWeight: 300,
    },
    bullets: { display: "flex", flexDirection: "column", gap: 16 },
    bullet: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: mobile ? 17 : 19,
      color: COLORS.white,
      lineHeight: 1.5,
    },
    checkmark: {
      color: COLORS.gold,
      fontSize: 20,
      fontWeight: 700,
      flexShrink: 0,
      lineHeight: 1,
    },

    // ── FORM CARD ────────────────────────────────────────────
    formCard: {
      background: COLORS.charcoal,
      border: `1px solid ${COLORS.gold}`,
      borderRadius: 4,
      padding: mobile ? "28px 22px" : "36px 32px",
      width: mobile ? "100%" : 400,
      flexShrink: 0,
      boxSizing: "border-box",
    },
    formHeading: {
      fontSize: 22,
      fontWeight: 600,
      color: COLORS.white,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    formSub: { fontSize: 15, color: COLORS.silver, marginBottom: 24 },
    formGroup: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
    formLabel: {
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: COLORS.mist,
    },
    formInput: {
      background: COLORS.graphite,
      border: `1px solid ${COLORS.border}`,
      color: COLORS.white,
      padding: "14px 14px",
      fontSize: 16,
      fontFamily: "'Barlow', sans-serif",
      outline: "none",
      borderRadius: 2,
      width: "100%",
      boxSizing: "border-box",
    },
    submitBtn: {
      width: "100%",
      background: COLORS.gold,
      color: COLORS.black,
      border: "none",
      padding: "18px",
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      cursor: "pointer",
      borderRadius: 2,
      marginTop: 8,
    },
    errorMsg: {
      fontSize: 14,
      color: "#e05252",
      marginTop: 12,
      textAlign: "center",
      lineHeight: 1.5,
    },
    successBox: { textAlign: "center", padding: "16px 0" },
    successCheck: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: `${COLORS.gold}22`,
      border: `1px solid ${COLORS.gold}`,
      fontSize: 22,
      color: COLORS.gold,
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: 600,
      color: COLORS.white,
      marginBottom: 10,
    },
    successText: {
      fontSize: 16,
      color: COLORS.silver,
      lineHeight: 1.7,
    },

    // ── SIGNS SECTION ──────────────────────────────────────
    signsSection: {
      background: COLORS.charcoal,
      borderTop: `1px solid ${COLORS.border}`,
      padding: mobile ? "64px 20px" : "88px 48px",
    },
    signsHeading: {
      fontFamily: "'Georgia', serif",
      fontSize: mobile ? 30 : 42,
      fontWeight: 700,
      color: COLORS.white,
      textAlign: "center",
      lineHeight: 1.2,
      margin: "0 auto 44px",
      maxWidth: 700,
    },
    signsList: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
      maxWidth: 640,
      margin: "0 auto 40px",
    },
    signsItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      fontSize: mobile ? 18 : 20,
      color: COLORS.white,
      lineHeight: 1.5,
    },
    signsCheck: {
      color: COLORS.gold,
      fontSize: 22,
      fontWeight: 700,
      flexShrink: 0,
      lineHeight: 1.4,
    },
    signsFooter: {
      fontSize: mobile ? 17 : 19,
      color: COLORS.silver,
      lineHeight: 1.7,
      textAlign: "center",
      maxWidth: 640,
      margin: "0 auto 36px",
    },
    signsBtn: {
      display: "block",
      background: COLORS.gold,
      color: COLORS.black,
      border: "none",
      padding: "18px 48px",
      fontSize: mobile ? 16 : 19,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      cursor: "pointer",
      borderRadius: 2,
      textDecoration: "none",
      textAlign: "center",
      maxWidth: 420,
      margin: "0 auto",
    },

    // ── DIFFERENTIATION ──────────────────────────────────────
    diffSection: {
      background: COLORS.black,
      padding: mobile ? "64px 20px" : "88px 48px",
    },
    diffHeading: {
      fontFamily: "'Georgia', serif",
      fontSize: mobile ? 30 : 42,
      fontWeight: 700,
      color: COLORS.white,
      textAlign: "center",
      lineHeight: 1.2,
      margin: "0 auto 52px",
      maxWidth: 700,
    },
    diffGrid: {
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
      gap: 20,
      maxWidth: 960,
      margin: "0 auto",
    },
    diffCard: {
      background: COLORS.charcoal,
      border: `1px solid ${COLORS.border}`,
      borderTop: `2px solid ${COLORS.gold}`,
      borderRadius: 4,
      overflow: "hidden",
    },
    diffImg: {
      width: "100%",
      height: 220,
      objectFit: "cover",
      display: "block",
    },
    diffCardBody: { padding: "24px 26px 28px" },
    diffCardTitle: {
      fontSize: mobile ? 18 : 20,
      fontWeight: 600,
      color: COLORS.white,
      marginBottom: 10,
    },
    diffCardText: {
      fontSize: mobile ? 17 : 18,
      color: COLORS.silver,
      lineHeight: 1.75,
    },

    // ── STORM DAMAGE ────────────────────────────────────────
    stormSection: {
      background: COLORS.graphite,
      borderTop: `1px solid ${COLORS.border}`,
      padding: mobile ? "64px 20px" : "88px 48px",
      textAlign: "center",
    },
    stormHeading: {
      fontFamily: "'Georgia', serif",
      fontSize: mobile ? 28 : 38,
      fontWeight: 700,
      color: COLORS.white,
      lineHeight: 1.2,
      margin: "0 auto 20px",
      maxWidth: 640,
    },
    stormText: {
      fontSize: mobile ? 17 : 19,
      color: COLORS.silver,
      lineHeight: 1.75,
      maxWidth: 640,
      margin: "0 auto 36px",
    },
    stormBtn: {
      display: "inline-block",
      background: COLORS.gold,
      color: COLORS.black,
      border: "none",
      padding: "18px 48px",
      fontSize: mobile ? 16 : 19,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      cursor: "pointer",
      borderRadius: 2,
      textDecoration: "none",
    },

    // ── FINAL CTA ────────────────────────────────────────────
    ctaSection: {
      background: COLORS.charcoal,
      borderTop: `1px solid ${COLORS.border}`,
      padding: mobile ? "64px 20px" : "88px 48px",
      textAlign: "center",
    },
    ctaHeading: {
      fontFamily: "'Georgia', serif",
      fontSize: mobile ? 30 : 42,
      fontWeight: 700,
      color: COLORS.white,
      margin: "0 0 16px",
      lineHeight: 1.2,
    },
    ctaSub: {
      fontSize: mobile ? 17 : 19,
      color: COLORS.silver,
      lineHeight: 1.7,
      margin: "0 auto 36px",
      maxWidth: 560,
    },
    ctaBtn: {
      display: "inline-block",
      background: COLORS.gold,
      color: COLORS.black,
      border: "none",
      padding: "18px 48px",
      fontSize: mobile ? 16 : 19,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      cursor: "pointer",
      borderRadius: 2,
      textDecoration: "none",
    },

    // ── FOOTER ───────────────────────────────────────────────
    footer: {
      background: COLORS.black,
      borderTop: `1px solid ${COLORS.border}`,
      padding: "24px 48px",
      textAlign: "center",
      fontSize: 13,
      color: COLORS.mist,
      letterSpacing: 1,
    },
  };

  const signs = [
    "Your roof is 15\u201320+ years old",
    "Missing, curling, or cracked shingles",
    "Granules collecting in your gutters",
    "Daylight or water stains in your attic",
    "Leaks or ceiling stains inside the home",
  ];

  return (
    <div style={s.page}>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.topbar}>
          <div>
            <span style={s.logoNum}>42</span>
            <span style={s.logoTxt}>Exteriors</span>
          </div>
          <div style={s.serviceArea}>NJ · DE · PA · MD</div>
        </div>

        <div style={s.heroBody}>
          {/* Left: copy */}
          <div style={s.heroLeft}>
            <div style={s.pill}>Roof Over 15 Years Old?</div>
            <h1 style={s.headline}>
              Find out how many years your roof has left.
            </h1>
            <p style={s.subhead}>
              A free, no-obligation honest inspection from a contractor who
              builds roofs to last — not the cheapest bid.
            </p>
            <div style={s.bullets}>
              {[
                "Free & no pressure",
                "Honest age report",
                "Premium GAF materials & skilled crews",
              ].map((b) => (
                <div key={b} style={s.bullet}>
                  <span style={s.checkmark}>&#10003;</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form card */}
          <div style={s.formCard} id="form">
            {success ? (
              <div style={s.successBox}>
                <div style={s.successCheck}>&#10003;</div>
                <div style={s.successTitle}>Request received.</div>
                <div style={s.successText}>
                  Our team will reach out within one business day to schedule
                  your free inspection. We look forward to taking care of
                  your home.
                </div>
              </div>
            ) : (
              <>
                <div style={s.formHeading}>Get your free inspection</div>
                <div style={s.formSub}>Takes 30 seconds. No obligation.</div>

                {/* Honeypot — hidden from real users, catches bots */}
                <input
                  name="company"
                  value={form.company}
                  onChange={set("company")}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                  }}
                />

                <div style={s.formGroup}>
                  <label style={s.formLabel}>Full Name *</label>
                  <input
                    style={s.formInput}
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Jane Smith"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Phone</label>
                  <input
                    style={s.formInput}
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="(609) 555-0100"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Property Address</label>
                  <input
                    style={s.formInput}
                    type="text"
                    value={form.address}
                    onChange={set("address")}
                    placeholder="123 Oak Ave, Cherry Hill, NJ"
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>Email (optional)</label>
                  <input
                    style={s.formInput}
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="jane@example.com"
                  />
                </div>

                <button
                  style={s.submitBtn}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting\u2026" : "Book My Free Inspection \u2192"}
                </button>

                {error && <div style={s.errorMsg}>{error}</div>}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── SIGNS IT MAY BE TIME ── */}
      <section style={s.signsSection}>
        <h2 style={s.signsHeading}>Signs it may be time for a new roof</h2>
        <div style={s.signsList}>
          {signs.map((item) => (
            <div key={item} style={s.signsItem}>
              <span style={s.signsCheck}>&#10003;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p style={s.signsFooter}>
          Notice any of these? A free inspection tells you exactly where your
          roof stands — no pressure, no obligation.
        </p>
        <a href="#form" style={s.signsBtn}>
          Book My Free Inspection &rarr;
        </a>
      </section>

      {/* ── DIFFERENTIATION ── */}
      <section style={s.diffSection}>
        <h2 style={s.diffHeading}>
          We don't chase volume. We build roofs that last.
        </h2>
        <div style={s.diffGrid}>
          <div style={s.diffCard}>
            <img
              src="/images/site-protection.jpg"
              alt="Crew protecting property before roof removal"
              style={s.diffImg}
            />
            <div style={s.diffCardBody}>
              <div style={s.diffCardTitle}>We protect your property first</div>
              <div style={s.diffCardText}>
                Tarps shield your siding, landscaping, and yard before a single
                shingle comes off. Most roofers leave a mess — we treat your
                home the way we'd treat our own.
              </div>
            </div>
          </div>
          <div style={s.diffCard}>
            <img
              src="/images/gaf-materials.jpg"
              alt="GAF Timberline HD roofing materials"
              style={s.diffImg}
            />
            <div style={s.diffCardBody}>
              <div style={s.diffCardTitle}>Premium GAF materials</div>
              <div style={s.diffCardText}>
                GAF Timberline HD shingles, quality underlayment, and skilled
                crews — built to last 20+ years. We don't cut corners on the
                materials that protect everything underneath.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STORM DAMAGE ── */}
      <section style={s.stormSection}>
        <h2 style={s.stormHeading}>
          Think a recent storm may have caused damage?
        </h2>
        <p style={s.stormText}>
          Let's identify it. Book a free inspection and we'll show you exactly
          what we find and how severe it is. As your contractor, we restore your
          property based on what your insurance approves.
        </p>
        <a href="#form" style={s.stormBtn}>
          Book My Free Inspection &rarr;
        </a>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaHeading}>
          Not sure how much life your roof has left?
        </h2>
        <p style={s.ctaSub}>
          Get an honest answer from a contractor who'll tell you the truth —
          even if it means you don't need a new roof yet.
        </p>
        <a href="#form" style={s.ctaBtn}>
          Book My Free Inspection &rarr;
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        42 Exteriors &middot; Roofing &amp; Exterior Contracting &middot; NJ &middot; DE &middot; PA &middot; MD
      </footer>

    </div>
  );
}
