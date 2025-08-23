import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

function token(){ return localStorage.getItem("token") || ""; }
async function uploadFiles(files: File[]) {
  if (!files.length) return [];
  const fd = new FormData(); files.forEach(f => fd.append("files", f));
  const res = await api.post("/files/upload", fd); // auth added by interceptor
  return (res.data.urls || []) as string[];
}

const categories = ["Electronics","Books","Cycles","Room Essentials","Clothing","Misc"];

const ListingModal = forwardRef<HTMLDialogElement>(function ListingModal(_props, ref) {
  const dialogRef = (ref as any) || useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<"sale"|"lost"|"found">("sale");
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // New: separate location fields
  const [pickup, setPickup] = useState("");      // sale only
  const [lfLocation, setLfLocation] = useState(""); // lost/found only

  const [price, setPrice] = useState<string>("");
  const [neg, setNeg] = useState("false");
  const [condition, setCondition] = useState("good");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);
  const [msg, setMsg] = useState("");

  // Body scroll lock while open
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const lock = () => { document.documentElement.style.overflowY = "hidden"; };
    const unlock = () => { document.documentElement.style.overflowY = ""; };
    const onClose = () => unlock();
    const onCancel = (e: Event) => { e.preventDefault(); d.close(); };
    d.addEventListener("close", onClose);
    d.addEventListener("cancel", onCancel);
    const obs = new MutationObserver(() => { if (d.open) lock(); else unlock(); });
    obs.observe(d, { attributes: true, attributeFilter: ["open"] });
    return () => { d.removeEventListener("close", onClose); d.removeEventListener("cancel", onCancel); obs.disconnect(); unlock(); };
  }, []);

  // Backdrop click only (no rect math that breaks selects/files)
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const handler = (e: MouseEvent) => {
      if (e.target === d) d.close(); // only when clicking the backdrop area
    };
    d.addEventListener("mousedown", handler);
    return () => d.removeEventListener("mousedown", handler);
  }, []);

  async function publish() {
    try {
      if (!token()) { setMsg("Login required (Profile → OTP)"); return; }
      if (!title.trim() || !desc.trim()) { setMsg("Title and description required"); return; }
      const images = await uploadFiles(files);
      const payload: any = {
        type, title, description: desc, category, images, status: "active",
        tags: tags ? tags.split(",").map(s=>s.trim()).filter(Boolean) : undefined,
      };
      if (type === "sale") {
        payload.price = Number(price) || 0;
        payload.negotiable = neg === "true";
        payload.condition = "used";
        if (pickup.trim()) payload.pickup = { label: pickup.trim() };
      } else {
        if (lfLocation.trim()) payload.lostFound = { label: lfLocation.trim() };
      }
      await api.post("/listings", payload);
      setMsg("Posted!"); clear(); dialogRef.current?.close(); setTimeout(()=>window.location.reload(), 50);
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Failed to post");
    }
  }

  function clear() {
    setType("sale"); setCategory(categories[0]); setTitle(""); setDesc("");
    setPickup(""); setLfLocation(""); setPrice(""); setNeg("false"); setCondition("good"); setTags(""); setFiles([]);
  }

  return (
    <dialog ref={dialogRef} aria-label="Create a listing">
      <div className="modal-head">
        <strong>Create a listing</strong>
        <button className="btn ghost" onClick={() => dialogRef.current?.close()} aria-label="Close">✕</button>
      </div>
      <div className="modal-body">
        <div className="form">
          <div><label>Type</label>
            <select value={type} onChange={(e)=>setType(e.target.value as any)}>
              <option value="sale">For Sale</option><option value="lost">Lost</option><option value="found">Found</option>
            </select>
          </div>
          <div><label>Category</label>
            <select value={category} onChange={(e)=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div><label>Title</label>
            <input placeholder="e.g., Btwin cycle / Lost wallet near Hall 3" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          {type==="sale" ? (
            <div><label>Pickup location</label>
              <input placeholder="Hall-X / Canteen / Library" value={pickup} onChange={e=>setPickup(e.target.value)} />
            </div>
          ) : (
            <div><label>Where was it {type==="lost"?"lost":"found"}?</label>
              <input placeholder="Library / SAC / Hall 3" value={lfLocation} onChange={e=>setLfLocation(e.target.value)} />
            </div>
          )}
          <div className="full"><label>Description</label>
            <textarea rows={4} placeholder="Details, features, identifiers…" value={desc} onChange={e=>setDesc(e.target.value)} />
          </div>
          {type==="sale" && (
            <>
              <div><label>Price (₹)</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} />
              </div>
              <div><label>Negotiable?</label>
                <select value={neg} onChange={e=>setNeg(e.target.value)}><option value="false">No</option><option value="true">Yes</option></select>
              </div>
              <div><label>Condition</label>
                <select value={condition} onChange={e=>setCondition(e.target.value)}>
                  <option value="new">New</option><option value="like-new">Like New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
                </select>
              </div>
            </>
          )}
          <div className="full"><label>Tags (comma separated)</label>
            <input placeholder="cycle, btwin, blue" value={tags} onChange={e=>setTags(e.target.value)} />
          </div>
          <div className="full"><label>Photos</label>
            <input type="file" accept="image/*" multiple onChange={(e)=>setFiles(Array.from(e.target.files||[]))} />
            {previews.length>0 && <div className="chips" style={{marginTop:8}}>
              {previews.map((src,i)=><img key={i} src={src} style={{height:56,width:56,objectFit:"cover",borderRadius:12,border:"1px solid var(--border)"}} />)}
            </div>}
          </div>
        </div>
        {msg && <div className="muted" style={{marginTop:8}}>{msg}</div>}
      </div>
      <div className="footer">
        <button className="btn ghost" onClick={()=>dialogRef.current?.close()}>Cancel</button>
        <button className="btn primary" onClick={publish}>Publish</button>
      </div>
    </dialog>
  );
});

export default ListingModal;