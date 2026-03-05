import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  black: "#0a0a0a", charcoal: "#111111", graphite: "#1a1a1a", steel: "#222222",
  border: "#2a2a2a", mist: "#666", silver: "#999", light: "#ccc", white: "#f0ede8",
  gold: "#c9a84c", goldLight: "#e8c97a", green: "#3ecf8e", red: "#e05252",
  blue: "#4a9eff",
};

const STAGE_STEPS = [
  { id: "new",         label: "Received",       desc: "Your project request has been received." },
  { id: "contacted",   label: "Contacted",       desc: "A representative has reached out to schedule." },
  { id: "inspected",   label: "Inspected",       desc: "On-site inspection has been completed." },
  { id: "proposal",    label: "Proposal Sent",   desc: "Your detailed proposal is ready for review." },
  { id: "approved",    label: "Approved",        desc: "Project approved and being scheduled." },
  { id: "closed_won",  label: "Complete",        desc: "Your project has been completed. Thank you!" },
];

const STAGE_ORDER = STAGE_STEPS.map((s) => s.id);

function getStageIndex(stageId) {
  const idx = STAGE_ORDER.indexOf(stageId);
  return idx === -1 ? 0 : idx;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function PortalLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const s = {
    screen: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.black, fontFamily: "'Barlow', 'Helvetica Neue', sans-serif", flexDirection: "column", gap: 0 },
    box: { width: 400, background: COLORS.charcoal, border: `1px solid ${COLORS.border}`, padding: "48px 40px" },
    logoWrap: { display: "flex", alignItems: "baseline", marginBottom: 4 },
    logoNum: { fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: COLORS.gold, letterSpacing: -1 },
    logoTxt: { fontSize: 13, fontWeight: 600, letterSpacing: 4, color: COLORS.white, textTransform: "uppercase", paddingLeft: 8 },
    badge: { fontSize: 9, letterSpacing: 2, color: COLORS.mist, textTransform: "uppercase", marginBottom: 32, paddingTop: 4 },
    title: { fontSize: 13, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: COLORS.white, marginBottom: 6 },
    sub: { fontSize: 12, color: COLORS.mist, marginBottom: 32, lineHeight: 1.6 },
    group: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
    label: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: COLORS.mist },
    input: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, color: COLORS.white, padding: "12px 14px", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
    btn: { width: "100%", background: COLORS.gold, color: COLORS.black, border: "none", padding: "14px", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", marginTop: 8 },
    error: { fontSize: 12, color: COLORS.red, marginTop: 12, textAlign: "center" },
    divider: { borderTop: `1px solid ${COLORS.border}`, margin: "28px 0" },
    helpText: { fontSize: 11, color: COLORS.mist, textAlign: "center", lineHeight: 1.6 },
  };

  return (
    <div style={s.screen}>
      <div style={s.box}>
        <div style={s.logoWrap}><span style={s.logoNum}>42</span><span style={s.logoTxt}>Exteriors</span></div>
        <div style={s.badge}>Customer Portal</div>
        <div style={s.title}>Welcome Back</div>
        <div style={s.sub}>Sign in to view your project status, documents, and photos.</div>
        <div style={s.group}>
          <label style={s.label}>Email Address</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={s.group}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button style={s.btn} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign In →"}</button>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.divider} />
        <div style={s.helpText}>Need access? Contact your 42 Exteriors representative<br />to set up your portal account.</div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function JobProgress({ stageId }) {
  const currentIdx = getStageIndex(stageId);
  const s = {
    wrap: { padding: "28px 32px", borderBottom: `1px solid ${COLORS.border}` },
    label: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, marginBottom: 20 },
    track: { display: "flex", alignItems: "flex-start", position: "relative" },
    lineWrap: { position: "absolute", top: 14, left: 14, right: 14, height: 2, background: COLORS.border, zIndex: 0 },
    lineFill: { height: "100%", background: COLORS.gold, transition: "width 0.4s ease" },
    steps: { display: "flex", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 },
    step: (active, done) => ({ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 10 }),
    dot: (active, done) => ({
      width: 28, height: 28, borderRadius: "50%",
      background: done ? COLORS.gold : active ? COLORS.gold : COLORS.graphite,
      border: `2px solid ${done || active ? COLORS.gold : COLORS.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: active ? `0 0 0 4px rgba(201,168,76,0.2)` : "none",
      transition: "all 0.3s",
      flexShrink: 0,
    }),
    dotCheck: { fontSize: 12, color: COLORS.black, fontWeight: 700 },
    dotNum: (active) => ({ fontSize: 10, color: active ? COLORS.black : COLORS.mist, fontWeight: 600 }),
    stepLabel: (active, done) => ({ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: done || active ? COLORS.white : COLORS.mist, textAlign: "center", lineHeight: 1.4, maxWidth: 70 }),
  };
  const fillPct = STAGE_STEPS.length > 1 ? (currentIdx / (STAGE_STEPS.length - 1)) * 100 : 0;

  return (
    <div style={s.wrap}>
      <div style={s.label}>Project Status</div>
      <div style={s.track}>
        <div style={s.lineWrap}><div style={{ ...s.lineFill, width: `${fillPct}%` }} /></div>
        <div style={s.steps}>
          {STAGE_STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.id} style={s.step(active, done)}>
                <div style={s.dot(active, done)}>
                  {done
                    ? <span style={s.dotCheck}>✓</span>
                    : <span style={s.dotNum(active)}>{i + 1}</span>
                  }
                </div>
                <span style={s.stepLabel(active, done)}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {STAGE_STEPS[currentIdx] && (
        <div style={{ marginTop: 20, fontSize: 12, color: COLORS.silver, background: COLORS.graphite, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.gold}`, padding: "12px 16px" }}>
          {STAGE_STEPS[currentIdx].desc}
        </div>
      )}
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ leadId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leadId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.storage.from("job-documents").list(`${leadId}/`, { sortBy: { column: "created_at", order: "desc" } });
      if (error) { setError("Could not load documents."); }
      else { setDocs(data || []); }
      setLoading(false);
    })();
  }, [leadId]);

  const download = async (name) => {
    const { data } = await supabase.storage.from("job-documents").createSignedUrl(`${leadId}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const fmtSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

  const s = {
    wrap: { padding: "24px 32px" },
    label: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, marginBottom: 20 },
    empty: { fontSize: 12, color: COLORS.mist, padding: "32px 0", textAlign: "center" },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: COLORS.graphite, border: `1px solid ${COLORS.border}`, marginBottom: 8 },
    rowLeft: { display: "flex", alignItems: "center", gap: 14 },
    icon: { fontSize: 20, lineHeight: 1, flexShrink: 0 },
    docName: { fontSize: 13, color: COLORS.white, fontWeight: 500 },
    docMeta: { fontSize: 11, color: COLORS.mist, marginTop: 2 },
    btn: { background: "transparent", color: COLORS.gold, border: `1px solid ${COLORS.border}`, padding: "6px 14px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "'Barlow', sans-serif", flexShrink: 0 },
  };

  const fileIcon = (name = "") => {
    const ext = name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "📄";
    if (["jpg", "jpeg", "png", "heic", "webp"].includes(ext)) return "🖼";
    if (["docx", "doc"].includes(ext)) return "📝";
    if (["xlsx", "xls", "csv"].includes(ext)) return "📊";
    return "📎";
  };

  if (loading) return <div style={{ ...s.wrap }}><div style={s.empty}>Loading documents...</div></div>;
  if (error) return <div style={{ ...s.wrap }}><div style={{ ...s.empty, color: COLORS.red }}>{error}</div></div>;

  return (
    <div style={s.wrap}>
      <div style={s.label}>Documents</div>
      {docs.length === 0
        ? <div style={s.empty}>No documents have been uploaded yet.</div>
        : docs.map(doc => (
          <div key={doc.name} style={s.row}>
            <div style={s.rowLeft}>
              <span style={s.icon}>{fileIcon(doc.name)}</span>
              <div>
                <div style={s.docName}>{doc.name.replace(/^\d+_/, "")}</div>
                <div style={s.docMeta}>{fmtSize(doc.metadata?.size)} {doc.created_at ? `· ${fmtDate(doc.created_at)}` : ""}</div>
              </div>
            </div>
            <button style={s.btn} onClick={() => download(doc.name)}>Download</button>
          </div>
        ))
      }
    </div>
  );
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────

function PhotosTab({ leadId }) {
  const [photos, setPhotos] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leadId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.storage.from("job-photos").list(`${leadId}/`, { sortBy: { column: "created_at", order: "desc" } });
      if (error) { setError("Could not load photos."); setLoading(false); return; }
      const files = (data || []).filter(f => f.name !== ".emptyFolderPlaceholder");
      if (files.length > 0) {
        const { data: urlData } = await supabase.storage.from("job-photos").createSignedUrls(
          files.map(f => `${leadId}/${f.name}`), 3600
        );
        const urlMap = {};
        (urlData || []).forEach(item => {
          const name = item.path.split("/").pop();
          urlMap[name] = item.signedUrl;
        });
        setSignedUrls(urlMap);
      }
      setPhotos(files);
      setLoading(false);
    })();
  }, [leadId]);

  const s = {
    wrap: { padding: "24px 32px" },
    label: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, marginBottom: 20 },
    empty: { fontSize: 12, color: COLORS.mist, padding: "32px 0", textAlign: "center" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 },
    tile: { aspectRatio: "4/3", background: COLORS.graphite, border: `1px solid ${COLORS.border}`, overflow: "hidden", cursor: "pointer", position: "relative" },
    img: { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.2s" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" },
    lightboxImg: { maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", border: `1px solid ${COLORS.border}` },
    lightboxClose: { position: "absolute", top: 20, right: 28, background: "none", border: "none", color: COLORS.white, fontSize: 28, cursor: "pointer", lineHeight: 1 },
    lightboxName: { marginTop: 14, fontSize: 11, color: COLORS.mist, letterSpacing: 1 },
  };

  if (loading) return <div style={s.wrap}><div style={s.empty}>Loading photos...</div></div>;
  if (error) return <div style={s.wrap}><div style={{ ...s.empty, color: COLORS.red }}>{error}</div></div>;

  return (
    <div style={s.wrap}>
      <div style={s.label}>Project Photos</div>
      {photos.length === 0
        ? <div style={s.empty}>No photos have been uploaded yet.</div>
        : <div style={s.grid}>
          {photos.map(photo => (
            <div key={photo.name} style={s.tile} onClick={() => setLightbox(photo.name)}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              {signedUrls[photo.name] && <img src={signedUrls[photo.name]} alt={photo.name} style={s.img} />}
            </div>
          ))}
        </div>
      }
      {lightbox && (
        <div style={s.overlay} onClick={() => setLightbox(null)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(null)}>×</button>
          <img src={signedUrls[lightbox]} alt={lightbox} style={s.lightboxImg} onClick={e => e.stopPropagation()} />
          <div style={s.lightboxName}>{lightbox.replace(/^\d+_/, "")}</div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ job }) {
  const s = {
    wrap: { padding: "24px 32px" },
    label: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, marginBottom: 20 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: COLORS.border, marginBottom: 20 },
    cell: { background: COLORS.graphite, padding: "16px 20px" },
    cellLabel: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: COLORS.mist, marginBottom: 6 },
    cellValue: { fontSize: 13, color: COLORS.white },
    notesBox: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, padding: "16px 20px" },
    noteText: { fontSize: 12, color: COLORS.silver, lineHeight: 1.7 },
  };

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={s.wrap}>
      <div style={s.label}>Project Details</div>
      <div style={s.grid}>
        <div style={s.cell}>
          <div style={s.cellLabel}>Property Address</div>
          <div style={s.cellValue}>{job.address || "—"}</div>
          <div style={{ fontSize: 12, color: COLORS.mist, marginTop: 2 }}>{job.city && job.state ? `${job.city}, ${job.state}` : ""}</div>
        </div>
        <div style={s.cell}>
          <div style={s.cellLabel}>Project Type</div>
          <div style={s.cellValue}>{job.division || "—"}</div>
        </div>
        <div style={s.cell}>
          <div style={s.cellLabel}>Your Rep</div>
          <div style={s.cellValue}>{job.rep_initials || "—"}</div>
        </div>
        <div style={s.cell}>
          <div style={s.cellLabel}>Project Started</div>
          <div style={s.cellValue}>{fmtDate(job.created_at)}</div>
        </div>
        {job.division === "Insurance" && job.carrier && (
          <div style={s.cell}>
            <div style={s.cellLabel}>Insurance Carrier</div>
            <div style={s.cellValue}>{job.carrier}</div>
          </div>
        )}
        {job.division === "Insurance" && job.claim_number && (
          <div style={s.cell}>
            <div style={s.cellLabel}>Claim Number</div>
            <div style={s.cellValue}>{job.claim_number}</div>
          </div>
        )}
      </div>
      {job.notes && (
        <>
          <div style={{ ...s.label, marginTop: 24 }}>Notes from Your Rep</div>
          <div style={s.notesBox}><div style={s.noteText}>{job.notes}</div></div>
        </>
      )}
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────

export default function Portal() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setJobLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("email", session.user.email)
        .not("stage", "eq", "closed_lost")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error || !data) setJobError("No active project found for this account. Contact your 42 Exteriors representative for help.");
      else setJob(data);
      setJobLoading(false);
    })();
  }, [session]);

  const handleSignOut = async () => { await supabase.auth.signOut(); setJob(null); };

  const s = {
    app: { display: "flex", flexDirection: "column", minHeight: "100vh", background: COLORS.black, color: COLORS.white, fontFamily: "'Barlow', 'Helvetica Neue', sans-serif", fontWeight: 300 },
    topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.charcoal, flexShrink: 0 },
    logoNum: { fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 700, color: COLORS.gold, letterSpacing: -1 },
    logoTxt: { fontSize: 11, fontWeight: 600, letterSpacing: 4, color: COLORS.white, textTransform: "uppercase", paddingLeft: 6 },
    logoBadge: { fontSize: 9, letterSpacing: 2, color: COLORS.mist, textTransform: "uppercase", paddingLeft: 12 },
    topRight: { display: "flex", alignItems: "center", gap: 16 },
    userEmail: { fontSize: 11, color: COLORS.mist, letterSpacing: 1 },
    btnGhost: { background: "transparent", color: COLORS.silver, border: `1px solid ${COLORS.border}`, padding: "7px 16px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontFamily: "'Barlow', sans-serif" },
    hero: { background: COLORS.charcoal, borderBottom: `1px solid ${COLORS.border}`, padding: "28px 32px" },
    heroLabel: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, marginBottom: 10 },
    heroName: { fontFamily: "'Georgia', serif", fontSize: 26, fontWeight: 400, color: COLORS.white, lineHeight: 1.2 },
    heroAddr: { fontSize: 13, color: COLORS.mist, marginTop: 6 },
    tabs: { display: "flex", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.charcoal, paddingLeft: 32, gap: 0, flexShrink: 0 },
    tab: (active) => ({
      padding: "14px 24px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
      color: active ? COLORS.white : COLORS.mist, borderBottom: `2px solid ${active ? COLORS.gold : "transparent"}`,
      background: "none", border: "none", borderBottom: `2px solid ${active ? COLORS.gold : "transparent"}`,
      fontFamily: "'Barlow', sans-serif", fontWeight: active ? 600 : 400, transition: "all 0.15s",
    }),
    content: { flex: 1 },
    center: { display: "flex", flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, minHeight: "60vh" },
    errorBox: { maxWidth: 440, background: COLORS.graphite, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.red}`, padding: "16px 20px", fontSize: 12, color: COLORS.silver, lineHeight: 1.7, textAlign: "center" },
  };

  if (authLoading) return (
    <div style={{ ...s.app, ...s.center }}>
      <div><span style={{ fontFamily: "Georgia", fontSize: 32, fontWeight: 700, color: COLORS.gold }}>42</span><span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, color: COLORS.white, textTransform: "uppercase", paddingLeft: 8 }}>Exteriors</span></div>
    </div>
  );

  if (!session) return <PortalLogin />;

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <div><span style={s.logoNum}>42</span><span style={s.logoTxt}>Exteriors</span><span style={s.logoBadge}>Customer Portal</span></div>
        <div style={s.topRight}>
          <span style={s.userEmail}>{session.user.email}</span>
          <button style={s.btnGhost} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {jobLoading && (
        <div style={{ ...s.center }}>
          <div style={{ fontSize: 11, color: COLORS.mist, letterSpacing: 2 }}>Loading your project...</div>
        </div>
      )}

      {!jobLoading && jobError && (
        <div style={{ ...s.center }}>
          <div style={s.errorBox}>{jobError}</div>
        </div>
      )}

      {!jobLoading && job && (
        <>
          <div style={s.hero}>
            <div style={s.heroLabel}>Your Project</div>
            <div style={s.heroName}>{job.name}</div>
            <div style={s.heroAddr}>{job.address && `${job.address}, `}{job.city}, {job.state}</div>
          </div>

          <JobProgress stageId={job.stage} />

          <div style={s.tabs}>
            {[["overview", "Overview"], ["documents", "Documents"], ["photos", "Photos"]].map(([id, label]) => (
              <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          <div style={s.content}>
            {tab === "overview" && <OverviewTab job={job} />}
            {tab === "documents" && <DocumentsTab leadId={job.id} />}
            {tab === "photos" && <PhotosTab leadId={job.id} />}
          </div>
        </>
      )}
    </div>
  );
}
