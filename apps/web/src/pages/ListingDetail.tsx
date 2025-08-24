import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  // Hooks must be unconditionally declared (no returns before these)
  const listingQ = useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.get(`/listings/${id}`).then(r => r.data),
    retry: 1
  });

  const commentsQ = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api.get(`/listings/${id}/comments`).then(r => r.data),
    enabled: !!id
  });

  const [text, setText] = useState("");

  const addComment = useMutation({
    mutationFn: () => api.post(`/listings/${id}/comments`, { text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    }
  });

  const startChat = useMutation({
    mutationFn: () => api.post(`/chats`, { listingId: id }),
    onSuccess: (res) => nav(`/messages?chat=${res.data._id}`)
  });

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => api.get("/users/me").then(r => r.data) });
  
  const removeListing = useMutation({
    mutationFn: () => api.delete(`/listings/${id}`),
    onSuccess: () => { alert("Listing deleted"); nav("/", { replace: true }); }
  });

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Safe derived values that can run even before data arrives
  const listing = listingQ.data;
  const owner = typeof listing?.ownerId === "object" ? listing.ownerId : null;
  const isOwner = me && listing?.ownerId && (listing.ownerId._id ? listing.ownerId._id === me._id : String(listing.ownerId) === me._id);

  const details = useMemo(() => {
    if (!listing) return [];
    const loc = listing.location?.label || "";
    if (listing.type === "sale") {
      return [
        ["Price", listing.price != null ? currency(listing.price) : "—"],
        ["Pickup (meetup)", listing.pickup?.label || loc || "—"],
        ["Condition", listing.condition || "—"],
        ["Negotiable", listing.negotiable ? "Yes" : "No"]
      ];
    }
    if (listing.type === "lost") {
      return [["Last seen (approx.)", listing.lostFound?.label || loc || "Not provided"]];
    }
    return [
      ["Found at", listing.lostFound?.label || loc || "—"],
      ["Pickup for owner", listing.pickup?.label || "—"]
    ];
  }, [listing]);

  // Render branches AFTER all hooks are defined
  if (listingQ.isLoading) return <div className="empty">Loading…</div>;
  if (listingQ.isError) {
    const msg = (listingQ.error as any)?.response?.data?.error || (listingQ.error as any)?.message || "Could not load this post";
    return (
      <div className="card pad">
        <div className="title" style={{ marginBottom: 8 }}>Error</div>
        <div className="muted" style={{ marginBottom: 12 }}>{msg}</div>
        <button className="btn" onClick={() => nav("/", { replace: true })}>Back to home</button>
      </div>
    );
  }
  if (!listing) return <div className="empty">Not found</div>;

  return (
    <div className="grid-2">
      <div className="card">
        <img className="item-img" src={listing.images?.[0] || `https://picsum.photos/seed/${listing._id}/1000/700`} />
        <div className="pad" style={{ padding: "12px 14px" }}>
          <div className="row">
            <div className="title">{listing.title}</div>
            <span className={`badge ${listing.type}`}>{listing.type}</span>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>{listing.description}</div>

          <div className="card pad" style={{ marginTop: 12 }}>
            <div className="title" style={{ marginBottom: 8 }}>Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
              {details.map(([label, value]: any) => (
                <React.Fragment key={label}>
                  <div className="muted" style={{ fontSize: 13 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{value || "—"}</div>
                </React.Fragment>
              ))}
              <div className="muted" style={{ fontSize: 13 }}>Category</div>
              <div style={{ fontWeight: 600 }}>{listing.category}</div>
              <div className="muted" style={{ fontSize: 13 }}>Status</div>
              <div style={{ fontWeight: 600 }}>{listing.status}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card pad">
        <div className="title" style={{ marginBottom: 8 }}>Posted by</div>
        {owner ? (
          <div>
            <div style={{ fontWeight: 600 }}>{owner.name || owner.email}</div>
            <div className="muted" style={{ fontSize: 14 }}>{owner.email}</div>
            <div className="badges" style={{ marginTop: 8 }}>
              {owner.hostel && <span className="badge">Hostel: {owner.hostel}</span>}
              {owner.department && <span className="badge">Dept: {owner.department}</span>}
              {owner.gradYear && <span className="badge">Batch: {owner.gradYear}</span>}
              {owner.phone && <span className="badge">📞 {owner.phone}</span>}
              {owner.whatsapp && <span className="badge">WhatsApp: {owner.whatsapp}</span>}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => startChat.mutate()}>Message</button>
              {isOwner && (
                <button
                  className="btn"
                  onClick={() => { if (confirm("Delete this listing?")) removeListing.mutate(); }}
                >
                  Delete listing
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="muted">User info unavailable</div>
        )}

        <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "16px 0" }} />

        <div className="title" style={{ marginBottom: 8 }}>Comments</div>
        <div style={{ display: "grid", gap: 8 }}>
          {commentsQ.data?.length ? (
            commentsQ.data.map((c: any) => (
              <div key={c._id} className="card pad" style={{ padding: 10 }}>
                <div style={{ fontWeight: 600 }}>{c.userId?.name || c.userId?.email || "User"}</div>
                <div style={{ fontSize: 14 }}>{c.text}</div>
              </div>
            ))
          ) : (
            <div className="muted">No comments yet.</div>
          )}
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Add a comment…" value={text} onChange={(e)=>setText(e.target.value)} />
          <button className="btn primary" onClick={() => addComment.mutate()}>Post</button>
        </div>
      </div>
    </div>
  );
}

function currency(n: number) {
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
}