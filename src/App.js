import { useState, useMemo, useEffect } from "react";
import MapView from "./MapView";
import { supabase } from "./supabase";
const CHECKLIST = [
  { id: "view", label: "Great View", icon: "🌄" },
  { id: "privacy", label: "Private / Secluded", icon: "🔒" },
  { id: "nocops", label: "Low Cop Activity", icon: "✅" },
  { id: "clean", label: "Clean Area", icon: "🧹" },
  { id: "accessible", label: "Easy to Access", icon: "🚗" },
  { id: "nighttime", label: "Good at Night", icon: "🌙" },
  { id: "cellsignal", label: "Has Cell Signal", icon: "📶" },
  { id: "parking", label: "Easy Parking", icon: "🅿️" },
];



const scoreSpot = (checks) => Object.values(checks).filter(Boolean).length;

const VIEWS = { MAP: "map", STATE: "state", CITY: "city", SPOT: "spot", ADD: "add" };

const EMPTY_FORM = {
  name: "", state: "", city: "", notes: "",
  lat: null, lng: null,
  checks: Object.fromEntries(CHECKLIST.map(c => [c.id, false])),
};

export default function App() {
const [spots, setSpots] = useState([]);
const [, setLoading] = useState(true);

useEffect(() => {
  fetchSpots();
}, []);

const fetchSpots = async () => {
  const { data } = await supabase
    .from("spots")
    .select("*")
    .order("votes", { ascending: false });
  if (data) setSpots(data.map(s => ({
    ...s,
    checks: {
      view: s.view, privacy: s.privacy, nocops: s.nocops,
      clean: s.clean, accessible: s.accessible, nighttime: s.nighttime,
      cellsignal: s.cellsignal, parking: s.parking,
    }
  })));
  setLoading(false);
};
  const [view, setView] = useState(VIEWS.STATE);
  const [selected, setSelected] = useState({ state: null, city: null, spot: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");

  const states = useMemo(() => {
    const map = {};
    spots.forEach(s => {
      if (!map[s.state]) map[s.state] = [];
      map[s.state].push(s);
    });
    return Object.entries(map)
      .map(([name, ss]) => ({ name, spots: ss, score: ss.reduce((a, s) => a + s.votes, 0), count: ss.length }))
      .sort((a, b) => b.score - a.score);
  }, [spots]);

  const citiesInState = useMemo(() => {
    if (!selected.state) return [];
    const map = {};
    spots.filter(s => s.state === selected.state).forEach(s => {
      if (!map[s.city]) map[s.city] = [];
      map[s.city].push(s);
    });
    return Object.entries(map)
      .map(([name, ss]) => ({ name, spots: ss, score: ss.reduce((a, s) => a + s.votes, 0), count: ss.length }))
      .sort((a, b) => b.score - a.score);
  }, [spots, selected.state]);

  const spotsInCity = useMemo(() => {
    if (!selected.city) return [];
    return spots
      .filter(s => s.state === selected.state && s.city === selected.city)
      .sort((a, b) => b.votes - a.votes);
  }, [spots, selected.state, selected.city]);

  const filteredSpots = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return spots.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q)
    );
  }, [spots, search]);

  const submitSpot = async () => {
  if (!form.name || !form.state || !form.city) return;
  const { data } = await supabase
    .from("spots")
    .insert([{
      name: form.name,
      state: form.state,
      city: form.city,
      notes: form.notes,
      lat: form.lat || 0,
      lng: form.lng || 0,
      votes: 1,
      view: form.checks.view,
      privacy: form.checks.privacy,
      nocops: form.checks.nocops,
      clean: form.checks.clean,
      accessible: form.checks.accessible,
      nighttime: form.checks.nighttime,
      cellsignal: form.checks.cellsignal,
      parking: form.checks.parking,
    }])
    .select();
  if (data) {
    fetchSpots();
    setForm(EMPTY_FORM);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setView(VIEWS.STATE); }, 2000);
  }
};
const upvote = async (id) => {
  const ipRes = await fetch("https://api.ipify.org?format=json");
  const { ip } = await ipRes.json();
  
  const { error } = await supabase
    .from("votes")
    .insert([{ spot_id: id, ip_address: ip }]);
  
  if (error) {
    alert("You already voted for this spot!");
    return;
  }
  
  const spot = spots.find(s => s.id === id);
  await supabase
    .from("spots")
    .update({ votes: spot.votes + 1 })
    .eq("id", id);
  
  fetchSpots();
};

  const ScoreBar = ({ score, max = 8 }) => (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: 2,
          background: i < score ? "#f97316" : "rgba(255,255,255,0.1)",
          transition: "background 0.2s",
        }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 11, color: "#f97316", fontWeight: 700 }}>{score}/{max}</span>
    </div>
  );

  const Badge = ({ children, color = "#f97316" }) => (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );

  const BackBtn = ({ label, onClick }) => (
    <button onClick={onClick} style={{
      background: "none", border: "1px solid rgba(255,255,255,0.15)",
      color: "#aaa", borderRadius: 8, padding: "6px 14px", cursor: "pointer",
      fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
    }}>← {label}</button>
  );

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "16px 18px", cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: 10,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Courier New', monospace",
      color: "#e8e8e8",
      fontSize: "16px",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(10px)",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🗺️</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#f97316" }}>NUTNAV</div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 3 }}>CROWD-SOURCED LOCATIONS</div>
            <a href="https://github.com/Dellybo/Nutnav" target="_blank" rel="noreferrer" style={{ fontSize: 9, color: "#555", letterSpacing: 1, textDecoration: "none" }}>
  github.com/Dellybo/Nutnav
</a>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView(VIEWS.STATE)} style={{
            background: view === VIEWS.STATE ? "#f9731620" : "none",
            border: `1px solid ${view === VIEWS.STATE ? "#f97316" : "rgba(255,255,255,0.1)"}`,
            color: view === VIEWS.STATE ? "#f97316" : "#888",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11,
          }}>BROWSE</button>
          <button onClick={() => setView(VIEWS.ADD)} style={{
            background: view === VIEWS.ADD ? "#f9731620" : "none",
            border: `1px solid ${view === VIEWS.ADD ? "#f97316" : "rgba(255,255,255,0.1)"}`,
            color: view === VIEWS.ADD ? "#f97316" : "#888",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11,
          }}>+ ADD SPOT</button>
        </div>
      </div>
{view !== VIEWS.ADD && (
  <div style={{ margin: "0" }}>
    <MapView 
  spots={spots} 
  onMapClick={(lat, lng) => console.log(lat, lng)}
  focusSpot={selected.spot ? spots.find(s => s.id === selected.spot) : null}
/>
  </div>
)}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {/* Search */}
        {view !== VIEWS.ADD && (
          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="🔍  Search spots, cities, states..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "10px 14px",
                color: "#e8e8e8", fontSize: 13, outline: "none",
                fontFamily: "'Courier New', monospace",
              }}
            />
            {search && filteredSpots.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: 2 }}>SEARCH RESULTS</div>
                {filteredSpots.map(s => (
                  <div key={s.id} style={cardStyle} onClick={() => {
                    setSelected({ state: s.state, city: s.city, spot: s.id });
                    setSearch("");
                    setView(VIEWS.SPOT);
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.city}, {s.state}</div>
                    <div style={{ marginTop: 8 }}><ScoreBar score={scoreSpot(s.checks)} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATE VIEW */}
        {view === VIEWS.STATE && !search && (
          <>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 16, letterSpacing: 3 }}>
              TOP STATES — {states.length} RANKED
            </div>
            {states.map((st, i) => (
              <div key={st.name} style={{
                ...cardStyle,
                borderLeft: i === 0 ? "3px solid #f97316" : "1px solid rgba(255,255,255,0.08)",
              }} onClick={() => { setSelected({ state: st.name, city: null, spot: null }); setView(VIEWS.CITY); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, color: i === 0 ? "#f97316" : "#555", fontWeight: 900 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{st.count} spot{st.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#f97316" }}>{st.score}</div>
                    <div style={{ fontSize: 9, color: "#555" }}>TOTAL VOTES</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* CITY VIEW */}
        {view === VIEWS.CITY && (
          <>
            <BackBtn label="All States" onClick={() => setView(VIEWS.STATE)} />
            <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 900 }}>{selected.state}</div>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 16, letterSpacing: 3 }}>
              TOP CITIES — {citiesInState.length} WITH SPOTS
            </div>
            {citiesInState.map((ct, i) => (
              <div key={ct.name} style={{
                ...cardStyle,
                borderLeft: i === 0 ? "3px solid #f97316" : "1px solid rgba(255,255,255,0.08)",
              }} onClick={() => { setSelected(prev => ({ ...prev, city: ct.name })); setView(VIEWS.SPOT); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, color: i === 0 ? "#f97316" : "#555", fontWeight: 900 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{ct.name}</div>
                      <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{ct.count} spot{ct.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#f97316" }}>{ct.score}</div>
                    <div style={{ fontSize: 9, color: "#555" }}>TOTAL VOTES</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* SPOT LIST VIEW */}
        {view === VIEWS.SPOT && !selected.spot && (
          <>
            <BackBtn label={selected.state} onClick={() => { setSelected(prev => ({ ...prev, city: null })); setView(VIEWS.CITY); }} />
            <div style={{ marginBottom: 4, fontSize: 20, fontWeight: 900 }}>{selected.city}</div>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 16, letterSpacing: 3 }}>
              {spotsInCity.length} SPOTS RANKED
            </div>
            {spotsInCity.map((s, i) => (
              <div key={s.id} style={{
                ...cardStyle,
                borderLeft: i === 0 ? "3px solid #f97316" : "1px solid rgba(255,255,255,0.08)",
              }} onClick={() => setSelected(prev => ({ ...prev, spot: s.id }))}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, color: i === 0 ? "#f97316" : "#555", fontWeight: 900 }}>#{i + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                    </div>
                    <div style={{ marginTop: 8 }}><ScoreBar score={scoreSpot(s.checks)} /></div>
                    <div style={{ fontSize: 11, color: "#777", marginTop: 6 }}>{s.notes}</div>
                  </div>
                  <div style={{ marginLeft: 12, textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{s.votes}</div>
                    <div style={{ fontSize: 9, color: "#555" }}>VOTES</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* INDIVIDUAL SPOT VIEW */}
        {view === VIEWS.SPOT && selected.spot && (() => {
          const spot = spots.find(s => s.id === selected.spot);
          if (!spot) return null;
          return (
            <>
              <BackBtn label={selected.city} onClick={() => setSelected(prev => ({ ...prev, spot: null }))} />
              <div style={{
                background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 16, padding: "20px",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{spot.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>{spot.city}, {spot.state}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <Badge>{spot.votes} votes</Badge>
                  <Badge color="#22c55e">{scoreSpot(spot.checks)}/8 score</Badge>
                </div>

                <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>
                  "{spot.notes}"
                </div>

                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 12 }}>CHECKLIST</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {CHECKLIST.map(c => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 8,
                      background: spot.checks[c.id] ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${spot.checks[c.id] ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      <span>{c.icon}</span>
                      <span style={{ fontSize: 11, color: spot.checks[c.id] ? "#22c55e" : "#555" }}>{c.label}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => upvote(spot.id)} style={{
                  width: "100%", padding: "12px",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  border: "none", borderRadius: 10, color: "white",
                  fontWeight: 900, fontSize: 14, cursor: "pointer",
                  fontFamily: "'Courier New', monospace", letterSpacing: 1,
                }}>
                  👍 UPVOTE THIS SPOT ({spot.votes})
                </button>
              </div>
            </>
          );
        })()}

        {/* ADD SPOT VIEW */}
        {view === VIEWS.ADD && (
          <>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 20 }}>SUBMIT A NEW SPOT</div>

            {submitted ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 16,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 900, color: "#22c55e", fontSize: 16 }}>SPOT ADDED!</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>Redirecting...</div>
              </div>
            ) : (
<>
    <div style={{ marginBottom: 16, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize: 10, color: "#f97316", letterSpacing: 2, padding: "8px 12px", background: "rgba(249,115,22,0.1)" }}>
        {form.lat ? `📍 PIN DROPPED — ${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : "📍 CLICK MAP TO DROP A PIN"}
      </div>
      <MapView
        spots={[]}
        isPinMode={true}
        pinnedLocation={form.lat ? { lat: form.lat, lng: form.lng } : null}
        onMapClick={(lat, lng) => setForm(prev => ({ ...prev, lat, lng }))}
      />
    </div>
                {[
                  { key: "name", label: "Spot Name", placeholder: "e.g. Mulholland Overlook" },
                  { key: "state", label: "State", placeholder: "e.g. California" },
                  { key: "city", label: "City / Area", placeholder: "e.g. Los Angeles" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 6 }}>{f.label}</div>
                    <input
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, padding: "10px 12px",
                        color: "#e8e8e8", fontSize: 13, outline: "none",
                        fontFamily: "'Courier New', monospace",
                      }}
                    />
                  </div>
                ))}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 6 }}>NOTES</div>
                  <textarea
                    placeholder="Share what makes this spot great, what to watch out for, best times to go..."
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8, padding: "10px 12px",
                      color: "#e8e8e8", fontSize: 13, outline: "none", resize: "vertical",
                      fontFamily: "'Courier New', monospace",
                    }}
                  />
                </div>

                <div style={{ fontSize: 10, color: "#666", letterSpacing: 2, marginBottom: 12 }}>CHECKLIST — CHECK ALL THAT APPLY</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                  {CHECKLIST.map(c => (
                    <div key={c.id} onClick={() => setForm(prev => ({
                      ...prev, checks: { ...prev.checks, [c.id]: !prev.checks[c.id] }
                    }))} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: form.checks[c.id] ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${form.checks[c.id] ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.07)"}`,
                      transition: "all 0.15s",
                    }}>
                      <span>{c.icon}</span>
                      <span style={{ fontSize: 11, color: form.checks[c.id] ? "#f97316" : "#666" }}>{c.label}</span>
                    </div>
                  ))}
                </div>

                <button onClick={submitSpot} style={{
                  width: "100%", padding: "14px",
                  background: form.name && form.state && form.city
                    ? "linear-gradient(135deg, #f97316, #ea580c)"
                    : "rgba(255,255,255,0.05)",
                  border: "none", borderRadius: 10,
                  color: form.name && form.state && form.city ? "white" : "#555",
                  fontWeight: 900, fontSize: 14, cursor: form.name && form.state && form.city ? "pointer" : "default",
                  fontFamily: "'Courier New', monospace", letterSpacing: 1,
                }}>
                  SUBMIT SPOT
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}