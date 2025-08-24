import { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [tab, setTab] = useState<"login"|"register">("login");
  return (
    <div className="card pad" style={{ maxWidth: 520, margin: "20px auto" }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={`btn ${tab==="login"?"primary":""}`} onClick={()=>setTab("login")}>Login</button>
        <button className={`btn ${tab==="register"?"primary":""}`} onClick={()=>setTab("register")}>Register</button>
      </div>
      {tab==="login" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}

function LoginForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    try{
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      // Fetch profile to decide redirect
      const me = await api.get("/users/me", { headers: { Authorization: `Bearer ${data.token}` }}).then(r=>r.data);
      if (!me?.phone) nav("/me?complete=1", { replace: true }); else nav("/", { replace: true });
    }catch(e:any){ setMsg(e?.response?.data?.error || "Login failed"); }
  }

  return (
    <div className="form">
      <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@iitk.ac.in" /></div>
      <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <div className="row">
        <button className="btn primary" onClick={submit}>Login</button>
      </div>
      {msg && <div className="muted" style={{ marginTop:8 }}>{msg}</div>}
    </div>
  );
}

function RegisterForm() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendCode(){
    setMsg("Sending code…");
    try{
      await api.post("/auth/register/request-otp", { email });
      setSent(true);
      setMsg("Code sent to your email.");
    }catch(e:any){
      setMsg(e?.response?.data?.error || "Failed to send code");
    }
  }

  async function submit(){
    setMsg("Creating account…");
    try{
      const { data } = await api.post("/auth/register", { username, email, password, code });
      localStorage.setItem("token", data.token);
      // go to profile to complete phone
      nav("/me?complete=1", { replace: true });
    }catch(e:any){
      setMsg(e?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="form">
      <div><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Your display name" /></div>
      <div><label>IITK Email</label>
        <div style={{ display:"flex", gap:8 }}>
          <input style={{ flex:1 }} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@iitk.ac.in" />
          <button className="btn" onClick={sendCode} disabled={!email || sent}>Send code</button>
        </div>
      </div>
      <div><label>OTP code</label><input value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit code" /></div>
      <div><label>Password (min 8)</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <div className="row"><button className="btn primary" onClick={submit}>Create account</button></div>
      {msg && <div className="muted" style={{ marginTop:8 }}>{msg}</div>}
    </div>
  );
}