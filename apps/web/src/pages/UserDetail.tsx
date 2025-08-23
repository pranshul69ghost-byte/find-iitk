import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useParams } from "react-router-dom";

export default function UserDetail(){
  const { id } = useParams();
  const { data } = useQuery({ queryKey:["user", id], queryFn: ()=> api.get(`/users/${id}`).then(r=>r.data) });
  if (!data) return <div className="empty">Loading…</div>;
  const u = data;
  return (
    <div className="card pad">
      <div className="title" style={{ marginBottom: 8 }}>{u.name || u.email}</div>
      <div className="badges" style={{ marginBottom: 8 }}>
        {u.hostel && <span className="badge">Hostel: {u.hostel}</span>}
        {u.department && <span className="badge">Dept: {u.department}</span>}
        {u.gradYear && <span className="badge">Batch: {u.gradYear}</span>}
      </div>
      <div className="form">
        <div><label>Email</label><input value={u.email} readOnly /></div>
        {u.phone && <div><label>Phone</label><input value={u.phone} readOnly /></div>}
        {u.telegram && <div><label>Telegram</label><input value={u.telegram} readOnly /></div>}
        {u.whatsapp && <div><label>WhatsApp</label><input value={u.whatsapp} readOnly /></div>}
        {u.bio && <div className="full"><label>Bio</label><textarea value={u.bio} readOnly rows={3} /></div>}
      </div>
    </div>
  );
}