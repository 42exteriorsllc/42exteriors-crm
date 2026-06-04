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

const STICKY_HEIGHT_MOBILE = 72;
const STICKY_HEIGHT_DESKTOP = 52;

export default function RoofInspection() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", company: "" });
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

    // Validate phone (required)
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) {
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
      email:    null,
      address:  form.address.trim() || null,
      notes:    "Captured from Meta landing page (/lp/roof-inspection) on " + new Date().toISOString(),
    }]);

    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong. Please try again or call us directly.");
    } else {
      setSuccess(true);
      if (window.fbq) { window.fbq('track', 'Lead'); }
    }
  };

  const scrollToForm = (e) => {
    e.preventDefault();
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── inline form renderer (used in hero) ── */
  const renderForm = () => {
    if (success) {
      return (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: "50%",
            background: `${COLORS.gold}22`, border: `1px solid ${COLORS.gold}`,
            fontSize: 24, color: COLORS.gold, marginBottom: 16,
          }}>&#10003;</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.white, marginBottom: 10 }}>
            Request received.
          </div>
          <div style={{ fontSize: 17, color: COLORS.silver, lineHeight: 1.7 }}>
            Our team will reach out within one business day to schedule your free inspection.
          </div>
        </div>
      );
    }

    const inputStyle = {
      background: COLORS.graphite,
      border: `1px solid ${COLORS.border}`,
      color: COLORS.white,
      padding: "16px 14px",
      fontSize: 18,
      fontFamily: "'Barlow', sans-serif",
      outline: "none",
      borderRadius: 4,
      width: "100%",
      boxSizing: "border-box",
    };

    const labelStyle = {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: COLORS.mist,
      marginBottom: 4,
    };

    return (
      <>
        {/* Honeypot */}
        <input
          name="company"
          value={form.company}
          onChange={set("company")}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
        />

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Full Name *</div>
          <input style={inputStyle} type="text" value={form.name} onChange={set("name")} placeholder="Jane Smith" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Phone *</div>
          <input style={inputStyle} type="tel" value={form.phone} onChange={set("phone")} placeholder="(609) 555-0100" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Property Address</div>
          <input style={inputStyle} type="text" value={form.address} onChange={set("address")} placeholder="123 Oak Ave, Cherry Hill, NJ" />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            background: COLORS.gold,
            color: COLORS.black,
            border: "none",
            padding: "20px",
            fontSize: mobile ? 15 : 16,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: 4,
            marginTop: 4,
          }}
        >
          {submitting ? "Submitting\u2026" : "Find My Savings"}
        </button>

        {error && (
          <div style={{ fontSize: 15, color: "#e05252", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </>
    );
  };

  const signs = [
    "Your roof is 15\u201320+ years old",
    "Missing, curling, or cracked shingles",
    "Granules collecting in your gutters",
    "Daylight or water stains in your attic",
    "Leaks or ceiling stains inside the home",
  ];

  const stickyH = mobile ? STICKY_HEIGHT_MOBILE : STICKY_HEIGHT_DESKTOP;

  return (
    <div style={{
      background: COLORS.black,
      color: COLORS.white,
      fontFamily: "'Barlow', 'Helvetica Neue', sans-serif",
      fontWeight: 300,
    }}>

      {/* ── STICKY OFFER BAR ── */}
      <div
        onClick={scrollToForm}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: COLORS.gold,
          color: COLORS.black,
          textAlign: "center",
          padding: mobile ? "14px 16px" : "12px 24px",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(201,168,76,0.35)",
        }}
      >
        <div style={{
          fontSize: mobile ? 15 : 20,
          fontWeight: 800,
          letterSpacing: mobile ? 0.5 : 1.5,
          lineHeight: 1.3,
        }}>
          &#9728; SUMMER SPECIAL — UP TO $1,500 OFF A NEW ROOF
        </div>
        <div style={{
          fontSize: mobile ? 11 : 12,
          fontWeight: 600,
          opacity: 0.7,
          marginTop: 2,
        }}>
          Tap to claim your savings &#8594;
        </div>
      </div>

      {/* Spacer so sticky bar doesn't cover content */}
      <div style={{ height: stickyH }} />

      {/* ── HERO ── */}
      <section style={{
        position: "relative",
        minHeight: mobile ? "auto" : `calc(100vh - ${stickyH}px)`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Background image */}
        <img
          src="/images/roof-finished.jpg"
          alt=""
          loading="eager"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0,
          }}
        />
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72))",
        }} />

        {/* Content over image */}
        <div style={{ position: "relative", zIndex: 2, padding: mobile ? "0 20px" : "0 48px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Wordmark */}
          <div style={{
            padding: mobile ? "18px 0" : "24px 0",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: mobile ? 22 : 28, fontWeight: 700, color: COLORS.gold, letterSpacing: -1 }}>42</span>
            <span style={{ fontSize: mobile ? 11 : 13, fontWeight: 600, letterSpacing: 4, color: COLORS.white, textTransform: "uppercase", paddingLeft: 6 }}>EXTERIORS</span>
          </div>

          {/* Hero body: copy + form */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            alignItems: mobile ? "stretch" : "center",
            justifyContent: "center",
            gap: mobile ? 28 : 56,
            paddingTop: mobile ? 28 : 48,
            paddingBottom: mobile ? 32 : 48,
          }}>
            {/* Left: copy */}
            <div style={{ flex: 1, maxWidth: mobile ? "100%" : 540 }}>
              {/* Big offer treatment with warm glow */}
              <div style={{
                position: "relative",
                marginBottom: 20,
              }}>
                {/* Warm gold glow behind the offer */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: mobile ? "30%" : "25%",
                  width: mobile ? 180 : 280,
                  height: mobile ? 100 : 140,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(ellipse, ${COLORS.gold}18 0%, transparent 70%)`,
                  pointerEvents: "none",
                  zIndex: 0,
                }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    fontSize: mobile ? 13 : 15,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: COLORS.goldLight,
                    marginBottom: 6,
                  }}>
                    &#9728; Summer Special
                  </div>

                  <div style={{
                    fontSize: mobile ? 38 : 52,
                    fontWeight: 900,
                    fontFamily: "'Georgia', serif",
                    color: COLORS.gold,
                    lineHeight: 1.05,
                    letterSpacing: -1,
                    marginBottom: 4,
                    textShadow: `0 0 40px ${COLORS.gold}33`,
                  }}>
                    UP TO $1,500 OFF
                  </div>

                  <div style={{
                    fontSize: mobile ? 16 : 20,
                    fontWeight: 700,
                    color: COLORS.white,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}>
                    A Brand New Roof
                  </div>

                  <div style={{
                    fontSize: mobile ? 13 : 14,
                    color: COLORS.goldLight,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}>
                    Fill out the form to find your savings.
                  </div>

                  <div style={{
                    fontSize: mobile ? 11 : 12,
                    color: COLORS.silver,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}>
                    Limited time — summer 2026 only
                  </div>
                </div>
              </div>

              <h1 style={{
                fontFamily: "'Georgia', serif",
                fontSize: mobile ? "clamp(32px, 8vw, 44px)" : "clamp(40px, 4vw, 56px)",
                fontWeight: 700,
                color: COLORS.white,
                lineHeight: 1.15,
                margin: "0 0 14px",
              }}>
                Find Out How Much You Can Save on a New Roof
              </h1>

              <p style={{
                fontSize: mobile ? 16 : 18,
                color: COLORS.silver,
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}>
                A free, no-obligation inspection from a contractor who builds roofs to last — not the cheapest bid.
              </p>

              {/* 3 inline checkmarks */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: mobile ? 8 : 16,
                fontSize: mobile ? 15 : 17,
                color: COLORS.white,
                marginBottom: mobile ? 8 : 0,
              }}>
                {["Free inspection", "Honest age report", "Premium GAF materials"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <span style={{ color: COLORS.gold, fontWeight: 700 }}>&#10003;</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div
              id="form"
              style={{
                background: COLORS.charcoal,
                border: `1px solid ${COLORS.gold}`,
                borderRadius: 6,
                padding: mobile ? "24px 20px" : "32px 28px",
                width: mobile ? "100%" : 400,
                flexShrink: 0,
                boxSizing: "border-box",
                boxShadow: `0 0 30px ${COLORS.gold}15`,
              }}
            >
              {renderForm()}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ROW ── */}
      <section style={{
        background: COLORS.charcoal,
        borderTop: `1px solid ${COLORS.border}`,
        padding: mobile ? "40px 20px" : "52px 48px",
      }}>
        <div style={{
          display: mobile ? "flex" : "grid",
          flexDirection: "column",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: mobile ? 28 : 32,
          maxWidth: 1000,
          margin: "0 auto",
          alignItems: "start",
        }}>
          {/* Prop 1 with image */}
          <div style={{ textAlign: "center" }}>
            <img
              src="/images/site-protection.jpg"
              alt="Crew protecting property before roof removal"
              loading="lazy"
              style={{ width: "100%", maxWidth: 300, height: mobile ? 160 : 180, objectFit: "cover", borderRadius: 4, marginBottom: 14, display: "block", marginLeft: "auto", marginRight: "auto" }}
            />
            <div style={{ fontSize: mobile ? 17 : 19, fontWeight: 600, color: COLORS.white, marginBottom: 6 }}>
              We protect your property first
            </div>
            <div style={{ fontSize: mobile ? 15 : 16, color: COLORS.silver, lineHeight: 1.6 }}>
              Tarps, care, and cleanup — every job.
            </div>
          </div>

          {/* Prop 2 with image */}
          <div style={{ textAlign: "center" }}>
            <img
              src="/images/gaf-materials.jpg"
              alt="GAF Timberline HD roofing materials"
              loading="lazy"
              style={{ width: "100%", maxWidth: 300, height: mobile ? 160 : 180, objectFit: "cover", borderRadius: 4, marginBottom: 14, display: "block", marginLeft: "auto", marginRight: "auto" }}
            />
            <div style={{ fontSize: mobile ? 17 : 19, fontWeight: 600, color: COLORS.white, marginBottom: 6 }}>
              Premium GAF materials, built to last 20+ years
            </div>
            <div style={{ fontSize: mobile ? 15 : 16, color: COLORS.silver, lineHeight: 1.6 }}>
              Quality shingles and underlayment — no shortcuts.
            </div>
          </div>

          {/* Prop 3 text only */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: mobile ? "auto" : 180 }}>
            <div style={{ fontSize: mobile ? 40 : 48, color: COLORS.gold, marginBottom: 10 }}>&#9733;</div>
            <div style={{ fontSize: mobile ? 17 : 19, fontWeight: 600, color: COLORS.white, marginBottom: 6 }}>
              We don't chase volume
            </div>
            <div style={{ fontSize: mobile ? 15 : 16, color: COLORS.silver, lineHeight: 1.6 }}>
              We build roofs that last. One crew, one job, done right.
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGNS CHECKLIST ── */}
      <section style={{
        background: COLORS.black,
        borderTop: `1px solid ${COLORS.border}`,
        padding: mobile ? "40px 20px" : "52px 48px",
      }}>
        <h2 style={{
          fontFamily: "'Georgia', serif",
          fontSize: mobile ? 26 : 34,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.2,
          margin: "0 auto 28px",
          maxWidth: 600,
        }}>
          Signs it may be time for a new roof
        </h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxWidth: 540,
          margin: "0 auto",
        }}>
          {signs.map((item) => (
            <div key={item} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: mobile ? 17 : 19,
              color: COLORS.white,
              lineHeight: 1.4,
            }}>
              <span style={{ color: COLORS.gold, fontSize: 20, fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORM DAMAGE ── */}
      <section style={{
        background: COLORS.graphite,
        borderTop: `1px solid ${COLORS.border}`,
        padding: mobile ? "36px 20px" : "48px 48px",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: "'Georgia', serif",
          fontSize: mobile ? 24 : 30,
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.2,
          margin: "0 auto 14px",
          maxWidth: 600,
        }}>
          Think a storm caused damage?
        </h2>
        <p style={{
          fontSize: mobile ? 16 : 18,
          color: COLORS.silver,
          lineHeight: 1.7,
          maxWidth: 600,
          margin: "0 auto 24px",
        }}>
          Let's identify it — book a free inspection and we'll show you what we find.
          As your contractor, we restore your property based on what your insurance approves.
        </p>
        <button
          onClick={scrollToForm}
          style={{
            background: COLORS.gold,
            color: COLORS.black,
            border: "none",
            padding: "18px 40px",
            fontSize: mobile ? 15 : 17,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Find My Savings
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: COLORS.black,
        borderTop: `1px solid ${COLORS.border}`,
        padding: "20px 24px",
        textAlign: "center",
        fontSize: 13,
        color: COLORS.mist,
        letterSpacing: 1,
      }}>
        42 Exteriors &middot; Roofing &amp; Exterior Contracting &middot; NJ &middot; DE &middot; PA &middot; MD
      </footer>

    </div>
  );
}
