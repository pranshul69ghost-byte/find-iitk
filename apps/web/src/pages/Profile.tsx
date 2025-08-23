import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function Profile() {
  const nav = useNavigate();
  const loc = useLocation();
  const [me, setMe] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [banner, setBanner] = useState<{ kind: "warn" | "ok"; text: string } | null>(null);

  // If redirected from a protected page, we include ?complete=1 and state.from
  const mustComplete = new URLSearchParams(loc.search).get("complete") === "1";
  const backTo = (loc.state as any)?.from || "/";

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/users/me");
      setMe(data);
      if (mustComplete || !data?.phone) {
        setBanner({
          kind: "warn",
          text: "Phone number is required to use IITK Market. Please add a reachable phone number and save to continue."
        });
      }
    })();
  }, []);

  const phoneOk = useMemo(() => !!(me?.phone && /^\+?[0-9]{7,15}$/.test(String(me.phone))), [me?.phone]);

  if (!me) return <div className="empty">Loading…</div>;

  return (
    <div className="card pad">
      {banner && (
        <div className={`callout ${banner.kind === "warn" ? "callout-warn" : "callout-ok"}`} style={{ marginBottom: 12 }}>
          {banner.text}
          {(loc.state as any)?.from && banner.kind === "warn" && (
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              You were trying to open: {(loc.state as any).from}
            </div>
          )}
        </div>
      )}

      <h3 className="title" style={{ marginBottom: 8 }}>Profile & Contact</h3>

      <div className="form">
        <div>
          <label>Name</label>
          <input value={me.name || ""} onChange={(e) => setMe({ ...me, name: e.target.value })} />
        </div>

        <div>
          <label>Phone (required)</label>
          <input
            placeholder="+91XXXXXXXXXX"
            value={me.phone || ""}
            onChange={(e) => setMe({ ...me, phone: e.target.value })}
            onBlur={() => setTouchedPhone(true)}
            style={!phoneOk && touchedPhone ? { borderColor: "var(--lost)" } : undefined}
          />
          {!phoneOk && touchedPhone && (
            <div style={{ color: "var(--lost)", fontSize: 12, marginTop: 4 }}>
              Enter a valid phone number (7–15 digits, +country code allowed).
            </div>
          )}
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Phone is only visible to people you chat with or deal with.
          </div>
        </div>

        <div>
          <label>Alt Email</label>
          <input value={me.altEmail || ""} onChange={(e) => setMe({ ...me, altEmail: e.target.value })} />
        </div>

        <div>
          <label>WhatsApp</label>
          <input value={me.whatsapp || ""} onChange={(e) => setMe({ ...me, whatsapp: e.target.value })} />
        </div>

        <div className="full">
          <label>Bio</label>
          <textarea rows={3} value={me.bio || ""} onChange={(e) => setMe({ ...me, bio: e.target.value })} />
        </div>

        <div>
          <label>Hostel</label>
          <input value={me.hostel || ""} onChange={(e) => setMe({ ...me, hostel: e.target.value })} />
        </div>

        <div>
          <label>Department</label>
          <input value={me.department || ""} onChange={(e) => setMe({ ...me, department: e.target.value })} />
        </div>

        <div>
          <label>Batch (Year)</label>
          <input type="number" value={me.gradYear || ""} onChange={(e) => setMe({ ...me, gradYear: +e.target.value })} />
        </div>

        <div className="full" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn primary"
            disabled={saving || !phoneOk}
            onClick={async () => {
              setSaving(true);
              try {
                await api.patch("/users/me", me);
                if (mustComplete && phoneOk) {
                  // Completed the requirement; let user continue to their original page
                  nav(backTo, { replace: true });
                } else {
                  setBanner({ kind: "ok", text: "Profile saved." });
                }
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {!phoneOk && <span className="muted" style={{ fontSize: 12 }}>Save is disabled until phone is valid.</span>}
        </div>
      </div>
    </div>
  );
}