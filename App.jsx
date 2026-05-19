import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

const PLANS = [
  { id: "basic", name: "Seasonal Basic", price: 299, period: "/ season", color: "#5a8c52", features: ["Spring open-up checklist", "Fall winterization checklist", "2 maintenance visits/year", "Email support"] },
  { id: "standard", name: "Standard Care", price: 89, period: "/ month", color: "#2a6ea6", features: ["Everything in Basic", "Monthly property inspections", "Unlimited maintenance requests", "Priority scheduling", "Phone & email support"], popular: true },
  { id: "premium", name: "Premium Concierge", price: 179, period: "/ month", color: "#8b4513", features: ["Everything in Standard", "24/7 emergency response", "Quarterly deep clean", "Vendor coordination", "Dedicated property manager"] },
];
const STAFF = ["Dale Krueger", "Maria Santos", "Josh Tillman", "Erin Olson"];
const ADMIN_EMAILS = ["admin@northwoodsps.com", "admin@test.com"];
const statusColors = {
  active: { bg: "#e6f4ea", text: "#1e7e34" }, seasonal: { bg: "#fff4e0", text: "#b35c00" }, inactive: { bg: "#f0f0f0", text: "#666" },
  completed: { bg: "#e6f4ea", text: "#1e7e34" }, "in-progress": { bg: "#e8f0fe", text: "#1a5cb5" }, pending: { bg: "#fff4e0", text: "#b35c00" },
};
const priorityColors = { high: "#c0392b", medium: "#e67e22", low: "#27ae60" };
const inputStyle = { padding: "9px 12px", borderRadius: 6, border: "1px solid #d0c8bc", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "'Georgia', serif", background: "#fff" };
function btnStyle(v = "primary") { return { padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: "600", background: v === "primary" ? "#3a6e33" : "#e8e0d0", color: v === "primary" ? "#fff" : "#2c2416" }; }
function tag(status) { const s = statusColors[status] || { bg: "#f0f0f0", text: "#666" }; return { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: "600", background: s.bg, color: s.text }; }
const card = { background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e8e0d0" };
const cardTitle = { fontWeight: "bold", marginBottom: 14, fontSize: 15, color: "#1c2b1a" };
const pageTitle = { fontSize: 26, fontWeight: "bold", color: "#1c2b1a", marginBottom: 6, fontFamily: "'Georgia', serif" };
const subtitle = { fontSize: 13, color: "#7a6a52", marginBottom: 28, fontStyle: "italic" };
const tdStyle = { padding: "12px 12px", borderBottom: "1px solid #f0ece4", verticalAlign: "middle" };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modalBox = { background: "#fff", borderRadius: 12, padding: 32, width: 480, maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" };

function Field({ label, children, error }) {
  return <div><div style={{ fontSize: 11, color: "#7a6a52", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>{children}{error && <div style={{ fontSize: 11, color: "#c0392b", marginTop: 3 }}>{error}</div>}</div>;
}
function ProfileRow({ label, value }) {
  return <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid #f0ece4", fontSize: 14 }}><div style={{ width: 110, color: "#7a6a52", flexShrink: 0 }}>{label}</div><div style={{ fontWeight: 600 }}>{value}</div></div>;
}
function StatCard({ num, label, color }) {
  return <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}` }}><div style={{ fontSize: 32, fontWeight: "bold", color: "#1c2b1a" }}>{num}</div><div style={{ fontSize: 12, color: "#7a6a52", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div></div>;
}
function PriorityDot({ p }) { return <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColors[p], display: "inline-block", marginRight: 6 }} />; }
function Spinner() { return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 16, color: "#7a6a52", fontFamily: "'Georgia', serif" }}>Loading… 🌲</div>; }
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("home");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  }, [session]);

  if (session === undefined) return <Spinner />;
  const isAdmin = session && ADMIN_EMAILS.includes(session.user.email);
  if (session && isAdmin) return <AdminApp session={session} onBack={() => supabase.auth.signOut()} />;
  if (session && !isAdmin) return <ClientPortal session={session} profile={profile} setProfile={setProfile} onLogout={() => supabase.auth.signOut()} />;
  if (mode === "admin-login") return <AdminLogin onBack={() => setMode("home")} />;
  if (mode === "client-login") return <ClientLogin onRegister={() => setMode("client-register")} onBack={() => setMode("home")} />;
  if (mode === "client-register") return <ClientRegister onBack={() => setMode("client-login")} />;
  return <HomePage onAdmin={() => setMode("admin-login")} onClient={() => setMode("client-login")} />;
}

function HomePage({ onAdmin, onClient }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f1f0d 0%, #1c3318 45%, #2a4a22 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 560 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.25em", color: "#7ab870", textTransform: "uppercase", marginBottom: 16 }}>Wisconsin Northwoods</div>
        <div style={{ fontSize: 52, fontWeight: "bold", color: "#e8f4e4", lineHeight: 1.1, marginBottom: 14 }}>Northwoods Property Services</div>
        <div style={{ fontSize: 16, color: "#9ab894", fontStyle: "italic", marginBottom: 52 }}>Vacation home maintenance you can trust — from opener to close.</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={onClient} style={{ padding: "15px 38px", borderRadius: 8, border: "none", cursor: "pointer", background: "#4a8e42", color: "#fff", fontSize: 15, fontWeight: "bold" }}>Client Portal →</button>
          <button onClick={onAdmin} style={{ padding: "15px 38px", borderRadius: 8, border: "2px solid #4a6e44", cursor: "pointer", background: "transparent", color: "#9ab894", fontSize: 15, fontWeight: "bold" }}>Staff Login</button>
        </div>
        <div style={{ marginTop: 52, display: "flex", gap: 32, justifyContent: "center", color: "#5a7a54", fontSize: 13 }}>
          <span>🌲 Serving since 2011</span><span>🏠 120+ properties</span><span>⭐ 4.9 rating</span>
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 40, width: 380, boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#1c2b1a", marginBottom: 4 }}>Staff Login</div>
        <div style={{ fontSize: 13, color: "#7a6a52", marginBottom: 28, fontStyle: "italic" }}>Northwoods Property Services</div>
        {error && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gap: 14 }}>
          <input style={inputStyle} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <input style={inputStyle} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button style={{ ...btnStyle("primary"), padding: "11px 18px" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </div>
      </div>
    </div>
  );
}

function ClientLogin({ onRegister, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 40, width: 380, boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#1c2b1a", marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: "#7a6a52", marginBottom: 28, fontStyle: "italic" }}>Sign in to your client portal</div>
        {error && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gap: 14 }}>
          <input style={inputStyle} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <input style={inputStyle} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button style={{ ...btnStyle("primary"), padding: "11px 18px" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7a6a52" }}>New client? <span onClick={onRegister} style={{ color: "#3a6e33", cursor: "pointer", fontWeight: "bold" }}>Create an account</span></div>
      </div>
    </div>
  );
}
function ClientRegister({ onBack }) {
  const [step, setStep] = useState(1);
  const [profile, setProfileData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [prop, setProp] = useState({ name: "", address: "", type: "Cabin", notes: "" });
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [payment, setPayment] = useState({ cardNumber: "", expiry: "", cvv: "", name: "" });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function validateProfile() {
    const e = {};
    if (!profile.firstName) e.firstName = "Required";
    if (!profile.lastName) e.lastName = "Required";
    if (!profile.email || !profile.email.includes("@")) e.email = "Valid email required";
    if (!profile.password || profile.password.length < 6) e.password = "Min 6 characters";
    if (profile.password !== profile.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e); return Object.keys(e).length === 0;
  }
  function validateProperty() {
    const e = {};
    if (!prop.name) e.propName = "Required";
    if (!prop.address) e.propAddress = "Required";
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handlePay() {
    if (!payment.cardNumber || !payment.expiry || !payment.cvv || !payment.name) { setErrors({ payment: "Please fill in all card fields." }); return; }
    setProcessing(true); setErrorMsg("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: profile.email, password: profile.password });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Please check your email to confirm your account, then log in.");
const userId = authData.user.id;
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId, first_name: profile.firstName, last_name: profile.lastName,
        phone: profile.phone, subscription: selectedPlan, subscription_status: "active",
        payment_last4: payment.cardNumber.replace(/\s/g, "").slice(-4),
        payment_brand: "Visa", payment_expiry: payment.expiry,
      });
      if (profileError) throw new Error(profileError.message);
      const { error: propError } = await supabase.from("properties").insert({
        owner_id: userId, name: prop.name, address: prop.address,
        type: prop.type, notes: prop.notes, status: "active",
        email: profile.email, phone: profile.phone,
      });
      if (propError) throw new Error(propError.message);
    } catch (err) {
      setErrorMsg(err.message);
      setProcessing(false);
    }
  }

  const steps = ["Your Profile", "Your Property", "Choose a Plan", "Payment"];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 40, width: 520, maxWidth: "100%", boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back to login</button>
        <div style={{ display: "flex", marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i + 1 <= step ? "#3a6e33" : "#e0d8cc", color: i + 1 <= step ? "#fff" : "#aaa", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>{i + 1}</div>
              <div style={{ fontSize: 10, color: i + 1 === step ? "#3a6e33" : "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Create Your Account</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="First Name" error={errors.firstName}><input style={inputStyle} value={profile.firstName} onChange={e => setProfileData({ ...profile, firstName: e.target.value })} /></Field>
              <Field label="Last Name" error={errors.lastName}><input style={inputStyle} value={profile.lastName} onChange={e => setProfileData({ ...profile, lastName: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <Field label="Email Address" error={errors.email}><input style={inputStyle} type="email" value={profile.email} onChange={e => setProfileData({ ...profile, email: e.target.value })} /></Field>
              <Field label="Phone Number"><input style={inputStyle} type="tel" value={profile.phone} onChange={e => setProfileData({ ...profile, phone: e.target.value })} /></Field>
              <Field label="Password" error={errors.password}><input style={inputStyle} type="password" value={profile.password} onChange={e => setProfileData({ ...profile, password: e.target.value })} /></Field>
              <Field label="Confirm Password" error={errors.confirmPassword}><input style={inputStyle} type="password" value={profile.confirmPassword} onChange={e => setProfileData({ ...profile, confirmPassword: e.target.value })} /></Field>
            </div>
            <button style={{ ...btnStyle("primary"), marginTop: 24, width: "100%", padding: "11px" }} onClick={() => validateProfile() && setStep(2)}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Register Your Property</div>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Property Name" error={errors.propName}><input style={inputStyle} placeholder="e.g. Lakeview Cabin" value={prop.name} onChange={e => setProp({ ...prop, name: e.target.value })} /></Field>
              <Field label="Full Address" error={errors.propAddress}><input style={inputStyle} placeholder="Street, City, WI" value={prop.address} onChange={e => setProp({ ...prop, address: e.target.value })} /></Field>
              <Field label="Property Type"><select style={inputStyle} value={prop.type} onChange={e => setProp({ ...prop, type: e.target.value })}>{["Cabin", "Cottage", "Lodge", "Home", "Condo"].map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Access Notes (optional)"><textarea style={{ ...inputStyle, height: 64, resize: "vertical" }} placeholder="Key location, gate code…" value={prop.notes} onChange={e => setProp({ ...prop, notes: e.target.value })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={() => validateProperty() && setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Choose Your Plan</div>
            <div style={{ display: "grid", gap: 12 }}>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{ border: `2px solid ${selectedPlan === plan.id ? plan.color : "#e0d8cc"}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer", background: selectedPlan === plan.id ? "#f9fdf8" : "#fff", position: "relative" }}>
                  {plan.popular && <div style={{ position: "absolute", top: -10, right: 14, background: "#3a6e33", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: "bold" }}>MOST POPULAR</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: 15, color: plan.color }}>{plan.name}</div>
                    <div><span style={{ fontSize: 20, fontWeight: "bold", color: "#1c2b1a" }}>${plan.price}</span><span style={{ fontSize: 12, color: "#7a6a52" }}>{plan.period}</span></div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>{plan.features.map(f => <span key={f} style={{ fontSize: 11, color: "#5a4a32" }}>✓ {f}</span>)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 4 && !processing && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Payment Details</div>
            <div style={{ background: "#f5f1eb", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              <span style={{ color: "#7a6a52" }}>Selected: </span><b>{PLANS.find(p => p.id === selectedPlan)?.name}</b>
              <span style={{ color: "#3a6e33", marginLeft: 8, fontWeight: "bold" }}>${PLANS.find(p => p.id === selectedPlan)?.price}{PLANS.find(p => p.id === selectedPlan)?.period}</span>
            </div>
            {errors.payment && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{errors.payment}</div>}
            {errorMsg && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{errorMsg}</div>}
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Name on Card"><input style={inputStyle} placeholder="Your Name" value={payment.name} onChange={e => setPayment({ ...payment, name: e.target.value })} /></Field>
              <Field label="Card Number"><input style={inputStyle} placeholder="4242 4242 4242 4242" maxLength={19} value={payment.cardNumber} onChange={e => setPayment({ ...payment, cardNumber: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() })} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Expiry"><input style={inputStyle} placeholder="MM/YY" maxLength={5} value={payment.expiry} onChange={e => setPayment({ ...payment, expiry: e.target.value })} /></Field>
                <Field label="CVV"><input style={inputStyle} placeholder="123" maxLength={4} value={payment.cvv} onChange={e => setPayment({ ...payment, cvv: e.target.value })} /></Field>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#7a6a52", marginTop: 12 }}>🔒 Secure payment — card info is never stored</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setStep(3)}>← Back</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={handlePay}>Pay & Activate Account</button>
            </div>
          </div>
        )}

        {processing && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌲</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#3a6e33", marginBottom: 8 }}>Setting up your account…</div>
            <div style={{ fontSize: 13, color: "#7a6a52" }}>Welcome to Northwoods Property Services!</div>
          </div>
        )}
      </div>
    </div>
  );
}
function ClientPortal({ session, profile, setProfile, onLogout }) {
  const [portalView, setPortalView] = useState("overview");
  const [properties, setProperties] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newRequest, setNewRequest] = useState({ propertyId: "", title: "", description: "", priority: "medium", preferredDate: "" });
  const [profileEdit, setProfileEdit] = useState({ firstName: profile?.first_name || "", lastName: profile?.last_name || "", phone: profile?.phone || "" });
  const [loading, setLoading] = useState(true);
  const userId = session.user.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: props } = await supabase.from("properties").select("*").eq("owner_id", userId);
    setProperties(props || []);
    if (props?.length) {
      const propIds = props.map(p => p.id);
      const { data: wos } = await supabase.from("work_orders").select("*").in("property_id", propIds).order("created_at", { ascending: false });
      setWorkOrders(wos || []);
    }
    const { data: msgs } = await supabase.from("messages").select("*").eq("client_id", userId).order("created_at", { ascending: true });
    setMessages(msgs || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const myPlan = PLANS.find(p => p.id === profile?.subscription) || PLANS[0];
  const unreadCount = messages.filter(m => m.from_role === "admin" && !m.read).length;

  async function submitRequest() {
    if (!newRequest.title || !newRequest.propertyId) return;
    await supabase.from("work_orders").insert({
      property_id: newRequest.propertyId, title: newRequest.title, notes: newRequest.description,
      priority: newRequest.priority, status: "pending", submitted_by: "client",
      date: newRequest.preferredDate || new Date().toISOString().split("T")[0],
    });
    setShowNewRequest(false);
    setNewRequest({ propertyId: "", title: "", description: "", priority: "medium", preferredDate: "" });
    loadData();
  }

  async function saveProfile() {
    await supabase.from("profiles").update({ first_name: profileEdit.firstName, last_name: profileEdit.lastName, phone: profileEdit.phone }).eq("id", userId);
    setProfile(prev => ({ ...prev, first_name: profileEdit.firstName, last_name: profileEdit.lastName, phone: profileEdit.phone }));
    setShowEditProfile(false);
  }

  async function changePlan(planId) {
    await supabase.from("profiles").update({ subscription: planId }).eq("id", userId);
    setProfile(prev => ({ ...prev, subscription: planId }));
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    await supabase.from("messages").insert({ client_id: userId, from_role: "client", text: text.trim(), read: false });
    loadData();
  }

  async function markMessagesRead() {
    await supabase.from("messages").update({ read: true }).eq("client_id", userId).eq("from_role", "admin");
    loadData();
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "requests", label: "My Requests", icon: "🔧" },
    { id: "messages", label: "Messages", icon: "💬", badge: unreadCount },
    { id: "subscription", label: "Subscription", icon: "⭐" },
    { id: "profile", label: "My Profile", icon: "👤" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f1eb", minHeight: "100vh", color: "#2c2416" }}>
      <div style={{ width: 220, background: "#1c3a2a", minHeight: "100vh", position: "fixed", top: 0, left: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #2a4a38" }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#a8d4b8", lineHeight: 1.3 }}>Northwoods Property Services</div>
          <div style={{ fontSize: 11, color: "#6a9878", marginTop: 4, fontStyle: "italic" }}>Client Portal</div>
        </div>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a4a38", background: "#162e20" }}>
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#c8e6d0" }}>{profile?.first_name} {profile?.last_name}</div>
          <div style={{ fontSize: 11, color: "#5a8a6a", marginTop: 2 }}>{myPlan?.name}</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setPortalView(item.id); if (item.id === "messages") markMessagesRead(); }} style={{ padding: "10px 20px", cursor: "pointer", fontSize: 14, color: portalView === item.id ? "#c8e6c0" : "#8aaa84", background: portalView === item.id ? "#2a4a36" : "transparent", borderLeft: portalView === item.id ? "3px solid #5a9e6a" : "3px solid transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{item.icon}</span>{item.label}
              {item.badge > 0 && <span style={{ marginLeft: "auto", background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: "bold", padding: "1px 7px" }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: 20 }}>
          <button onClick={onLogout} style={{ width: "100%", padding: 8, background: "transparent", border: "1px solid #3a5a44", borderRadius: 6, color: "#7a9a80", cursor: "pointer", fontSize: 12 }}>Sign Out</button>
        </div>
      </div>

      <div style={{ marginLeft: 220, padding: "32px 40px", maxWidth: 900 }}>
        {portalView === "overview" && (
          <div>
            <div style={pageTitle}>Welcome, {profile?.first_name} 🌲</div>
            <div style={subtitle}>Here's a snapshot of your property status.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard num={properties.length} label="Properties" color="#3a6e33" />
              <StatCard num={workOrders.filter(w => w.status === "pending" || w.status === "in-progress").length} label="Active Requests" color="#e67e22" />
              <StatCard num={workOrders.filter(w => w.status === "completed").length} label="Completed" color="#1a5cb5" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={card}>
                <div style={cardTitle}>My Properties</div>
                {properties.length === 0 && <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>No properties yet.</div>}
                {properties.map(p => (
                  <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0ece4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <span style={tag(p.status)}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#7a6a52", marginTop: 3 }}>{p.address}</div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={cardTitle}>Recent Requests</div>
                  <button style={btnStyle("primary")} onClick={() => setShowNewRequest(true)}>+ New</button>
                </div>
                {workOrders.length === 0 && <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>No requests yet.</div>}
                {workOrders.slice(0, 4).map(wo => (
                  <div key={wo.id} style={{ padding: "9px 0", borderBottom: "1px solid #f0ece4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div>
                      <div style={{ fontSize: 11, color: "#7a6a52" }}>{properties.find(p => p.id === wo.property_id)?.name}</div>
                    </div>
                    <span style={tag(wo.status)}>{wo.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...card, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>Current Plan: <span style={{ color: myPlan?.color }}>{myPlan?.name}</span></div>
                <div style={{ fontSize: 13, color: "#7a6a52", marginTop: 2 }}>${myPlan?.price}{myPlan?.period} · Active</div>
              </div>
              <button style={btnStyle("secondary")} onClick={() => setPortalView("subscription")}>Manage Plan</button>
            </div>
          </div>
        )}

        {portalView === "requests" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div style={pageTitle}>Maintenance Requests</div><div style={subtitle}>Submit and track service requests.</div></div>
              <button style={btnStyle("primary")} onClick={() => setShowNewRequest(true)}>+ New Request</button>
            </div>
            <div style={card}>
              {workOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#7a6a52", fontStyle: "italic" }}>No requests yet!</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead><tr>{["Request", "Property", "Priority", "Date", "Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e8e0d0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a6a52" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {workOrders.map(wo => (
                      <tr key={wo.id}>
                        <td style={tdStyle}><div style={{ fontWeight: 600 }}>{wo.title}</div>{wo.notes && <div style={{ fontSize: 11, color: "#7a6a52", fontStyle: "italic" }}>{wo.notes}</div>}{wo.tech && <div style={{ fontSize: 11, color: "#3a6e33" }}>Assigned: {wo.tech}</div>}</td>
                        <td style={tdStyle}>{properties.find(p => p.id === wo.property_id)?.name}</td>
                        <td style={tdStyle}><PriorityDot p={wo.priority} />{wo.priority}</td>
                        <td style={tdStyle}>{wo.date}</td>
                        <td style={tdStyle}><span style={tag(wo.status)}>{wo.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {portalView === "messages" && (
          <ClientMessagesView messages={messages} onSend={sendMessage} />
        )}

        {portalView === "subscription" && (
          <div>
            <div style={pageTitle}>Subscription</div>
            <div style={subtitle}>Manage your service plan and billing.</div>
            <div style={{ ...card, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#7a6a52", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Plan</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: myPlan?.color, marginTop: 4 }}>{myPlan?.name}</div>
                  <div style={{ fontSize: 14, color: "#5a4a32", marginTop: 4 }}>${myPlan?.price}{myPlan?.period}</div>
                </div>
                <span style={{ ...tag("active"), fontSize: 13, padding: "4px 14px" }}>Active</span>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                {myPlan?.features.map(f => <span key={f} style={{ fontSize: 12, color: "#3a5a32" }}>✓ {f}</span>)}
              </div>
            </div>
            {profile?.payment_last4 && (
              <div style={{ ...card, marginBottom: 24 }}>
                <div style={cardTitle}>Payment Method</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <div style={{ background: "#1c2b1a", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: "bold" }}>{profile.payment_brand}</div>
                  <div style={{ fontSize: 14 }}>•••• •••• •••• {profile.payment_last4}</div>
                  <div style={{ fontSize: 12, color: "#7a6a52" }}>Expires {profile.payment_expiry}</div>
                </div>
              </div>
            )}
            <div style={cardTitle}>Change Your Plan</div>
            <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
              {PLANS.map(plan => (
                <div key={plan.id} style={{ border: `2px solid ${plan.id === profile?.subscription ? plan.color : "#e0d8cc"}`, borderRadius: 10, padding: "16px 20px", background: plan.id === profile?.subscription ? "#f9fdf8" : "#fff", position: "relative" }}>
                  {plan.popular && <div style={{ position: "absolute", top: -10, right: 14, background: "#3a6e33", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: "bold" }}>MOST POPULAR</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 15, color: plan.color }}>{plan.name}</div>
                      <div style={{ fontSize: 13, color: "#5a4a32", marginTop: 4 }}><b>${plan.price}</b>{plan.period}</div>
                    </div>
                    {plan.id === profile?.subscription
                      ? <span style={{ fontSize: 12, color: "#3a6e33", fontWeight: "bold" }}>✓ Current Plan</span>
                      : <button style={btnStyle("primary")} onClick={() => changePlan(plan.id)}>Switch</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {portalView === "profile" && (
          <div>
            <div style={pageTitle}>My Profile</div>
            <div style={subtitle}>Update your contact information.</div>
            <div style={{ ...card, maxWidth: 440 }}>
              {showEditProfile ? (
                <div style={{ display: "grid", gap: 14 }}>
                  <Field label="First Name"><input style={inputStyle} value={profileEdit.firstName} onChange={e => setProfileEdit({ ...profileEdit, firstName: e.target.value })} /></Field>
                  <Field label="Last Name"><input style={inputStyle} value={profileEdit.lastName} onChange={e => setProfileEdit({ ...profileEdit, lastName: e.target.value })} /></Field>
                  <Field label="Phone"><input style={inputStyle} value={profileEdit.phone} onChange={e => setProfileEdit({ ...profileEdit, phone: e.target.value })} /></Field>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowEditProfile(false)}>Cancel</button>
                    <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={saveProfile}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div>
                  <ProfileRow label="Name" value={`${profile?.first_name} ${profile?.last_name}`} />
                  <ProfileRow label="Email" value={session.user.email} />
                  <ProfileRow label="Phone" value={profile?.phone || "—"} />
                  <ProfileRow label="Plan" value={myPlan?.name} />
                  <button style={{ ...btnStyle("primary"), marginTop: 20 }} onClick={() => setShowEditProfile(true)}>Edit Profile</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewRequest && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>Submit Maintenance Request</div>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Request Title *"><input style={inputStyle} placeholder="e.g. Leaking faucet in bathroom" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} /></Field>
              <Field label="Property *"><select style={inputStyle} value={newRequest.propertyId} onChange={e => setNewRequest({ ...newRequest, propertyId: e.target.value })}><option value="">Select property…</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
              <Field label="Description"><textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} placeholder="Describe the issue…" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Priority"><select style={inputStyle} value={newRequest.priority} onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High / Urgent</option></select></Field>
                <Field label="Preferred Date"><input style={inputStyle} type="date" value={newRequest.preferredDate} onChange={e => setNewRequest({ ...newRequest, preferredDate: e.target.value })} /></Field>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowNewRequest(false)}>Cancel</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={submitRequest}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientMessagesView({ messages, onSend }) {
  const [text, setText] = useState("");
  function formatTime(ts) { const d = new Date(ts); return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  function send() { onSend(text); setText(""); }
  return (
    <div>
      <div style={pageTitle}>Messages</div>
      <div style={{ ...subtitle, marginBottom: 16 }}>Chat directly with the Northwoods Property Services team.</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e0d0", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", height: 520 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && <div style={{ textAlign: "center", color: "#bbb", fontStyle: "italic", fontSize: 13, marginTop: 80 }}>No messages yet. Send one below!</div>}
          {messages.map(m => {
            const isMe = m.from_role === "client";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>{isMe ? "You" : "Northwoods Property Services"} · {formatTime(m.created_at)}</div>
                <div style={{ maxWidth: "72%", background: isMe ? "#3a6e33" : "#f0ece4", color: isMe ? "#fff" : "#2c2416", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid #e8e0d0", padding: "14px 20px", display: "flex", gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Type a message…" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
          <button style={{ ...btnStyle("primary"), padding: "9px 20px" }} onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
function AdminApp({ session, onBack }) {
  const [view, setView] = useState("dashboard");
  const [properties, setProperties] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddWO, setShowAddWO] = useState(false);
  const [newProp, setNewProp] = useState({ name: "", address: "", type: "Cabin", status: "active", phone: "", email: "", notes: "" });
  const [newWO, setNewWO] = useState({ propertyId: "", title: "", tech: "", status: "pending", priority: "medium", date: "", notes: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: props }, { data: wos }, { data: profs }, { data: msgs }] = await Promise.all([
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
    ]);
    setProperties(props || []);
    setWorkOrders(wos || []);
    setClients(profs || []);
    setMessages(msgs || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || "Unknown";
  const adminUnread = messages.filter(m => m.from_role === "client" && !m.read).length;

  async function addProperty() {
    if (!newProp.name) return;
    await supabase.from("properties").insert({ name: newProp.name, address: newProp.address, type: newProp.type, status: newProp.status, phone: newProp.phone, email: newProp.email, notes: newProp.notes });
    setNewProp({ name: "", address: "", type: "Cabin", status: "active", phone: "", email: "", notes: "" });
    setShowAddProperty(false); loadData();
  }

  async function addWO() {
    if (!newWO.title || !newWO.propertyId) return;
    await supabase.from("work_orders").insert({ property_id: newWO.propertyId, title: newWO.title, tech: newWO.tech, status: newWO.status, priority: newWO.priority, date: newWO.date || null, notes: newWO.notes, submitted_by: "admin" });
    setNewWO({ propertyId: "", title: "", tech: "", status: "pending", priority: "medium", date: "", notes: "" });
    setShowAddWO(false); loadData();
  }

  async function updateWOStatus(id, status) {
    await supabase.from("work_orders").update({ status }).eq("id", id);
    setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, status } : w));
  }

  async function sendAdminMessage(clientId, text) {
    if (!text.trim()) return;
    await supabase.from("messages").insert({ client_id: clientId, from_role: "admin", text: text.trim(), read: false });
    loadData();
  }

  async function markAdminRead(clientId) {
    if (!clientId) return;
    await supabase.from("messages").update({ read: true }).eq("client_id", clientId).eq("from_role", "client");
    loadData();
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "properties", label: "Properties", icon: "🏠" },
    { id: "workorders", label: "Work Orders", icon: "🔧" },
    { id: "taskboard", label: "Task Board", icon: "📋" },
    { id: "messages", label: "Messages", icon: "💬", badge: adminUnread },
    { id: "clients", label: "Clients", icon: "👥" },
    { id: "staff", label: "Staff", icon: "👷" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f1eb", minHeight: "100vh", color: "#2c2416" }}>
      <div style={{ width: 220, background: "#1c2b1a", minHeight: "100vh", position: "fixed", top: 0, left: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #2e4029" }}>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#a8c8a0", lineHeight: 1.3 }}>Northwoods Property Services</div>
          <div style={{ fontSize: 11, color: "#6a8c64", marginTop: 4, fontStyle: "italic" }}>Staff Dashboard</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setView(item.id); setSelectedProperty(null); if (item.id === "messages") markAdminRead(null); }} style={{ padding: "10px 20px", cursor: "pointer", fontSize: 14, color: view === item.id ? "#c8e6c0" : "#8aaa84", background: view === item.id ? "#2a4026" : "transparent", borderLeft: view === item.id ? "3px solid #5a9e52" : "3px solid transparent", display: "flex", alignItems: "center", gap: 10 }}>
              <span>{item.icon}</span>{item.label}
              {item.badge > 0 && <span style={{ marginLeft: "auto", background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: "bold", padding: "1px 7px" }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: 20 }}>
          <button onClick={onBack} style={{ width: "100%", padding: 8, background: "transparent", border: "1px solid #3a5a34", borderRadius: 6, color: "#7a9a74", cursor: "pointer", fontSize: 12 }}>Sign Out</button>
        </div>
      </div>

      <div style={{ marginLeft: 220, padding: "32px 40px", maxWidth: 1100 }}>
        {view === "dashboard" && (
          <div>
            <div style={pageTitle}>Good morning 🌲</div>
            <div style={subtitle}>Here's what's happening across your properties today.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <StatCard num={properties.length} label="Properties" color="#3a6e33" />
              <StatCard num={clients.length} label="Clients" color="#8b4513" />
              <StatCard num={workOrders.filter(w => w.status === "pending").length} label="Pending" color="#e67e22" />
              <StatCard num={workOrders.filter(w => w.priority === "high" && w.status !== "completed").length} label="High Priority" color="#c0392b" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={card}>
                <div style={cardTitle}>Recent Work Orders</div>
                {workOrders.slice(0, 5).map(wo => (
                  <div key={wo.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f0ece4" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}><PriorityDot p={wo.priority} />{wo.title}</div>
                      <div style={{ fontSize: 11, color: "#7a6a52" }}>{getPropertyName(wo.property_id)}{wo.submitted_by === "client" ? " · Client Request" : ""}</div>
                    </div>
                    <span style={tag(wo.status)}>{wo.status}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={cardTitle}>Properties at a Glance</div>
                {properties.slice(0, 5).map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f0ece4" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 11, color: "#7a6a52" }}>{p.address}</div></div>
                    <span style={tag(p.status)}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "properties" && !selectedProperty && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div style={pageTitle}>Properties</div><div style={subtitle}>All managed vacation homes.</div></div>
              <button style={btnStyle("primary")} onClick={() => setShowAddProperty(true)}>+ Add Property</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {properties.map(p => (
                <div key={p.id} onClick={() => setSelectedProperty(p)} style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e8e0d0", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontWeight: "bold", fontSize: 16 }}>{p.name}</div><span style={tag(p.status)}>{p.status}</span></div>
                  <div style={{ fontSize: 12, color: "#8a7a62", marginTop: 6 }}>{p.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "properties" && selectedProperty && (
          <div>
            <button style={{ ...btnStyle("secondary"), marginBottom: 20 }} onClick={() => setSelectedProperty(null)}>← Back</button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><div style={pageTitle}>{selectedProperty.name}</div><div style={subtitle}>{selectedProperty.address}</div></div>
              <span style={tag(selectedProperty.status)}>{selectedProperty.status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={card}>
                <div style={cardTitle}>Property Info</div>
                <ProfileRow label="Type" value={selectedProperty.type} />
                <ProfileRow label="Phone" value={selectedProperty.phone || "—"} />
                <ProfileRow label="Email" value={selectedProperty.email || "—"} />
                {selectedProperty.notes && <div style={{ fontSize: 13, color: "#7a6a52", marginTop: 12, fontStyle: "italic", background: "#faf7f2", padding: 12, borderRadius: 6 }}>📋 {selectedProperty.notes}</div>}
              </div>
              <div style={card}>
                <div style={cardTitle}>Work Orders</div>
                {workOrders.filter(w => w.property_id === selectedProperty.id).map(wo => (
                  <div key={wo.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0ece4", display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{wo.title}</div><div style={{ fontSize: 11, color: "#7a6a52" }}>{wo.tech || "Unassigned"} · {wo.date}</div></div>
                    <span style={tag(wo.status)}>{wo.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "workorders" && (
          <WorkOrdersView workOrders={workOrders} properties={properties} getPropertyName={getPropertyName} onNew={() => setShowAddWO(true)} updateWOStatus={updateWOStatus} />
        )}

        {view === "taskboard" && (
          <TaskBoard workOrders={workOrders} getPropertyName={getPropertyName} onNew={() => setShowAddWO(true)} updateWOStatus={updateWOStatus} />
        )}

        {view === "messages" && (
          <AdminMessagesView clients={clients} messages={messages} onSend={sendAdminMessage} onMarkRead={markAdminRead} />
        )}

        {view === "clients" && (
          <div>
            <div style={pageTitle}>Clients</div>
            <div style={subtitle}>Registered property owners and their subscriptions.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {clients.map(c => {
                const plan = PLANS.find(p => p.id === c.subscription);
                const cProps = properties.filter(p => p.owner_id === c.id);
                return (
                  <div key={c.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div><div style={{ fontWeight: "bold", fontSize: 15 }}>{c.first_name} {c.last_name}</div><div style={{ fontSize: 12, color: "#7a6a52" }}>{c.phone}</div></div>
                      <span style={{ ...tag("active"), fontSize: 11 }}>Active</span>
                    </div>
                    <div style={{ fontSize: 13, color: plan?.color, fontWeight: "bold", marginBottom: 8 }}>{plan?.name}</div>
                    {cProps.map(p => <div key={p.id} style={{ fontSize: 12, color: "#7a6a52", marginBottom: 4 }}>🏠 {p.name}</div>)}
                    {c.payment_last4 && <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>💳 {c.payment_brand} ···· {c.payment_last4}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "staff" && (
          <div>
            <div style={pageTitle}>Staff</div>
            <div style={subtitle}>Technician assignments and workload.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {STAFF.map(name => {
                const active = workOrders.filter(w => w.tech === name && w.status !== "completed");
                const done = workOrders.filter(w => w.tech === name && w.status === "completed");
                return (
                  <div key={name} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <div><div style={{ fontWeight: "bold", fontSize: 15 }}>{name}</div><div style={{ fontSize: 12, color: "#7a6a52" }}>Field Technician</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#7a6a52" }}>Active</div><div style={{ fontSize: 22, fontWeight: "bold", color: "#3a6e33" }}>{active.length}</div></div>
                    </div>
                    {active.length === 0 ? <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>No active assignments.</div>
                      : active.map(wo => <div key={wo.id} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid #f0ece4", display: "flex", justifyContent: "space-between" }}><span><PriorityDot p={wo.priority} />{wo.title}</span><span style={tag(wo.status)}>{wo.status}</span></div>)}
                    <div style={{ marginTop: 10, fontSize: 11, color: "#7a6a52" }}>{done.length} completed</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAddProperty && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>Add New Property</div>
            <div style={{ display: "grid", gap: 12 }}>
              <input style={inputStyle} placeholder="Property Name *" value={newProp.name} onChange={e => setNewProp({ ...newProp, name: e.target.value })} />
              <input style={inputStyle} placeholder="Address" value={newProp.address} onChange={e => setNewProp({ ...newProp, address: e.target.value })} />
              <input style={inputStyle} placeholder="Phone" value={newProp.phone} onChange={e => setNewProp({ ...newProp, phone: e.target.value })} />
              <input style={inputStyle} placeholder="Email" value={newProp.email} onChange={e => setNewProp({ ...newProp, email: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select style={inputStyle} value={newProp.type} onChange={e => setNewProp({ ...newProp, type: e.target.value })}>{["Cabin", "Cottage", "Lodge", "Home", "Condo"].map(t => <option key={t}>{t}</option>)}</select>
                <select style={inputStyle} value={newProp.status} onChange={e => setNewProp({ ...newProp, status: e.target.value })}><option value="active">Active</option><option value="seasonal">Seasonal</option><option value="inactive">Inactive</option></select>
              </div>
              <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="Notes…" value={newProp.notes} onChange={e => setNewProp({ ...newProp, notes: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={btnStyle("secondary")} onClick={() => setShowAddProperty(false)}>Cancel</button>
              <button style={btnStyle("primary")} onClick={addProperty}>Save Property</button>
            </div>
          </div>
        </div>
      )}

      {showAddWO && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>New Work Order</div>
            <div style={{ display: "grid", gap: 12 }}>
              <input style={inputStyle} placeholder="Task Title *" value={newWO.title} onChange={e => setNewWO({ ...newWO, title: e.target.value })} />
              <select style={inputStyle} value={newWO.propertyId} onChange={e => setNewWO({ ...newWO, propertyId: e.target.value })}><option value="">Select Property *</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <select style={inputStyle} value={newWO.tech} onChange={e => setNewWO({ ...newWO, tech: e.target.value })}><option value="">Assign Technician</option>{STAFF.map(s => <option key={s}>{s}</option>)}</select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <select style={inputStyle} value={newWO.priority} onChange={e => setNewWO({ ...newWO, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <select style={inputStyle} value={newWO.status} onChange={e => setNewWO({ ...newWO, status: e.target.value })}><option value="pending">Pending</option><option value="in-progress">In Progress</option></select>
                <input style={inputStyle} type="date" value={newWO.date} onChange={e => setNewWO({ ...newWO, date: e.target.value })} />
              </div>
              <textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="Notes…" value={newWO.notes} onChange={e => setNewWO({ ...newWO, notes: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={btnStyle("secondary")} onClick={() => setShowAddWO(false)}>Cancel</button>
              <button style={btnStyle("primary")} onClick={addWO}>Create Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function WorkOrdersView({ workOrders, properties, getPropertyName, onNew, updateWOStatus }) {
  const [woFilter, setWoFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const filteredWOs = workOrders.filter(w => woFilter === "all" || w.status === woFilter);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={pageTitle}>Work Orders</div><div style={subtitle}>All tasks including client-submitted requests.</div></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#e8e0d0", borderRadius: 6, padding: 3 }}>
            {[{ id: "table", icon: "☰" }, { id: "kanban", icon: "⊞" }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 14, background: viewMode === v.id ? "#fff" : "transparent", color: viewMode === v.id ? "#1c2b1a" : "#7a6a52", boxShadow: viewMode === v.id ? "0 1px 4px rgba(0,0,0,0.12)" : "none" }}>{v.icon}</button>
            ))}
          </div>
          <button style={btnStyle("primary")} onClick={onNew}>+ New Order</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["all", "pending", "in-progress", "completed"].map(f => <button key={f} onClick={() => setWoFilter(f)} style={{ ...btnStyle(woFilter === f ? "primary" : "secondary"), textTransform: "capitalize" }}>{f}</button>)}
      </div>
      {viewMode === "table" && (
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr>{["Task", "Property", "Source", "Tech", "Date", "Priority", "Status", "Action"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e8e0d0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7a6a52" }}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredWOs.map(wo => (
                <tr key={wo.id}>
                  <td style={tdStyle}><div style={{ fontWeight: 600 }}>{wo.title}</div>{wo.notes && <div style={{ fontSize: 11, color: "#7a6a52" }}>{wo.notes}</div>}</td>
                  <td style={tdStyle}>{getPropertyName(wo.property_id)}</td>
                  <td style={tdStyle}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: wo.submitted_by === "client" ? "#e8f0fe" : "#f0ece4", color: wo.submitted_by === "client" ? "#1a5cb5" : "#7a6a52" }}>{wo.submitted_by === "client" ? "Client" : "Staff"}</span></td>
                  <td style={tdStyle}>{wo.tech || <span style={{ color: "#bbb" }}>—</span>}</td>
                  <td style={tdStyle}>{wo.date}</td>
                  <td style={tdStyle}><PriorityDot p={wo.priority} />{wo.priority}</td>
                  <td style={tdStyle}><span style={tag(wo.status)}>{wo.status}</span></td>
                  <td style={tdStyle}>
                    {wo.status !== "completed"
                      ? <select style={{ ...inputStyle, width: 120, fontSize: 12 }} value={wo.status} onChange={e => updateWOStatus(wo.id, e.target.value)}><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select>
                      : <span style={{ fontSize: 12, color: "#27ae60" }}>✓ Done</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viewMode === "kanban" && <KanbanBoard workOrders={filteredWOs} updateWOStatus={updateWOStatus} getPropertyName={getPropertyName} />}
    </div>
  );
}

function TaskBoard({ workOrders, getPropertyName, onNew, updateWOStatus }) {
  const [staffFilter, setStaffFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const allTechs = [...new Set(workOrders.map(w => w.tech).filter(Boolean))];
  const filtered = workOrders.filter(w => (staffFilter === "all" || w.tech === staffFilter) && (priorityFilter === "all" || w.priority === priorityFilter));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><div style={pageTitle}>Task Board</div><div style={subtitle}>All tasks by status — filter by technician or priority.</div></div>
        <button style={btnStyle("primary")} onClick={onNew}>+ New Order</button>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#7a6a52" }}>Tech:</span>
          <select style={{ ...inputStyle, width: 160 }} value={staffFilter} onChange={e => setStaffFilter(e.target.value)}><option value="all">All Staff</option>{allTechs.map(t => <option key={t} value={t}>{t}</option>)}<option value="">Unassigned</option></select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#7a6a52" }}>Priority:</span>
          <select style={{ ...inputStyle, width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="all">All Priorities</option><option value="high">🔴 High</option><option value="medium">🟠 Medium</option><option value="low">🟢 Low</option></select>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#7a6a52" }}>{filtered.length} task{filtered.length !== 1 ? "s" : ""}</div>
      </div>
      <KanbanBoard workOrders={filtered} updateWOStatus={updateWOStatus} getPropertyName={getPropertyName} />
    </div>
  );
}

function KanbanBoard({ workOrders, updateWOStatus, getPropertyName }) {
  const columns = [
    { id: "pending", label: "Pending", color: "#e67e22", bg: "#fff8f0", border: "#fcd9a8" },
    { id: "in-progress", label: "In Progress", color: "#1a5cb5", bg: "#f0f5ff", border: "#b8d0f8" },
    { id: "completed", label: "Completed", color: "#1e7e34", bg: "#f2faf3", border: "#b4e0bc" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
      {columns.map(col => {
        const colTasks = workOrders.filter(w => w.status === col.id);
        return (
          <div key={col.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <div style={{ fontWeight: "bold", fontSize: 12, color: "#1c2b1a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.label}</div>
              <div style={{ marginLeft: "auto", background: col.bg, border: `1px solid ${col.border}`, color: col.color, borderRadius: 20, fontSize: 11, fontWeight: "bold", padding: "1px 9px" }}>{colTasks.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 120 }}>
              {colTasks.length === 0 && <div style={{ border: `2px dashed ${col.border}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", color: "#ccc", fontSize: 12 }}>No tasks</div>}
              {colTasks.map(wo => (
                <div key={wo.id} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: `1px solid ${col.border}`, borderLeft: `4px solid ${priorityColors[wo.priority]}` }}>
                  <div style={{ fontWeight: "bold", fontSize: 13, color: "#1c2b1a", marginBottom: 6, lineHeight: 1.3 }}>{wo.title}</div>
                  <div style={{ fontSize: 11, color: "#7a6a52", marginBottom: 3 }}>🏠 {getPropertyName(wo.property_id)}</div>
                  {wo.tech ? <div style={{ fontSize: 11, color: "#5a7a52", marginBottom: 3 }}>👷 {wo.tech}</div> : <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3 }}>👷 Unassigned</div>}
                  {wo.date && <div style={{ fontSize: 11, color: "#9a8a72", marginBottom: 8 }}>📅 {wo.date}</div>}
                  {wo.notes && <div style={{ fontSize: 11, color: "#9a8a72", fontStyle: "italic", marginBottom: 8, borderTop: "1px solid #f0ece4", paddingTop: 6 }}>{wo.notes}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: wo.submitted_by === "client" ? "#e8f0fe" : "#f0ece4", color: wo.submitted_by === "client" ? "#1a5cb5" : "#7a6a52" }}>{wo.submitted_by === "client" ? "Client" : "Staff"}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {col.id !== "pending" && <button onClick={() => updateWOStatus(wo.id, col.id === "in-progress" ? "pending" : "in-progress")} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d0c8bc", background: "#f5f1eb", cursor: "pointer", color: "#5a4a32" }}>←</button>}
                      {col.id !== "completed" && <button onClick={() => updateWOStatus(wo.id, col.id === "pending" ? "in-progress" : "completed")} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #d0c8bc", background: "#f5f1eb", cursor: "pointer", color: "#5a4a32" }}>→</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminMessagesView({ clients, messages, onSend, onMarkRead }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [text, setText] = useState("");
  const threads = clients.map(c => {
    const thread = messages.filter(m => m.client_id === c.id);
    const lastMsg = thread[thread.length - 1];
    const unread = thread.filter(m => m.from_role === "client" && !m.read).length;
    return { client: c, thread, lastMsg, unread };
  });
  const selected = threads.find(t => t.client.id === selectedClientId);
  function formatTime(ts) { if (!ts) return ""; const d = new Date(ts); return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
  function send() { if (!text.trim() || !selectedClientId) return; onSend(selectedClientId, text); setText(""); }
  function selectThread(clientId) { setSelectedClientId(clientId); onMarkRead(clientId); }
  return (
    <div>
      <div style={pageTitle}>Messages</div>
      <div style={{ ...subtitle, marginBottom: 16 }}>Client conversations — respond directly from here.</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e0d0", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", display: "flex", height: 560 }}>
        <div style={{ width: 240, borderRight: "1px solid #e8e0d0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0ece4", fontSize: 12, fontWeight: "bold", color: "#7a6a52", textTransform: "uppercase", letterSpacing: "0.06em" }}>Conversations</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {threads.map(t => (
              <div key={t.client.id} onClick={() => selectThread(t.client.id)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f5f1eb", background: selectedClientId === t.client.id ? "#f0f7ee" : "transparent", borderLeft: selectedClientId === t.client.id ? "3px solid #3a6e33" : "3px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: 13, color: "#1c2b1a" }}>{t.client.first_name} {t.client.last_name}</div>
                  {t.unread > 0 && <span style={{ background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: "bold", padding: "1px 6px" }}>{t.unread}</span>}
                </div>
                {t.lastMsg ? <div style={{ fontSize: 11, color: "#7a6a52", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.lastMsg.from_role === "admin" ? "You: " : ""}{t.lastMsg.text}</div>
                  : <div style={{ fontSize: 11, color: "#bbb", marginTop: 3, fontStyle: "italic" }}>No messages yet</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!selectedClientId ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 14, fontStyle: "italic" }}>Select a conversation</div>
          ) : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0ece4", fontWeight: "bold", fontSize: 14, color: "#1c2b1a", background: "#fafaf8" }}>
                {selected?.client.first_name} {selected?.client.last_name}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {selected?.thread.length === 0 && <div style={{ textAlign: "center", color: "#bbb", fontStyle: "italic", fontSize: 13, marginTop: 60 }}>No messages yet. Say hello!</div>}
                {selected?.thread.map(m => {
                  const isAdmin = m.from_role === "admin";
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>{isAdmin ? "You (Staff)" : `${selected.client.first_name} ${selected.client.last_name}`} · {formatTime(m.created_at)}</div>
                      <div style={{ maxWidth: "72%", background: isAdmin ? "#1c2b1a" : "#f0ece4", color: isAdmin ? "#d9e8d5" : "#2c2416", borderRadius: isAdmin ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: "1px solid #e8e0d0", padding: "14px 20px", display: "flex", gap: 10 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder={`Reply to ${selected?.client.first_name}…`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
                <button style={{ ...btnStyle("primary"), padding: "9px 20px" }} onClick={send}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}