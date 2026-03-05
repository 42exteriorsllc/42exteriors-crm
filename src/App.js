import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  black: "#0a0a0a", charcoal: "#111111", graphite: "#1a1a1a", steel: "#222222",
  border: "#2a2a2a", mist: "#666", silver: "#999", light: "#ccc", white: "#f0ede8",
  gold: "#c9a84c", goldLight: "#e8c97a", retail: "#4a9eff", insurance: "#f0a500",
  commercial: "#7c6ff7", green: "#3ecf8e", red: "#e05252",
};
const STAGES = [
  { id: "new", label: "New Leads", color: COLORS.silver },
  { id: "contacted", label: "Contacted", color: "#4a9eff" },
  { id: "inspected", label: "Inspected", color: COLORS.gold },
  { id: "proposal", label: "Proposal Sent", color: "#a78bfa" },
  { id: "approved", label: "Approved", color: COLORS.green },
  { id: "closed_won", label: "Closed Won", color: COLORS.green },
  { id: "closed_lost", label: "Closed Lost", color: COLORS.red },
];
const DIVISIONS = ["Insurance", "Retail", "Commercial"];
const STATES = ["NJ", "DE", "PA"];
const SOURCES = ["Door Knock", "Storm Canvass", "Web Lead", "Referral", "Google Ads", "Facebook", "Repeat Customer"];
const divisionColor = (d) => ({ Insurance: COLORS.insurance, Retail: COLORS.retail, Commercial: COLORS.commercial }[d] || COLORS.silver);
const emptyLead = { name: "", address: "", city: "", state: "NJ", phone: "", email: "", division: "Insurance", source: "Web Lead", stage: "new", estimated_value: "", notes: "", rep_initials: "", claim_number: "", carrier: "" };

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  const s = {
    screen: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.black, fontFamily: "'Barlow', 'Helvetica Neue', sans-serif" },
    box: { width: 400, background: COLORS.charcoal, border: `1px solid ${COLORS.border}`, padding: "48px 40px" },
    logoNum: { fontFamily: "'Georgia', serif", fontSize: 32, fontWeight: 700, color: COLORS.gold, letterSpacing: -1 },
    logoTxt: { fontSize: 13, fontWeight: 600, letterSpacing: 4, color: COLORS.white, textTransform: "uppercase", paddingLeft: 8 },
    title: { fontSize: 13, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: COLORS.white, marginBottom: 8, marginTop: 40 },
    sub: { fontSize: 12, color: COLORS.mist, marginBottom: 32 },
    group: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
    label: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: COLORS.mist },
    input: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, color: COLORS.white, padding: "12px 14px", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
    btn: { width: "100%", background: COLORS.gold, color: COLORS.black, border: "none", padding: "14px", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", marginTop: 8 },
    error: { fontSize: 12, color: COLORS.red, marginTop: 12, textAlign: "center" },
  };
  return (
    <div style={s.screen}>
      <div style={s.box}>
        <div><span style={s.logoNum}>42</span><span style={s.logoTxt}>Exteriors</span></div>
        <div style={s.title}>Sign In</div>
        <div style={s.sub}>Access the 42 Exteriors CRM</div>
        <div style={s.group}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={s.group}>
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button style={s.btn} onClick={handleLogin} disabled={loading}>{loading ? "Signing in..." : "Sign In â†’"}</button>
        {error && <div style={s.error}>{error}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("kanban");
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState(emptyLead);
  const [filterDiv, setFilterDiv] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [filterRep, setFilterRep] = useState("All");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [detailLead, setDetailLead] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) fetchLeads(); }, [session]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setLeads([]); };

  const filtered = leads.filter(l => {
    if (filterDiv !== "All" && l.division !== filterDiv) return false;
    if (filterState !== "All" && l.state !== filterState) return false;
    if (filterRep !== "All" && l.rep_initials !== filterRep) return false;
    if (search && !`${l.name} ${l.address} ${l.city} ${l.email} ${l.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byStage = (stageId) => filtered.filter(l => l.stage === stageId);
  const totalValue = (stageId) => byStage(stageId).reduce((s, l) => s + (Number(l.estimated_value) || 0), 0);
  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  const allReps = [...new Set(leads.map(l => l.rep_initials).filter(Boolean))];
  const pipelineValue = leads.filter(l => !["closed_won","closed_lost"].includes(l.stage)).reduce((s,l) => s+(Number(l.estimated_value)||0),0);
  const wonValue = leads.filter(l => l.stage==="closed_won").reduce((s,l) => s+(Number(l.estimated_value)||0),0);
  const wonCount = leads.filter(l => l.stage==="closed_won").length;

  const openAdd = () => { setForm(emptyLead); setEditLead(null); setShowModal(true); };
  const openEdit = (lead, e) => { e?.stopPropagation(); setForm({...lead}); setEditLead(lead.id); setShowModal(true); };

  const saveForm = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editLead) {
      const { data, error } = await supabase.from("leads").update({...form, estimated_value: Number(form.estimated_value)||0}).eq("id", editLead).select().single();
      if (!error) { setLeads(ls => ls.map(l => l.id===editLead ? data : l)); if (detailLead?.id===editLead) setDetailLead(data); }
    } else {
      const { data, error } = await supabase.from("leads").insert([{...form, estimated_value: Number(form.estimated_value)||0}]).select().single();
      if (!error) setLeads(ls => [data, ...ls]);
    }
    setSaving(false); setShowModal(false);
  };

  const deleteLead = async (id) => { await supabase.from("leads").delete().eq("id", id); setLeads(ls => ls.filter(l => l.id!==id)); setDetailLead(null); };
  const moveStage = async (lead, stageId) => {
    setLeads(ls => ls.map(l => l.id===lead.id ? {...l, stage:stageId} : l));
    if (detailLead?.id===lead.id) setDetailLead(d => ({...d, stage:stageId}));
    await supabase.from("leads").update({stage:stageId}).eq("id", lead.id);
  };
  const onDragStart = (e, lead) => { setDragging(lead); e.dataTransfer.effectAllowed="move"; };
  const onDrop = (e, stageId) => { e.preventDefault(); if (dragging) moveStage(dragging, stageId); setDragging(null); setDragOver(null); };
  const onDragOver = (e, stageId) => { e.preventDefault(); setDragOver(stageId); };

  const s = {
    app: { display:"flex", flexDirection:"column", minHeight:"100vh", background:COLORS.black, color:COLORS.white, fontFamily:"'Barlow','Helvetica Neue',sans-serif", fontWeight:300 },
    topbar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:60, borderBottom:`1px solid ${COLORS.border}`, background:COLORS.charcoal, flexShrink:0 },
    logoNum: { fontFamily:"'Georgia',serif", fontSize:26, fontWeight:700, color:COLORS.gold, letterSpacing:-1 },
    logoTxt: { fontSize:11, fontWeight:600, letterSpacing:4, color:COLORS.white, textTransform:"uppercase", paddingLeft:6 },
    logoBadge: { fontSize:9, letterSpacing:2, color:COLORS.mist, textTransform:"uppercase", paddingLeft:12 },
    topActions: { display:"flex", gap:12, alignItems:"center" },
    userEmail: { fontSize:11, color:COLORS.mist, letterSpacing:1 },
    btnGold: { background:COLORS.gold, color:COLORS.black, border:"none", padding:"8px 20px", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer" },
    btnGhost: { background:"transparent", color:COLORS.silver, border:`1px solid ${COLORS.border}`, padding:"7px 16px", fontSize:11, letterSpacing:2, textTransform:"uppercase", cursor:"pointer" },
    btnRed: { background:"transparent", color:COLORS.red, border:`1px solid ${COLORS.red}`, padding:"7px 16px", fontSize:11, letterSpacing:2, textTransform:"uppercase", cursor:"pointer" },
    statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:COLORS.border, borderBottom:`1px solid ${COLORS.border}`, flexShrink:0 },
    stat: { background:COLORS.charcoal, padding:"18px 28px" },
    statLabel: { fontSize:9, letterSpacing:3, textTransform:"uppercase", color:COLORS.mist, marginBottom:8 },
    statValue: { fontFamily:"'Georgia',serif", fontSize:32, fontWeight:400, color:COLORS.gold, lineHeight:1 },
    statSub: { fontSize:11, color:COLORS.mist, marginTop:4 },
    toolbar: { display:"flex", alignItems:"center", gap:12, padding:"14px 32px", borderBottom:`1px solid ${COLORS.border}`, background:COLORS.charcoal, flexShrink:0, flexWrap:"wrap" },
    searchBox: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.white, padding:"8px 14px", fontSize:13, fontFamily:"'Barlow',sans-serif", outline:"none", width:220 },
    filterSelect: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.silver, padding:"8px 12px", fontSize:11, letterSpacing:1, textTransform:"uppercase", fontFamily:"'Barlow',sans-serif", outline:"none", cursor:"pointer" },
    board: { display:"flex", gap:1, padding:"20px", overflowX:"auto", flex:1, background:COLORS.black, alignItems:"flex-start" },
    col: (over) => ({ minWidth:230, maxWidth:230, background:over?"rgba(201,168,76,0.05)":COLORS.charcoal, border:`1px solid ${over?"rgba(201,168,76,0.3)":COLORS.border}`, display:"flex", flexDirection:"column", transition:"all 0.2s", flexShrink:0 }),
    colHeader: { padding:"14px 16px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" },
    colTitle: (color) => ({ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color }),
    colCount: { fontSize:10, color:COLORS.mist, background:COLORS.graphite, padding:"2px 8px" },
    colValue: { fontSize:10, color:COLORS.gold, letterSpacing:1 },
    colBody: { padding:"10px", display:"flex", flexDirection:"column", gap:8, minHeight:80 },
    card: (div) => ({ background:COLORS.graphite, border:`1px solid ${COLORS.border}`, borderLeft:`2px solid ${divisionColor(div)}`, padding:"12px 14px", cursor:"pointer", transition:"all 0.2s" }),
    cardName: { fontSize:13, fontWeight:500, color:COLORS.white, marginBottom:4 },
    cardAddr: { fontSize:11, color:COLORS.mist, marginBottom:8, lineHeight:1.4 },
    cardMeta: { display:"flex", flexWrap:"wrap", gap:4, alignItems:"center" },
    tag: (color) => ({ fontSize:9, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color, background:`${color}18`, padding:"3px 7px" }),
    cardValue: { fontSize:12, color:COLORS.gold, fontFamily:"'Georgia',serif", fontWeight:600 },
    table: { width:"100%", borderCollapse:"collapse", fontSize:12 },
    th: { textAlign:"left", padding:"10px 16px", fontSize:9, letterSpacing:3, textTransform:"uppercase", color:COLORS.mist, borderBottom:`1px solid ${COLORS.border}`, background:COLORS.charcoal, fontWeight:400 },
    td: { padding:"12px 16px", borderBottom:`1px solid rgba(42,42,42,0.6)`, verticalAlign:"middle" },
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center" },
    modal: { background:COLORS.charcoal, border:`1px solid ${COLORS.border}`, width:"min(680px,95vw)", maxHeight:"90vh", overflowY:"auto" },
    modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 28px", borderBottom:`1px solid ${COLORS.border}` },
    modalTitle: { fontSize:14, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:COLORS.white },
    modalClose: { background:"none", border:"none", color:COLORS.mist, fontSize:20, cursor:"pointer" },
    modalBody: { padding:"24px 28px", display:"flex", flexDirection:"column", gap:16 },
    formRow: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
    formGroup: { display:"flex", flexDirection:"column", gap:6 },
    formLabel: { fontSize:9, letterSpacing:2, textTransform:"uppercase", color:COLORS.mist },
    formInput: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.white, padding:"10px 12px", fontSize:13, fontFamily:"'Barlow',sans-serif", outline:"none" },
    formSelect: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.white, padding:"10px 12px", fontSize:13, fontFamily:"'Barlow',sans-serif", outline:"none", cursor:"pointer" },
    formTextarea: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.white, padding:"10px 12px", fontSize:13, fontFamily:"'Barlow',sans-serif", outline:"none", minHeight:80, resize:"vertical" },
    modalFooter: { display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 28px", borderTop:`1px solid ${COLORS.border}` },
    panel: { position:"fixed", right:0, top:0, bottom:0, width:400, background:COLORS.charcoal, borderLeft:`1px solid ${COLORS.border}`, zIndex:40, display:"flex", flexDirection:"column", overflowY:"auto" },
    panelHeader: { padding:"20px 24px", borderBottom:`1px solid ${COLORS.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
    panelSection: { padding:"20px 24px", borderBottom:`1px solid ${COLORS.border}` },
    panelLabel: { fontSize:9, letterSpacing:3, textTransform:"uppercase", color:COLORS.mist, marginBottom:12 },
    panelField: { display:"flex", justifyContent:"space-between", marginBottom:10 },
    panelFieldLabel: { fontSize:11, color:COLORS.mist },
    panelFieldValue: { fontSize:12, color:COLORS.white, textAlign:"right", maxWidth:200 },
    stageSelect: { background:COLORS.graphite, border:`1px solid ${COLORS.border}`, color:COLORS.white, padding:"8px 12px", fontSize:11, fontFamily:"'Barlow',sans-serif", outline:"none", cursor:"pointer", width:"100%" },
    loadingScreen: { display:"flex", alignItems:"center", justifyContent:"center", flex:1, flexDirection:"column", gap:16 },
  };

  const Field = ({label, val}) => (
    <div style={s.panelField}>
      <span style={s.panelFieldLabel}>{label}</span>
      <span style={s.panelFieldValue}>{val||"â€”"}</span>
    </div>
  );

  const LeadCard = ({lead}) => (
    <div style={s.card(lead.division)} draggable onDragStart={e=>onDragStart(e,lead)} onClick={()=>setDetailLead(lead)}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=COLORS.gold;e.currentTarget.style.background="#222";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=COLORS.border;e.currentTarget.style.background=COLORS.graphite;}}>
      <div style={s.cardName}>{lead.name}</div>
      <div style={s.cardAddr}>{lead.city}, {lead.state}</div>
      <div style={s.cardMeta}>
        <span style={s.tag(divisionColor(lead.division))}>{lead.division}</span>
        <span style={s.tag(COLORS.mist)}>{lead.state}</span>
        {lead.rep_initials&&<span style={s.tag(COLORS.silver)}>{lead.rep_initials}</span>}
        {lead.estimated_value?<span style={{...s.cardValue,marginLeft:"auto"}}>{fmt(lead.estimated_value)}</span>:null}
      </div>
    </div>
  );

  if (authLoading) return (
    <div style={{...s.app,...s.loadingScreen}}>
      <div><span style={{fontFamily:"Georgia",fontSize:32,fontWeight:700,color:COLORS.gold}}>42</span><span style={{fontSize:13,fontWeight:600,letterSpacing:4,color:COLORS.white,textTransform:"uppercase",paddingLeft:8}}>Exteriors</span></div>
    </div>
  );

  if (!session) return <LoginScreen />;

  if (loading) return (
    <div style={{...s.app,...s.loadingScreen}}>
      <div><span style={{fontFamily:"Georgia",fontSize:26,fontWeight:700,color:COLORS.gold}}>42</span><span style={{fontSize:11,fontWeight:600,letterSpacing:4,color:COLORS.white,textTransform:"uppercase",paddingLeft:6}}>Exteriors</span></div>
      <div style={{fontSize:11,color:COLORS.mist,letterSpacing:2,marginTop:16}}>Loading...</div>
    </div>
  );

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <div><span style={s.logoNum}>42</span><span style={s.logoTxt}>Exteriors</span><span style={s.logoBadge}>CRM</span></div>
        <div style={s.topActions}>
          <span style={s.userEmail}>{session.user.email}</span>
          <button style={s.btnGhost} onClick={()=>setView(v=>v==="kanban"?"list":"kanban")}>{view==="kanban"?"List View":"Board View"}</button>
          <button style={s.btnGold} onClick={openAdd}>+ New Lead</button>
          <button style={s.btnRed} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.stat}><div style={s.statLabel}>Total Leads</div><div style={s.statValue}>{leads.length}</div><div style={s.statSub}>{filtered.length} shown</div></div>
        <div style={s.stat}><div style={s.statLabel}>Pipeline Value</div><div style={s.statValue}>${(pipelineValue/1000).toFixed(0)}k</div><div style={s.statSub}>Active opportunities</div></div>
        <div style={s.stat}><div style={s.statLabel}>Closed Won</div><div style={s.statValue}>${(wonValue/1000).toFixed(0)}k</div><div style={s.statSub}>{wonCount} jobs</div></div>
        <div style={s.stat}><div style={s.statLabel}>Close Rate</div><div style={s.statValue}>{leads.length?Math.round((wonCount/leads.length)*100):0}%</div><div style={s.statSub}>All time</div></div>
      </div>

      <div style={s.toolbar}>
        <input style={s.searchBox} placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={s.filterSelect} value={filterDiv} onChange={e=>setFilterDiv(e.target.value)}>
          <option value="All">All Divisions</option>{DIVISIONS.map(d=><option key={d}>{d}</option>)}
        </select>
        <select style={s.filterSelect} value={filterState} onChange={e=>setFilterState(e.target.value)}>
          <option value="All">All States</option>{STATES.map(st=><option key={st}>{st}</option>)}
        </select>
        <select style={s.filterSelect} value={filterRep} onChange={e=>setFilterRep(e.target.value)}>
          <option value="All">All Reps</option>{allReps.map(r=><option key={r}>{r}</option>)}
        </select>
      </div>

      {view==="kanban"&&(
        <div style={s.board}>
          {STAGES.map(stage=>{
            const stageLeads=byStage(stage.id); const val=totalValue(stage.id);
            return (
              <div key={stage.id} style={s.col(dragOver===stage.id)} onDragOver={e=>onDragOver(e,stage.id)} onDrop={e=>onDrop(e,stage.id)} onDragLeave={()=>setDragOver(null)}>
                <div style={s.colHeader}>
                  <div><div style={s.colTitle(stage.color)}>{stage.label}</div>{val>0&&<div style={s.colValue}>{fmt(val)}</div>}</div>
                  <span style={s.colCount}>{stageLeads.length}</span>
                </div>
                <div style={s.colBody}>{stageLeads.map(lead=><LeadCard key={lead.id} lead={lead}/>)}</div>
              </div>
            );
          })}
        </div>
      )}

      {view==="list"&&(
        <div style={{flex:1,overflowY:"auto",padding:"0 20px 20px"}}>
          <table style={s.table}>
            <thead><tr>{["Name","Location","Division","Source","Rep","Value","Stage",""].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(lead=>(
                <tr key={lead.id} style={{cursor:"pointer"}} onClick={()=>setDetailLead(lead)}
                  onMouseEnter={e=>e.currentTarget.style.background=COLORS.graphite}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={s.td}><div style={{fontSize:13,color:COLORS.white,fontWeight:500}}>{lead.name}</div><div style={{fontSize:11,color:COLORS.mist}}>{lead.email}</div></td>
                  <td style={s.td}>{lead.city}, {lead.state}</td>
                  <td style={s.td}><span style={s.tag(divisionColor(lead.division))}>{lead.division}</span></td>
                  <td style={s.td}><span style={{fontSize:11,color:COLORS.mist}}>{lead.source}</span></td>
                  <td style={s.td}>{lead.rep_initials||"â€”"}</td>
                  <td style={s.td}><span style={{color:COLORS.gold,fontFamily:"Georgia"}}>{lead.estimated_value?fmt(lead.estimated_value):"â€”"}</span></td>
                  <td style={s.td}><span style={s.tag(STAGES.find(st=>st.id===lead.stage)?.color||COLORS.mist)}>{STAGES.find(st=>st.id===lead.stage)?.label}</span></td>
                  <td style={s.td}><button style={{...s.btnGhost,padding:"4px 10px",fontSize:9}} onClick={e=>openEdit(lead,e)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailLead&&(
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <div style={{fontSize:16,fontWeight:500,color:COLORS.white,marginBottom:4}}>{detailLead.name}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                <span style={s.tag(divisionColor(detailLead.division))}>{detailLead.division}</span>
                <span style={s.tag(COLORS.silver)}>{detailLead.state}</span>
                {detailLead.estimated_value?<span style={s.tag(COLORS.gold)}>{fmt(detailLead.estimated_value)}</span>:null}
              </div>
            </div>
            <button style={{background:"none",border:"none",color:COLORS.mist,fontSize:20,cursor:"pointer"}} onClick={()=>setDetailLead(null)}>Ã—</button>
          </div>
          <div style={s.panelSection}>
            <div style={s.panelLabel}>Stage</div>
            <select style={s.stageSelect} value={detailLead.stage} onChange={e=>moveStage(detailLead,e.target.value)}>
              {STAGES.map(st=><option key={st.id} value={st.id}>{st.label}</option>)}
            </select>
          </div>
          <div style={s.panelSection}>
            <div style={s.panelLabel}>Contact</div>
            <Field label="Phone" val={detailLead.phone}/>
            <Field label="Email" val={detailLead.email}/>
            <Field label="Address" val={`${detailLead.address}, ${detailLead.city}, ${detailLead.state}`}/>
          </div>
          <div style={s.panelSection}>
            <div style={s.panelLabel}>Lead Details</div>
            <Field label="Source" val={detailLead.source}/>
            <Field label="Rep" val={detailLead.rep_initials||"Unassigned"}/>
            <Field label="Est. Value" val={detailLead.estimated_value?`$${Number(detailLead.estimated_value).toLocaleString()}`:"â€”"}/>
            <Field label="Created" val={detailLead.created_at?.slice(0,10)}/>
          </div>
          {detailLead.division==="Insurance"&&(
            <div style={s.panelSection}>
              <div style={s.panelLabel}>Insurance</div>
              <Field label="Carrier" val={detailLead.carrier}/>
              <Field label="Claim #" val={detailLead.claim_number}/>
              <Field label="Adjuster" val={detailLead.adjuster_name}/>
              <Field label="Supplement" val={detailLead.supplement_status}/>
            </div>
          )}
          {detailLead.notes&&(
            <div style={s.panelSection}>
              <div style={s.panelLabel}>Notes</div>
              <div style={{fontSize:12,color:COLORS.silver,lineHeight:1.7}}>{detailLead.notes}</div>
            </div>
          )}
          <div style={{padding:"16px 24px",display:"flex",gap:10}}>
            <button style={{...s.btnGold,flex:1}} onClick={e=>openEdit(detailLead,e)}>Edit Lead</button>
            <button style={s.btnRed} onClick={()=>deleteLead(detailLead.id)}>Delete</button>
          </div>
        </div>
      )}

      {showModal&&(
        <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>{editLead?"Edit Lead":"Add New Lead"}</span>
              <button style={s.modalClose} onClick={()=>setShowModal(false)}>Ã—</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.formLabel}>Full Name *</label><input style={s.formInput} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/></div>
                <div style={s.formGroup}><label style={s.formLabel}>Phone</label><input style={s.formInput} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(555) 000-0000"/></div>
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.formLabel}>Email</label><input style={s.formInput} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com"/></div>
                <div style={s.formGroup}><label style={s.formLabel}>Est. Value ($)</label><input style={s.formInput} type="number" value={form.estimated_value} onChange={e=>setForm(f=>({...f,estimated_value:e.target.value}))} placeholder="12000"/></div>
              </div>
              <div style={s.formGroup}><label style={s.formLabel}>Address</label><input style={s.formInput} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St"/></div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.formLabel}>City</label><input style={s.formInput} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Cherry Hill"/></div>
                <div style={s.formGroup}><label style={s.formLabel}>State</label><select style={s.formSelect} value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))}>{STATES.map(st=><option key={st}>{st}</option>)}</select></div>
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.formLabel}>Division</label><select style={s.formSelect} value={form.division} onChange={e=>setForm(f=>({...f,division:e.target.value}))}>{DIVISIONS.map(d=><option key={d}>{d}</option>)}</select></div>
                <div style={s.formGroup}><label style={s.formLabel}>Lead Source</label><select style={s.formSelect} value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>{SOURCES.map(src=><option key={src}>{src}</option>)}</select></div>
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}><label style={s.formLabel}>Stage</label><select style={s.formSelect} value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))}>{STAGES.map(st=><option key={st.id} value={st.id}>{st.label}</option>)}</select></div>
                <div style={s.formGroup}><label style={s.formLabel}>Sales Rep</label><input style={s.formInput} value={form.rep_initials} onChange={e=>setForm(f=>({...f,rep_initials:e.target.value}))} placeholder="Initials or name"/></div>
              </div>
              {form.division==="Insurance"&&(
                <div style={s.formRow}>
                  <div style={s.formGroup}><label style={s.formLabel}>Insurance Carrier</label><input style={s.formInput} value={form.carrier} onChange={e=>setForm(f=>({...f,carrier:e.target.value}))} placeholder="State Farm"/></div>
                  <div style={s.formGroup}><label style={s.formLabel}>Claim Number</label><input style={s.formInput} value={form.claim_number} onChange={e=>setForm(f=>({...f,claim_number:e.target.value}))} placeholder="CLM-00000"/></div>
                </div>
              )}
              <div style={s.formGroup}><label style={s.formLabel}>Notes</label><textarea style={s.formTextarea} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Damage description, adjuster details, next steps..."/></div>
            </div>
            <div style={s.modalFooter}>
              <button style={s.btnGhost} onClick={()=>setShowModal(false)}>Cancel</button>
              <button style={s.btnGold} onClick={saveForm} disabled={saving}>{saving?"Saving...":editLead?"Save Changes":"Add Lead"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}