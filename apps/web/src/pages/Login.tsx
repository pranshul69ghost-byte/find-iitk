import { useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"request"|"verify">("request");
  const [msg, setMsg] = useState<{k:"info"|"ok"|"error"; text: string} | null>(null);

  const send = async () => {
    if(!/@iitk\.ac\.in$/i.test(email)) return setMsg({k:"error", text:"Use IITK email (@iitk.ac.in)"});
    setMsg({k:"info", text:"Sending code…"});
    try{ await api.post("/auth/request-otp", { email }); setMsg({k:"ok", text:"Code sent. Check inbox."}); setPhase("verify"); }
    catch(e:any){ setMsg({k:"error", text:e?.response?.data?.error || "Failed to send code"}); }
  };
  const verify = async () => {
    setMsg({k:"info", text:"Verifying…"});
    try{
      const res = await api.post("/auth/verify-otp", { email, code, name });
      localStorage.setItem("token", res.data.token);
      setMsg({k:"ok", text:"Logged in"});
      nav("/me?complete=1", { replace: true });
    }catch(e:any){ setMsg({k:"error", text:e?.response?.data?.error || "Verification failed"}); }
  };

  return (
    <main className="container" style={{ maxWidth: 680 }}>
      <div className="card pad">
        <div className="title" style={{ marginBottom: 8 }}>Login (IITK OTP)</div>
        {phase==="request" ? (
          <div className="form">
            <div><label>Name (optional)</label><input placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} /></div>
            <div className="full"><label>IITK Email</label><input placeholder="…@iitk.ac.in" value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
            <div className="full"><button className="btn primary" onClick={send}>Send Code</button></div>
          </div>
        ) : (
          <div className="form">
            <div className="full muted">Code sent to <strong>{email}</strong></div>
            <div><label>6-digit code</label><input placeholder="Enter code" value={code} onChange={(e)=>setCode(e.target.value)} /></div>
            <div className="flex"><button className="btn primary" onClick={verify}>Verify & Login</button><button className="btn" onClick={()=>setPhase("request")}>Change email</button></div>
          </div>
        )}
        {msg && <div style={{marginTop:8,padding:"8px 10px",border:"1px solid var(--border)",borderRadius:10, background:msg.k==="error"?"rgba(239,68,68,.12)":(msg.k==="ok"?"rgba(16,185,129,.12)":"var(--chip)")}}>{msg.text}</div>}
      </div>
    </main>
  );
}