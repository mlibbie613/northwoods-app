import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const PLANS = [
  { id: "basic", name: "Seasonal Basic", price: 649, period: "/ season", color: "#5a8c52", features: ["Spring open-up checklist", "Fall winterization checklist", "2 maintenance visits/year", "Email support"] },
  { id: "standard", name: "Standard Care", price: 119, period: "/ month", color: "#2a6ea6", features: ["Everything in Basic", "Monthly property inspections", "Unlimited maintenance requests", "Priority scheduling", "Phone & email support"], popular: true },
  { id: "premium", name: "Premium Concierge", price: 449, period: "/ month", color: "#8b4513", features: ["Everything in Standard", "24/7 emergency response", "Quarterly deep clean", "Vendor coordination", "Dedicated property manager"] },
];
const STAFF = ["Dale Krueger", "Maria Santos", "Josh Tillman", "Erin Olson"];
const ADMIN_EMAILS = ["admin@test.com", "mlibbie613@yahoo.com"];
const statusColors = {
  active: { bg: "#e6f4ea", text: "#1e7e34" }, seasonal: { bg: "#fff4e0", text: "#b35c00" }, inactive: { bg: "#f0f0f0", text: "#666" },
  completed: { bg: "#e6f4ea", text: "#1e7e34" }, "in-progress": { bg: "#e8f0fe", text: "#1a5cb5" }, pending: { bg: "#fff4e0", text: "#b35c00" },
};
const priorityColors = { high: "#c0392b", medium: "#e67e22", low: "#27ae60" };

const isMobile = () => window.innerWidth <= 768;

const inputStyle = { padding: "9px 12px", borderRadius: 6, border: "1px solid #d0c8bc", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "'Georgia', serif", background: "#fff" };
function btnStyle(v = "primary") { return { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: "600", background: v === "primary" ? "#3a6e33" : "#e8e0d0", color: v === "primary" ? "#fff" : "#2c2416" }; }
function tag(status) { const s = statusColors[status] || { bg: "#f0f0f0", text: "#666" }; return { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: "600", background: s.bg, color: s.text }; }
const card = { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e8e0d0", marginBottom: 16 };
const cardTitle = { fontWeight: "bold", marginBottom: 14, fontSize: 16, color: "#1c2b1a" };
const pageTitle = { fontSize: 24, fontWeight: "bold", color: "#1c2b1a", marginBottom: 4, fontFamily: "'Georgia', serif" };
const subtitle = { fontSize: 13, color: "#7a6a52", marginBottom: 20, fontStyle: "italic" };
const tdStyle = { padding: "10px 8px", borderBottom: "1px solid #f0ece4", verticalAlign: "middle", fontSize: 13 };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 };
const modalBox = { background: "#fff", borderRadius: "16px 16px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 560, boxShadow: "0 -4px 30px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" };

function Field({ label, children, error }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: "#7a6a52", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>{children}{error && <div style={{ fontSize: 11, color: "#c0392b", marginTop: 3 }}>{error}</div>}</div>;
}
function ProfileRow({ label, value }) {
  return <div style={{ display: "flex", padding: "12px 0", borderBottom: "1px solid #f0ece4", fontSize: 14 }}><div style={{ width: 110, color: "#7a6a52", flexShrink: 0 }}>{label}</div><div style={{ fontWeight: 600 }}>{value}</div></div>;
}
function StatCard({ num, label, color }) {
  return <div style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderTop: `4px solid ${color}`, flex: 1 }}><div style={{ fontSize: 28, fontWeight: "bold", color: "#1c2b1a" }}>{num}</div><div style={{ fontSize: 11, color: "#7a6a52", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div></div>;
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f1f0d 0%, #1c3318 45%, #2a4a22 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", maxWidth: 480, width: "100%" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.25em", color: "#7ab870", textTransform: "uppercase", marginBottom: 16 }}>Wisconsin Northwoods</div>
        <div style={{ fontSize: 42, fontWeight: "bold", color: "#e8f4e4", lineHeight: 1.1, marginBottom: 14 }}>Northwoods Property Services</div>
        <div style={{ fontSize: 15, color: "#9ab894", fontStyle: "italic", marginBottom: 48 }}>Vacation home maintenance you can trust — from opener to close.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onClient} style={{ padding: "16px 38px", borderRadius: 10, border: "none", cursor: "pointer", background: "#4a8e42", color: "#fff", fontSize: 16, fontWeight: "bold" }}>Client Portal →</button>
          <button onClick={onAdmin} style={{ padding: "16px 38px", borderRadius: 10, border: "2px solid #4a6e44", cursor: "pointer", background: "transparent", color: "#9ab894", fontSize: 16, fontWeight: "bold" }}>Staff Login</button>
        </div>
        <div style={{ marginTop: 48, display: "flex", gap: 24, justifyContent: "center", color: "#5a7a54", fontSize: 12, flexWrap: "wrap" }}>
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
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#1c2b1a", marginBottom: 4 }}>Staff Login</div>
        <div style={{ fontSize: 13, color: "#7a6a52", marginBottom: 28, fontStyle: "italic" }}>Northwoods Property Services</div>
        {error && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gap: 14 }}>
          <input style={inputStyle} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <input style={inputStyle} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button style={{ ...btnStyle("primary"), padding: "14px 18px", width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
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
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#1c2b1a", marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: "#7a6a52", marginBottom: 28, fontStyle: "italic" }}>Sign in to your client portal</div>
        {error && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gap: 14 }}>
          <input style={inputStyle} placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <input style={inputStyle} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <button style={{ ...btnStyle("primary"), padding: "14px 18px", width: "100%" }} onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#7a6a52" }}>New client? <span onClick={onRegister} style={{ color: "#3a6e33", cursor: "pointer", fontWeight: "bold" }}>Create an account</span></div>
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

  const steps = ["Profile", "Property", "Plan", "Payment"];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f1eb", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: "'Georgia', serif", padding: "20px 16px" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 20px", width: "100%", maxWidth: 520, boxShadow: "0 4px 30px rgba(0,0,0,0.10)", border: "1px solid #e0d8cc" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6a52", fontSize: 13, marginBottom: 20, padding: 0 }}>← Back</button>
        <div style={{ display: "flex", marginBottom: 28 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="First Name" error={errors.firstName}><input style={inputStyle} value={profile.firstName} onChange={e => setProfileData({ ...profile, firstName: e.target.value })} /></Field>
              <Field label="Last Name" error={errors.lastName}><input style={inputStyle} value={profile.lastName} onChange={e => setProfileData({ ...profile, lastName: e.target.value })} /></Field>
            </div>
            <Field label="Email Address" error={errors.email}><input style={inputStyle} type="email" value={profile.email} onChange={e => setProfileData({ ...profile, email: e.target.value })} /></Field>
            <Field label="Phone Number"><input style={inputStyle} type="tel" value={profile.phone} onChange={e => setProfileData({ ...profile, phone: e.target.value })} /></Field>
            <Field label="Password" error={errors.password}><input style={inputStyle} type="password" value={profile.password} onChange={e => setProfileData({ ...profile, password: e.target.value })} /></Field>
            <Field label="Confirm Password" error={errors.confirmPassword}><input style={inputStyle} type="password" value={profile.confirmPassword} onChange={e => setProfileData({ ...profile, confirmPassword: e.target.value })} /></Field>
            <button style={{ ...btnStyle("primary"), marginTop: 8, width: "100%", padding: "14px" }} onClick={() => validateProfile() && setStep(2)}>Continue →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Register Your Property</div>
            <Field label="Property Name" error={errors.propName}><input style={inputStyle} placeholder="e.g. Lakeview Cabin" value={prop.name} onChange={e => setProp({ ...prop, name: e.target.value })} /></Field>
            <Field label="Full Address" error={errors.propAddress}><input style={inputStyle} placeholder="Street, City, WI" value={prop.address} onChange={e => setProp({ ...prop, address: e.target.value })} /></Field>
            <Field label="Property Type"><select style={inputStyle} value={prop.type} onChange={e => setProp({ ...prop, type: e.target.value })}>{["Cabin", "Cottage", "Lodge", "Home", "Condo"].map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Access Notes (optional)"><textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Key location, gate code…" value={prop.notes} onChange={e => setProp({ ...prop, notes: e.target.value })} /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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
                <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{ border: `2px solid ${selectedPlan === plan.id ? plan.color : "#e0d8cc"}`, borderRadius: 12, padding: "16px", cursor: "pointer", background: selectedPlan === plan.id ? "#f9fdf8" : "#fff", position: "relative" }}>
                  {plan.popular && <div style={{ position: "absolute", top: -10, right: 14, background: "#3a6e33", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: "bold" }}>MOST POPULAR</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: "bold", fontSize: 15, color: plan.color }}>{plan.name}</div>
                    <div><span style={{ fontSize: 20, fontWeight: "bold", color: "#1c2b1a" }}>${plan.price}</span><span style={{ fontSize: 12, color: "#7a6a52" }}>{plan.period}</span></div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>{plan.features.map(f => <span key={f} style={{ fontSize: 11, color: "#5a4a32" }}>✓ {f}</span>)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>
        )}

        {step === 4 && !processing && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#1c2b1a", marginBottom: 20 }}>Payment Details</div>
            <div style={{ background: "#f5f1eb", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: "#7a6a52" }}>Selected: </span><b>{PLANS.find(p => p.id === selectedPlan)?.name}</b>
              <span style={{ color: "#3a6e33", marginLeft: 8, fontWeight: "bold" }}>${PLANS.find(p => p.id === selectedPlan)?.price}{PLANS.find(p => p.id === selectedPlan)?.period}</span>
            </div>
            {errors.payment && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{errors.payment}</div>}
            {errorMsg && <div style={{ background: "#fde8e8", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{errorMsg}</div>}
            <Field label="Name on Card"><input style={inputStyle} placeholder="Your Name" value={payment.name} onChange={e => setPayment({ ...payment, name: e.target.value })} /></Field>
            <Field label="Card Number"><input style={inputStyle} placeholder="4242 4242 4242 4242" maxLength={19} value={payment.cardNumber} onChange={e => setPayment({ ...payment, cardNumber: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim() })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Expiry"><input style={inputStyle} placeholder="MM/YY" maxLength={5} value={payment.expiry} onChange={e => setPayment({ ...payment, expiry: e.target.value })} /></Field>
              <Field label="CVV"><input style={inputStyle} placeholder="123" maxLength={4} value={payment.cvv} onChange={e => setPayment({ ...payment, cvv: e.target.value })} /></Field>
            </div>
            <div style={{ fontSize: 11, color: "#7a6a52", marginTop: 8 }}>🔒 Secure payment — card info is never stored</div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
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
    { id: "overview", label: "Home", icon: "⌂" },
    { id: "requests", label: "Requests", icon: "🔧" },
    { id: "messages", label: "Messages", icon: "💬", badge: unreadCount },
    { id: "subscription", label: "Plan", icon: "⭐" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f1eb", minHeight: "100vh", color: "#2c2416", paddingBottom: 80 }}>
      {/* Top header */}
      <div style={{ background: "#1c3a2a", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#a8d4b8" }}>Northwoods Property Services</div>
          <div style={{ fontSize: 11, color: "#6a9878" }}>{profile?.first_name} {profile?.last_name} · {myPlan?.name}</div>
        </div>
        <button onClick={onLogout} style={{ background: "transparent", border: "1px solid #3a5a44", borderRadius: 6, color: "#7a9a80", cursor: "pointer", fontSize: 12, padding: "6px 12px" }}>Sign Out</button>
      </div>

      {/* Main content */}
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        {portalView === "overview" && (
          <div>
            <div style={pageTitle}>Welcome, {profile?.first_name} 🌲</div>
            <div style={subtitle}>Here's your property status.</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <StatCard num={properties.length} label="Properties" color="#3a6e33" />
              <StatCard num={workOrders.filter(w => w.status === "pending" || w.status === "in-progress").length} label="Active" color="#e67e22" />
              <StatCard num={workOrders.filter(w => w.status === "completed").length} label="Done" color="#1a5cb5" />
            </div>
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
            <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 14 }}>Plan: <span style={{ color: myPlan?.color }}>{myPlan?.name}</span></div>
                <div style={{ fontSize: 12, color: "#7a6a52", marginTop: 2 }}>${myPlan?.price}{myPlan?.period}</div>
              </div>
              <button style={btnStyle("secondary")} onClick={() => setPortalView("subscription")}>Manage</button>
            </div>
          </div>
        )}

        {portalView === "requests" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={pageTitle}>Requests</div>
              <button style={btnStyle("primary")} onClick={() => setShowNewRequest(true)}>+ New</button>
            </div>
            <div style={subtitle}>Submit and track service requests.</div>
            {workOrders.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "40px 20px", color: "#7a6a52", fontStyle: "italic" }}>No requests yet!</div>
            ) : workOrders.map(wo => (
              <div key={wo.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{wo.title}</div>
                  <span style={tag(wo.status)}>{wo.status}</span>
                </div>
                <div style={{ fontSize: 12, color: "#7a6a52", marginBottom: 4 }}>{properties.find(p => p.id === wo.property_id)?.name}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#9a8a72" }}>
                  <span><PriorityDot p={wo.priority} />{wo.priority}</span>
                  <span>📅 {wo.date}</span>
                  {wo.tech && <span>👷 {wo.tech}</span>}
                </div>
                {wo.notes && <div style={{ fontSize: 12, color: "#7a6a52", fontStyle: "italic", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0ece4" }}>{wo.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {portalView === "messages" && (
          <ClientMessagesView messages={messages} onSend={sendMessage} />
        )}

        {portalView === "subscription" && (
          <div>
            <div style={pageTitle}>Subscription</div>
            <div style={subtitle}>Manage your service plan.</div>
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#7a6a52", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Plan</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: myPlan?.color, marginTop: 4 }}>{myPlan?.name}</div>
                  <div style={{ fontSize: 14, color: "#5a4a32", marginTop: 2 }}>${myPlan?.price}{myPlan?.period}</div>
                </div>
                <span style={{ ...tag("active"), fontSize: 12, padding: "4px 12px" }}>Active</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                {myPlan?.features.map(f => <span key={f} style={{ fontSize: 12, color: "#3a5a32" }}>✓ {f}</span>)}
              </div>
            </div>
            {profile?.payment_last4 && (
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={cardTitle}>Payment Method</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: "#1c2b1a", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: "bold" }}>{profile.payment_brand}</div>
                  <div style={{ fontSize: 14 }}>•••• •••• •••• {profile.payment_last4}</div>
                  <div style={{ fontSize: 12, color: "#7a6a52" }}>Exp {profile.payment_expiry}</div>
                </div>
              </div>
            )}
            <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 12, color: "#1c2b1a" }}>Change Plan</div>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ ...card, border: `2px solid ${plan.id === profile?.subscription ? plan.color : "#e0d8cc"}`, background: plan.id === profile?.subscription ? "#f9fdf8" : "#fff", position: "relative" }}>
                {plan.popular && <div style={{ position: "absolute", top: -10, right: 14, background: "#3a6e33", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: "bold" }}>POPULAR</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 15, color: plan.color }}>{plan.name}</div>
                    <div style={{ fontSize: 13, color: "#5a4a32", marginTop: 2 }}><b>${plan.price}</b>{plan.period}</div>
                  </div>
                  {plan.id === profile?.subscription
                    ? <span style={{ fontSize: 12, color: "#3a6e33", fontWeight: "bold" }}>✓ Current</span>
                    : <button style={btnStyle("primary")} onClick={() => changePlan(plan.id)}>Switch</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {portalView === "profile" && (
          <div>
            <div style={pageTitle}>My Profile</div>
            <div style={subtitle}>Update your contact information.</div>
            <div style={card}>
              {showEditProfile ? (
                <div>
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
                  <button style={{ ...btnStyle("primary"), marginTop: 16, width: "100%" }} onClick={() => setShowEditProfile(true)}>Edit Profile</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e8e0d0", display: "flex", zIndex: 50, boxShadow: "0 -2px 10px rgba(0,0,0,0.08)" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setPortalView(item.id); if (item.id === "messages") markMessagesRead(); }} style={{ flex: 1, padding: "10px 4px 8px", border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, color: portalView === item.id ? "#3a6e33" : "#7a6a52", fontWeight: portalView === item.id ? "bold" : "normal" }}>{item.label}</span>
            {item.badge > 0 && <span style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: "bold", padding: "1px 5px" }}>{item.badge}</span>}
            {portalView === item.id && <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, background: "#3a6e33", borderRadius: "3px 3px 0 0" }} />}
          </button>
        ))}
      </div>

      {showNewRequest && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>New Maintenance Request</div>
            <Field label="Request Title *"><input style={inputStyle} placeholder="e.g. Leaking faucet" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} /></Field>
            <Field label="Property *"><select style={inputStyle} value={newRequest.propertyId} onChange={e => setNewRequest({ ...newRequest, propertyId: e.target.value })}><option value="">Select property…</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Description"><textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Describe the issue…" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Priority"><select style={inputStyle} value={newRequest.priority} onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
              <Field label="Preferred Date"><input style={inputStyle} type="date" value={newRequest.preferredDate} onChange={e => setNewRequest({ ...newRequest, preferredDate: e.target.value })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowNewRequest(false)}>Cancel</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={submitRequest}>Submit</button>
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
      <div style={{ ...subtitle, marginBottom: 16 }}>Chat with the Northwoods team.</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e0d0", display: "flex", flexDirection: "column", height: "calc(100vh - 280px)", minHeight: 300 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && <div style={{ textAlign: "center", color: "#bbb", fontStyle: "italic", fontSize: 13, marginTop: 60 }}>No messages yet. Send one below!</div>}
          {messages.map(m => {
            const isMe = m.from_role === "client";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>{isMe ? "You" : "Northwoods"} · {formatTime(m.created_at)}</div>
                <div style={{ maxWidth: "80%", background: isMe ? "#3a6e33" : "#f0ece4", color: isMe ? "#fff" : "#2c2416", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid #e8e0d0", padding: "12px 16px", display: "flex", gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Type a message…" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
          <button style={{ ...btnStyle("primary"), padding: "9px 16px" }} onClick={send}>Send</button>
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
    { id: "dashboard", label: "Home", icon: "⌂" },
    { id: "properties", label: "Properties", icon: "🏠" },
    { id: "workorders", label: "Orders", icon: "🔧" },
    { id: "messages", label: "Messages", icon: "💬", badge: adminUnread },
    { id: "clients", label: "Clients", icon: "👥" },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5f1eb", minHeight: "100vh", color: "#2c2416", paddingBottom: 80 }}>
      {/* Top header */}
      <div style={{ background: "#1c2b1a", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#a8c8a0" }}>Northwoods Property Services</div>
          <div style={{ fontSize: 11, color: "#6a8c64" }}>Staff Dashboard</div>
        </div>
        <button onClick={onBack} style={{ background: "transparent", border: "1px solid #3a5a34", borderRadius: 6, color: "#7a9a74", cursor: "pointer", fontSize: 12, padding: "6px 12px" }}>Sign Out</button>
      </div>

      {/* Main content */}
      <div style={{ padding: "20px 16px", maxWidth: 800, margin: "0 auto" }}>

        {view === "dashboard" && (
          <div>
            <div style={pageTitle}>Good morning 🌲</div>
            <div style={subtitle}>Here's what's happening today.</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <StatCard num={properties.length} label="Properties" color="#3a6e33" />
              <StatCard num={clients.length} label="Clients" color="#8b4513" />
              <StatCard num={workOrders.filter(w => w.status === "pending").length} label="Pending" color="#e67e22" />
              <StatCard num={workOrders.filter(w => w.priority === "high" && w.status !== "completed").length} label="High Priority" color="#c0392b" />
            </div>
            <div style={card}>
              <div style={cardTitle}>Recent Work Orders</div>
              {workOrders.slice(0, 5).map(wo => (
                <div key={wo.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0ece4" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}><PriorityDot p={wo.priority} />{wo.title}</div>
                    <div style={{ fontSize: 12, color: "#7a6a52" }}>{getPropertyName(wo.property_id)}{wo.submitted_by === "client" ? " · Client" : ""}</div>
                  </div>
                  <span style={tag(wo.status)}>{wo.status}</span>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={cardTitle}>Properties</div>
              {properties.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0ece4" }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: "#7a6a52" }}>{p.address}</div></div>
                  <span style={tag(p.status)}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "properties" && !selectedProperty && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={pageTitle}>Properties</div>
              <button style={btnStyle("primary")} onClick={() => setShowAddProperty(true)}>+ Add</button>
            </div>
            <div style={subtitle}>All managed vacation homes.</div>
            {properties.map(p => (
              <div key={p.id} onClick={() => setSelectedProperty(p)} style={{ ...card, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontWeight: "bold", fontSize: 16 }}>{p.name}</div><span style={tag(p.status)}>{p.status}</span></div>
                <div style={{ fontSize: 13, color: "#8a7a62", marginTop: 6 }}>{p.address}</div>
              </div>
            ))}
          </div>
        )}

        {view === "properties" && selectedProperty && (
          <div>
            <button style={{ ...btnStyle("secondary"), marginBottom: 16 }} onClick={() => setSelectedProperty(null)}>← Back</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div><div style={pageTitle}>{selectedProperty.name}</div><div style={subtitle}>{selectedProperty.address}</div></div>
              <span style={tag(selectedProperty.status)}>{selectedProperty.status}</span>
            </div>
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
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{wo.title}</div><div style={{ fontSize: 12, color: "#7a6a52" }}>{wo.tech || "Unassigned"} · {wo.date}</div></div>
                  <span style={tag(wo.status)}>{wo.status}</span>
                </div>
              ))}
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
            <div style={subtitle}>Registered property owners.</div>
            {clients.map(c => {
              const plan = PLANS.find(p => p.id === c.subscription);
              const cProps = properties.filter(p => p.owner_id === c.id);
              return (
                <div key={c.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
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
        )}

        {view === "staff" && (
          <div>
            <div style={pageTitle}>Staff</div>
            <div style={subtitle}>Technician assignments.</div>
            {STAFF.map(name => {
              const active = workOrders.filter(w => w.tech === name && w.status !== "completed");
              const done = workOrders.filter(w => w.tech === name && w.status === "completed");
              return (
                <div key={name} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div><div style={{ fontWeight: "bold", fontSize: 15 }}>{name}</div><div style={{ fontSize: 12, color: "#7a6a52" }}>Field Technician</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#7a6a52" }}>Active</div><div style={{ fontSize: 22, fontWeight: "bold", color: "#3a6e33" }}>{active.length}</div></div>
                  </div>
                  {active.length === 0 ? <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>No active assignments.</div>
                    : active.map(wo => <div key={wo.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f0ece4", display: "flex", justifyContent: "space-between" }}><span><PriorityDot p={wo.priority} />{wo.title}</span><span style={tag(wo.status)}>{wo.status}</span></div>)}
                  <div style={{ marginTop: 10, fontSize: 12, color: "#7a6a52" }}>{done.length} completed</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e8e0d0", display: "flex", zIndex: 50, boxShadow: "0 -2px 10px rgba(0,0,0,0.08)" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSelectedProperty(null); }} style={{ flex: 1, padding: "10px 4px 8px", border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, color: view === item.id ? "#3a6e33" : "#7a6a52", fontWeight: view === item.id ? "bold" : "normal" }}>{item.label}</span>
            {item.badge > 0 && <span style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: "bold", padding: "1px 5px" }}>{item.badge}</span>}
            {view === item.id && <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, background: "#3a6e33", borderRadius: "3px 3px 0 0" }} />}
          </button>
        ))}
      </div>

      {showAddProperty && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>Add New Property</div>
            <Field label="Property Name *"><input style={inputStyle} placeholder="Property Name" value={newProp.name} onChange={e => setNewProp({ ...newProp, name: e.target.value })} /></Field>
            <Field label="Address"><input style={inputStyle} placeholder="Address" value={newProp.address} onChange={e => setNewProp({ ...newProp, address: e.target.value })} /></Field>
            <Field label="Phone"><input style={inputStyle} placeholder="Phone" value={newProp.phone} onChange={e => setNewProp({ ...newProp, phone: e.target.value })} /></Field>
            <Field label="Email"><input style={inputStyle} placeholder="Email" value={newProp.email} onChange={e => setNewProp({ ...newProp, email: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Type"><select style={inputStyle} value={newProp.type} onChange={e => setNewProp({ ...newProp, type: e.target.value })}>{["Cabin", "Cottage", "Lodge", "Home", "Condo"].map(t => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Status"><select style={inputStyle} value={newProp.status} onChange={e => setNewProp({ ...newProp, status: e.target.value })}><option value="active">Active</option><option value="seasonal">Seasonal</option><option value="inactive">Inactive</option></select></Field>
            </div>
            <Field label="Notes"><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="Notes…" value={newProp.notes} onChange={e => setNewProp({ ...newProp, notes: e.target.value })} /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowAddProperty(false)}>Cancel</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={addProperty}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showAddWO && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 20 }}>New Work Order</div>
            <Field label="Task Title *"><input style={inputStyle} placeholder="Task Title" value={newWO.title} onChange={e => setNewWO({ ...newWO, title: e.target.value })} /></Field>
            <Field label="Property *"><select style={inputStyle} value={newWO.propertyId} onChange={e => setNewWO({ ...newWO, propertyId: e.target.value })}><option value="">Select Property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Assign Technician"><select style={inputStyle} value={newWO.tech} onChange={e => setNewWO({ ...newWO, tech: e.target.value })}><option value="">Unassigned</option>{STAFF.map(s => <option key={s}>{s}</option>)}</select></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Priority"><select style={inputStyle} value={newWO.priority} onChange={e => setNewWO({ ...newWO, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
              <Field label="Status"><select style={inputStyle} value={newWO.status} onChange={e => setNewWO({ ...newWO, status: e.target.value })}><option value="pending">Pending</option><option value="in-progress">In Progress</option></select></Field>
            </div>
            <Field label="Date"><input style={inputStyle} type="date" value={newWO.date} onChange={e => setNewWO({ ...newWO, date: e.target.value })} /></Field>
            <Field label="Notes"><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} placeholder="Notes…" value={newWO.notes} onChange={e => setNewWO({ ...newWO, notes: e.target.value })} /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => setShowAddWO(false)}>Cancel</button>
              <button style={{ ...btnStyle("primary"), flex: 2 }} onClick={addWO}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function WorkOrdersView({ workOrders, properties, getPropertyName, onNew, updateWOStatus }) {
  const [woFilter, setWoFilter] = useState("all");
  const filteredWOs = workOrders.filter(w => woFilter === "all" || w.status === woFilter);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={pageTitle}>Work Orders</div>
        <button style={btnStyle("primary")} onClick={onNew}>+ New</button>
      </div>
      <div style={subtitle}>All tasks including client requests.</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "pending", "in-progress", "completed"].map(f => (
          <button key={f} onClick={() => setWoFilter(f)} style={{ ...btnStyle(woFilter === f ? "primary" : "secondary"), padding: "8px 14px", textTransform: "capitalize", fontSize: 13 }}>{f}</button>
        ))}
      </div>
      {filteredWOs.map(wo => (
        <div key={wo.id} style={{ ...card, borderLeft: `4px solid ${priorityColors[wo.priority]}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15, flex: 1, marginRight: 8 }}>{wo.title}</div>
            <span style={tag(wo.status)}>{wo.status}</span>
          </div>
          <div style={{ fontSize: 13, color: "#7a6a52", marginBottom: 4 }}>🏠 {getPropertyName(wo.property_id)}</div>
          {wo.tech && <div style={{ fontSize: 13, color: "#5a7a52", marginBottom: 4 }}>👷 {wo.tech}</div>}
          {wo.date && <div style={{ fontSize: 12, color: "#9a8a72", marginBottom: 8 }}>📅 {wo.date}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0ece4" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: wo.submitted_by === "client" ? "#e8f0fe" : "#f0ece4", color: wo.submitted_by === "client" ? "#1a5cb5" : "#7a6a52" }}>{wo.submitted_by === "client" ? "Client Request" : "Staff"}</span>
            {wo.status !== "completed" && (
              <select style={{ ...inputStyle, width: 130, fontSize: 12 }} value={wo.status} onChange={e => updateWOStatus(wo.id, e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            )}
            {wo.status === "completed" && <span style={{ fontSize: 12, color: "#27ae60" }}>✓ Done</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskBoard({ workOrders, getPropertyName, onNew, updateWOStatus }) {
  const [staffFilter, setStaffFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const allTechs = [...new Set(workOrders.map(w => w.tech).filter(Boolean))];
  const filtered = workOrders.filter(w => (staffFilter === "all" || w.tech === staffFilter) && (priorityFilter === "all" || w.priority === priorityFilter));
  const columns = [
    { id: "pending", label: "Pending", color: "#e67e22" },
    { id: "in-progress", label: "In Progress", color: "#1a5cb5" },
    { id: "completed", label: "Completed", color: "#1e7e34" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={pageTitle}>Task Board</div>
        <button style={btnStyle("primary")} onClick={onNew}>+ New</button>
      </div>
      <div style={subtitle}>Tasks by status.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select style={{ ...inputStyle, width: 150 }} value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
          <option value="all">All Staff</option>
          {allTechs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 140 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      {columns.map(col => {
        const colTasks = filtered.filter(w => w.status === col.id);
        return (
          <div key={col.id} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <div style={{ fontWeight: "bold", fontSize: 13, color: "#1c2b1a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.label}</div>
              <div style={{ background: "#f0ece4", color: col.color, borderRadius: 20, fontSize: 11, fontWeight: "bold", padding: "1px 9px" }}>{colTasks.length}</div>
            </div>
            {colTasks.length === 0 && <div style={{ border: "2px dashed #e0d8cc", borderRadius: 10, padding: "16px", textAlign: "center", color: "#ccc", fontSize: 12 }}>No tasks</div>}
            {colTasks.map(wo => (
              <div key={wo.id} style={{ ...card, borderLeft: `4px solid ${priorityColors[wo.priority]}` }}>
                <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 6 }}>{wo.title}</div>
                <div style={{ fontSize: 12, color: "#7a6a52", marginBottom: 4 }}>🏠 {getPropertyName(wo.property_id)}</div>
                {wo.tech ? <div style={{ fontSize: 12, color: "#5a7a52", marginBottom: 4 }}>👷 {wo.tech}</div> : <div style={{ fontSize: 12, color: "#bbb", marginBottom: 4 }}>👷 Unassigned</div>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                  {col.id !== "pending" && <button onClick={() => updateWOStatus(wo.id, col.id === "in-progress" ? "pending" : "in-progress")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #d0c8bc", background: "#f5f1eb", cursor: "pointer" }}>← Back</button>}
                  {col.id !== "completed" && <button onClick={() => updateWOStatus(wo.id, col.id === "pending" ? "in-progress" : "completed")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "none", background: "#3a6e33", color: "#fff", cursor: "pointer" }}>→ Forward</button>}
                </div>
              </div>
            ))}
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
      <div style={subtitle}>Client conversations.</div>
      {!selectedClientId ? (
        <div>
          {threads.map(t => (
            <div key={t.client.id} onClick={() => selectThread(t.client.id)} style={{ ...card, cursor: "pointer", borderLeft: t.unread > 0 ? "4px solid #c0392b" : "4px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 15 }}>{t.client.first_name} {t.client.last_name}</div>
                  {t.lastMsg ? <div style={{ fontSize: 12, color: "#7a6a52", marginTop: 3 }}>{t.lastMsg.from_role === "admin" ? "You: " : ""}{t.lastMsg.text.slice(0, 50)}{t.lastMsg.text.length > 50 ? "…" : ""}</div>
                    : <div style={{ fontSize: 12, color: "#bbb", marginTop: 3, fontStyle: "italic" }}>No messages yet</div>}
                </div>
                {t.unread > 0 && <span style={{ background: "#c0392b", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: "bold", padding: "2px 8px" }}>{t.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button style={{ ...btnStyle("secondary"), marginBottom: 16 }} onClick={() => setSelectedClientId(null)}>← Back to conversations</button>
          <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 16 }}>{selected?.client.first_name} {selected?.client.last_name}</div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e0d0", display: "flex", flexDirection: "column", height: "calc(100vh - 320px)", minHeight: 300 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {selected?.thread.length === 0 && <div style={{ textAlign: "center", color: "#bbb", fontStyle: "italic", fontSize: 13, marginTop: 60 }}>No messages yet.</div>}
              {selected?.thread.map(m => {
                const isAdmin = m.from_role === "admin";
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>{isAdmin ? "You" : selected.client.first_name} · {formatTime(m.created_at)}</div>
                    <div style={{ maxWidth: "80%", background: isAdmin ? "#1c2b1a" : "#f0ece4", color: isAdmin ? "#d9e8d5" : "#2c2416", borderRadius: isAdmin ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: "1px solid #e8e0d0", padding: "12px 16px", display: "flex", gap: 10 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder={`Reply to ${selected?.client.first_name}…`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
              <button style={{ ...btnStyle("primary"), padding: "9px 16px" }} onClick={send}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}