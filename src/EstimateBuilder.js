import { useState } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  black: "#0a0a0a", charcoal: "#111111", graphite: "#1a1a1a", steel: "#222222",
  border: "#2a2a2a", mist: "#666", silver: "#999", light: "#ccc", white: "#f0ede8",
  gold: "#c9a84c", goldLight: "#e8c97a", retail: "#4a9eff", insurance: "#f0a500",
  commercial: "#7c6ff7", green: "#3ecf8e", red: "#e05252",
};

const JOB_TYPES = ["Roof Replacement", "Roof Repair", "Siding", "Gutters", "Windows", "Soffit / Fascia", "Full Exterior"];
const MATERIALS = ["Architectural Shingles", "Designer Shingles", "Metal Roofing", "Flat / TPO", "Cedar Shake", "Tile"];
const PITCHES = ["Low (1–3/12)", "Standard (4–6/12)", "Steep (7–9/12)", "Very Steep (10+/12)"];
const WARRANTIES = ["Standard (10 yr)", "Enhanced (25 yr)", "Lifetime"];
const DAMAGE_TYPES = ["Hail", "Wind", "Wind + Hail", "Water / Flood", "Fire", "Other"];

const emptyRetail = {
  job_type: JOB_TYPES[0], material: MATERIALS[0], color_style: "",
  squares: "", pitch: PITCHES[1], warranty: WARRANTIES[0], notes_internal: "",
};
const emptyInsurance = {
  insurance_company: "", claim_number: "", adjuster_name: "", date_of_loss: "",
  damage_type: DAMAGE_TYPES[0], rcv: "", acv: "", deductible: "", recoverable_depreciation: "", scope_notes: "",
};
const emptyItem = () => ({ item_name: "", rate: "", quantity: "1" });
const emptyConfig = { markup_pct: "20", deposit_pct: "25", steep_surcharge_pct: "15" };

const fmt = (n) => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const num = (v) => parseFloat(v) || 0;

export default function EstimateBuilder({ leadId, leadName, leadEmail, leadPhone, leadAddress, onSaved }) {
  const [tab, setTab] = useState("retail");
  const [retail, setRetail] = useState(emptyRetail);
  const [insurance, setInsurance] = useState(emptyInsurance);
  const [lineItems, setLineItems] = useState([emptyItem()]);
  const [config, setConfig] = useState(emptyConfig);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Calculations ──────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((sum, li) => sum + num(li.rate) * num(li.quantity), 0);
  const isSteep = retail.pitch === PITCHES[2] || retail.pitch === PITCHES[3];
  const steepSurcharge = isSteep ? subtotal * (num(config.steep_surcharge_pct) / 100) : 0;
  const baseWithSurcharge = subtotal + steepSurcharge;
  const markupAmt = baseWithSurcharge * (num(config.markup_pct) / 100);
  const customerPrice = baseWithSurcharge + markupAmt;
  const depositAmt = customerPrice * (num(config.deposit_pct) / 100);
  const recoverableDepr = num(insurance.rcv) - num(insurance.acv);

  // ── Line item helpers ─────────────────────────────────────────────────────
  const setItem = (idx, field, val) =>
    setLineItems((prev) => prev.map((li, i) => (i === idx ? { ...li, [field]: val } : li)));
  const addItem = () => setLineItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setLineItems((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const payload = {
        lead_id: leadId || null,
        type: tab,
        ...(tab === "retail"
          ? {
              job_type: retail.job_type, material: retail.material, color_style: retail.color_style,
              squares: num(retail.squares), pitch: retail.pitch, warranty: retail.warranty,
              notes_internal: retail.notes_internal,
              markup_pct: num(config.markup_pct), deposit_pct: num(config.deposit_pct),
              steep_surcharge_pct: num(config.steep_surcharge_pct),
              subtotal, steep_surcharge: steepSurcharge, customer_price: customerPrice, deposit_amount: depositAmt,
            }
          : {
              insurance_company: insurance.insurance_company, claim_number: insurance.claim_number,
              adjuster_name: insurance.adjuster_name, date_of_loss: insurance.date_of_loss || null,
              damage_type: insurance.damage_type, rcv: num(insurance.rcv), acv: num(insurance.acv),
              deductible: num(insurance.deductible),
              recoverable_depreciation: recoverableDepr, scope_notes: insurance.scope_notes,
            }),
      };

      const { data: est, error: estErr } = await supabase.from("estimates").insert(payload).select().single();
      if (estErr) throw estErr;

      if (tab === "retail" && lineItems.some((li) => li.item_name)) {
        const items = lineItems
          .filter((li) => li.item_name)
          .map((li) => ({ estimate_id: est.id, item_name: li.item_name, rate: num(li.rate), quantity: num(li.quantity), total: num(li.rate) * num(li.quantity) }));
        const { error: liErr } = await supabase.from("line_items").insert(items);
        if (liErr) throw liErr;
      }

      setSuccess("Estimate saved successfully.");
      if (onSaved) onSaved(est);
    } catch (e) {
      setError(e.message || "Failed to save estimate.");
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    wrap: { background: COLORS.charcoal, border: `1px solid ${COLORS.border}`, fontFamily: "'Barlow', 'Helvetica Neue', sans-serif" },
    header: { padding: "20px 28px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: COLORS.white },
    tabs: { display: "flex", borderBottom: `1px solid ${COLORS.border}` },
    tab: (active, color) => ({
      flex: 1, padding: "14px 0", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: 2,
      textTransform: "uppercase", cursor: "pointer", border: "none", outline: "none",
      background: active ? COLORS.graphite : "transparent",
      color: active ? color : COLORS.mist,
      borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
      transition: "all 0.15s",
    }),
    body: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
    group: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: COLORS.mist },
    input: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, color: COLORS.white, padding: "10px 12px", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
    select: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, color: COLORS.white, padding: "10px 12px", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", cursor: "pointer", width: "100%", boxSizing: "border-box" },
    textarea: { background: COLORS.graphite, border: `1px solid ${COLORS.border}`, color: COLORS.white, padding: "10px 12px", fontSize: 13, fontFamily: "'Barlow', sans-serif", outline: "none", minHeight: 80, resize: "vertical", width: "100%", boxSizing: "border-box" },
    sectionLabel: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: COLORS.mist, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8, marginTop: 4 },
    configBox: { background: COLORS.steel, border: `1px solid ${COLORS.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
    configRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
    lineItemRow: { display: "grid", gridTemplateColumns: "1fr 120px 80px 32px", gap: 8, alignItems: "center" },
    lineItemHeader: { display: "grid", gridTemplateColumns: "1fr 120px 80px 32px", gap: 8, marginBottom: 4 },
    addBtn: { background: "none", border: `1px dashed ${COLORS.border}`, color: COLORS.mist, padding: "8px 0", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: 4 },
    removeBtn: { background: "none", border: "none", color: COLORS.mist, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 },
    summaryBox: { background: COLORS.steel, border: `1px solid ${COLORS.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 },
    summaryRow: (highlight) => ({ display: "flex", justifyContent: "space-between", fontSize: highlight ? 14 : 12, fontWeight: highlight ? 600 : 400, color: highlight ? COLORS.white : COLORS.silver, paddingTop: highlight ? 8 : 0, borderTop: highlight ? `1px solid ${COLORS.border}` : "none" }),
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderTop: `1px solid ${COLORS.border}`, gap: 12 },
    btnPrimary: (color) => ({ background: color, color: COLORS.black, border: "none", padding: "12px 28px", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }),
    btnGhost: { background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.silver, padding: "12px 24px", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" },
    statusMsg: (isErr) => ({ fontSize: 12, color: isErr ? COLORS.red : COLORS.green }),
  };

  const setR = (field) => (e) => setRetail((p) => ({ ...p, [field]: e.target.value }));
  const setI = (field) => (e) => setInsurance((p) => ({ ...p, [field]: e.target.value }));
  const setCfg = (field) => (e) => setConfig((p) => ({ ...p, [field]: e.target.value }));

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={{display:"flex",alignItems:"center",gap:20,minWidth:0}}>
          <span style={s.title}>Estimate Builder</span>
          {leadName && (
            <div style={{display:"flex",gap:16,fontSize:11,color:COLORS.mist,flexWrap:"wrap"}}>
              <span style={{color:COLORS.silver}}>{leadName}</span>
              {leadPhone && <span>{leadPhone}</span>}
              {leadEmail && <span>{leadEmail}</span>}
              {leadAddress && <span>{leadAddress}</span>}
            </div>
          )}
        </div>
        <button
          style={{...s.btnGhost, padding:"7px 16px", fontSize:10, whiteSpace:"nowrap",
            ...(preview ? {background:COLORS.gold, color:COLORS.black, border:`1px solid ${COLORS.gold}`} : {})}}
          onClick={() => setPreview(p => !p)}
        >
          {preview ? "← Builder" : "Customer Preview"}
        </button>
      </div>

      {/* ── CUSTOMER PREVIEW ── */}
      {preview && (
        <div style={{background:"#ffffff",color:"#0a0a0a",fontFamily:"'Barlow','Helvetica Neue',sans-serif",padding:"52px 56px",minHeight:480,display:"flex",flexDirection:"column"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:48}}>
            <span style={{fontFamily:"'Georgia',serif",fontSize:28,fontWeight:700,color:COLORS.gold,letterSpacing:-1,lineHeight:1}}>42</span>
            <span style={{fontSize:11,fontWeight:600,letterSpacing:5,color:"#0a0a0a",textTransform:"uppercase",paddingLeft:6}}>Exteriors</span>
          </div>

          {/* Customer & Property */}
          <div style={{marginBottom:40}}>
            <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#888",marginBottom:8}}>Prepared For</div>
            {leadName && <div style={{fontSize:22,fontWeight:500,color:"#0a0a0a",marginBottom:4}}>{leadName}</div>}
            {leadAddress && <div style={{fontSize:14,color:"#444"}}>{leadAddress}</div>}
          </div>

          {/* Divider */}
          <div style={{width:48,height:1,background:COLORS.gold,marginBottom:40}} />

          {/* Job Details */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 40px",marginBottom:48}}>
            {retail.job_type && (
              <div>
                <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#888",marginBottom:4}}>Service</div>
                <div style={{fontSize:15,fontWeight:500,color:"#0a0a0a"}}>{retail.job_type}</div>
              </div>
            )}
            {retail.material && (
              <div>
                <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#888",marginBottom:4}}>Material</div>
                <div style={{fontSize:15,fontWeight:500,color:"#0a0a0a"}}>{retail.material}</div>
              </div>
            )}
            {retail.color_style && (
              <div>
                <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#888",marginBottom:4}}>Color / Style</div>
                <div style={{fontSize:15,fontWeight:500,color:"#0a0a0a"}}>{retail.color_style}</div>
              </div>
            )}
            {retail.warranty && (
              <div>
                <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:"#888",marginBottom:4}}>Warranty</div>
                <div style={{fontSize:15,fontWeight:500,color:"#0a0a0a"}}>{retail.warranty}</div>
              </div>
            )}
          </div>

          {/* Investment */}
          <div style={{background:"#f7f5f1",padding:"32px 36px",marginBottom:"auto"}}>
            <div style={{fontSize:10,letterSpacing:4,textTransform:"uppercase",color:"#888",marginBottom:16}}>Your Investment</div>
            <div style={{fontSize:52,fontWeight:300,color:COLORS.gold,fontFamily:"'Georgia',serif",lineHeight:1,marginBottom:24}}>
              {fmt(customerPrice)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,borderTop:"1px solid #e0ddd8",paddingTop:20}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#444"}}>
                <span>Deposit Due ({config.deposit_pct}%)</span>
                <span style={{fontWeight:600,color:"#0a0a0a"}}>{fmt(depositAmt)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#444"}}>
                <span>Balance Due at Completion</span>
                <span style={{fontWeight:600,color:"#0a0a0a"}}>{fmt(customerPrice - depositAmt)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{marginTop:48,paddingTop:24,borderTop:"1px solid #e0ddd8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#aaa"}}>Licensed &amp; Insured — NJ · DE · PA · MD</div>
            <div style={{fontSize:10,color:"#aaa"}}>42exteriors.com</div>
          </div>
        </div>
      )}

      {/* Tabs + Builder (hidden in preview mode) */}
      {!preview && <>
      <div style={s.tabs}>
        <button style={s.tab(tab === "retail", COLORS.retail)} onClick={() => setTab("retail")}>Retail</button>
        <button style={s.tab(tab === "insurance", COLORS.insurance)} onClick={() => setTab("insurance")}>Insurance</button>
      </div>

      {/* ── RETAIL TAB ── */}
      {tab === "retail" && (
        <div style={s.body}>
          {/* Job Info */}
          <div style={s.sectionLabel}>Job Details</div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>Job Type</label>
              <select style={s.select} value={retail.job_type} onChange={setR("job_type")}>
                {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={s.group}>
              <label style={s.label}>Material</label>
              <select style={s.select} value={retail.material} onChange={setR("material")}>
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row3}>
            <div style={s.group}>
              <label style={s.label}>Color / Style</label>
              <input style={s.input} value={retail.color_style} onChange={setR("color_style")} placeholder="e.g. Charcoal Gray" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Squares</label>
              <input style={s.input} type="number" min="0" value={retail.squares} onChange={setR("squares")} placeholder="0" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Pitch</label>
              <select style={s.select} value={retail.pitch} onChange={setR("pitch")}>
                {PITCHES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>Warranty</label>
              <select style={s.select} value={retail.warranty} onChange={setR("warranty")}>
                {WARRANTIES.map((w) => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Internal Notes</label>
            <textarea style={s.textarea} value={retail.notes_internal} onChange={setR("notes_internal")} placeholder="Notes for internal use only..." />
          </div>

          {/* Config */}
          <div style={s.sectionLabel}>Pricing Configuration</div>
          <div style={s.configBox}>
            <div style={s.configRow}>
              <div style={s.group}>
                <label style={s.label}>Markup %</label>
                <input style={s.input} type="number" min="0" value={config.markup_pct} onChange={setCfg("markup_pct")} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Deposit %</label>
                <input style={s.input} type="number" min="0" value={config.deposit_pct} onChange={setCfg("deposit_pct")} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Steep Surcharge %</label>
                <input style={s.input} type="number" min="0" value={config.steep_surcharge_pct} onChange={setCfg("steep_surcharge_pct")} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.mist }}>
              Steep surcharge applies automatically for Steep (7–9/12) and Very Steep (10+/12) pitches.
            </div>
          </div>

          {/* Line Items */}
          <div style={s.sectionLabel}>Line Items</div>
          <div style={s.lineItemHeader}>
            <span style={{ ...s.label }}>Item</span>
            <span style={{ ...s.label }}>Rate ($)</span>
            <span style={{ ...s.label }}>Qty</span>
            <span />
          </div>
          {lineItems.map((li, idx) => (
            <div key={idx} style={s.lineItemRow}>
              <input style={s.input} value={li.item_name} onChange={(e) => setItem(idx, "item_name", e.target.value)} placeholder="e.g. Remove & Replace Shingles" />
              <input style={s.input} type="number" min="0" value={li.rate} onChange={(e) => setItem(idx, "rate", e.target.value)} placeholder="0.00" />
              <input style={s.input} type="number" min="1" value={li.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} />
              <button style={s.removeBtn} onClick={() => removeItem(idx)} title="Remove">×</button>
            </div>
          ))}
          <button style={s.addBtn} onClick={addItem}>+ Add Line Item</button>

          {/* Summary */}
          <div style={s.sectionLabel}>Price Summary</div>
          <div style={s.summaryBox}>
            <div style={s.summaryRow(false)}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {isSteep && (
              <div style={s.summaryRow(false)}>
                <span>Steep Surcharge ({config.steep_surcharge_pct}%)</span><span>{fmt(steepSurcharge)}</span>
              </div>
            )}
            <div style={s.summaryRow(false)}>
              <span>Markup ({config.markup_pct}%)</span><span>{fmt(markupAmt)}</span>
            </div>
            <div style={s.summaryRow(true)}>
              <span>Customer Price</span><span style={{ color: COLORS.goldLight }}>{fmt(customerPrice)}</span>
            </div>
            <div style={s.summaryRow(false)}>
              <span>Deposit Due ({config.deposit_pct}%)</span><span>{fmt(depositAmt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INSURANCE TAB ── */}
      {tab === "insurance" && (
        <div style={s.body}>
          <div style={s.sectionLabel}>Claim Information</div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>Insurance Company</label>
              <input style={s.input} value={insurance.insurance_company} onChange={setI("insurance_company")} placeholder="State Farm, Allstate..." />
            </div>
            <div style={s.group}>
              <label style={s.label}>Claim Number</label>
              <input style={s.input} value={insurance.claim_number} onChange={setI("claim_number")} placeholder="Claim #" />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>Adjuster Name</label>
              <input style={s.input} value={insurance.adjuster_name} onChange={setI("adjuster_name")} placeholder="First Last" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Date of Loss</label>
              <input style={{ ...s.input, colorScheme: "dark" }} type="date" value={insurance.date_of_loss} onChange={setI("date_of_loss")} />
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Damage Type</label>
            <select style={s.select} value={insurance.damage_type} onChange={setI("damage_type")}>
              {DAMAGE_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div style={s.sectionLabel}>Settlement Figures</div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>RCV ($)</label>
              <input style={s.input} type="number" min="0" value={insurance.rcv} onChange={setI("rcv")} placeholder="0.00" />
            </div>
            <div style={s.group}>
              <label style={s.label}>ACV ($)</label>
              <input style={s.input} type="number" min="0" value={insurance.acv} onChange={setI("acv")} placeholder="0.00" />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>Deductible ($)</label>
              <input style={s.input} type="number" min="0" value={insurance.deductible} onChange={setI("deductible")} placeholder="0.00" />
            </div>
            <div style={s.group}>
              <label style={s.label}>Recoverable Depreciation ($)</label>
              <input
                style={{ ...s.input, color: COLORS.mist }}
                type="number"
                readOnly
                value={recoverableDepr > 0 ? recoverableDepr.toFixed(2) : ""}
                placeholder="Auto-calculated (RCV − ACV)"
              />
            </div>
          </div>

          {/* Insurance summary */}
          {(num(insurance.rcv) > 0 || num(insurance.acv) > 0) && (
            <>
              <div style={s.sectionLabel}>Payout Summary</div>
              <div style={s.summaryBox}>
                <div style={s.summaryRow(false)}><span>RCV</span><span>{fmt(num(insurance.rcv))}</span></div>
                <div style={s.summaryRow(false)}><span>Deductible</span><span>− {fmt(num(insurance.deductible))}</span></div>
                <div style={s.summaryRow(false)}><span>ACV (Initial Check)</span><span>{fmt(num(insurance.acv))}</span></div>
                <div style={s.summaryRow(false)}><span>Recoverable Depreciation</span><span>{fmt(recoverableDepr > 0 ? recoverableDepr : 0)}</span></div>
                <div style={s.summaryRow(true)}>
                  <span>Net After Deductible</span>
                  <span style={{ color: COLORS.goldLight }}>{fmt(Math.max(0, num(insurance.rcv) - num(insurance.deductible)))}</span>
                </div>
              </div>
            </>
          )}

          <div style={s.group}>
            <label style={s.label}>Scope Notes</label>
            <textarea style={s.textarea} value={insurance.scope_notes} onChange={setI("scope_notes")} placeholder="Scope of work, supplemental items, notes from adjuster meeting..." />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={s.footer}>
        <div>
          {error && <span style={s.statusMsg(true)}>{error}</span>}
          {success && <span style={s.statusMsg(false)}>{success}</span>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.btnGhost} onClick={() => { setRetail(emptyRetail); setInsurance(emptyInsurance); setLineItems([emptyItem()]); setConfig(emptyConfig); setError(""); setSuccess(""); }}>
            Reset
          </button>
          <button
            style={s.btnPrimary(tab === "retail" ? COLORS.retail : COLORS.insurance)}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Estimate →"}
          </button>
        </div>
      </div>
      </>}
    </div>
  );
}
