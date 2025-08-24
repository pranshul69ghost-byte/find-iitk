import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";

const categories = ["All Categories","Electronics","Books","Cycles","Room Essentials","Clothing","Misc"];

export default function Home({ openPostModal: _ }: { openPostModal?: () => void }) {
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all");
  const [type, setType] = useState("all"); const [min, setMin] = useState(""); const [max, setMax] = useState("");
  const [sort, setSort] = useState("updatedAt_desc");
  const [showFilters, setShowFilters] = useState(false);

  const params: any = useMemo(() => {
    const p: any = {};
    if (type !== "all") p.type = type;
    if (cat !== "all") p.category = cat;
    if (q) p.q = q;
    if (min) p.minPrice = min;
    if (max) p.maxPrice = max;
    return p;
  }, [q, cat, type, min, max]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["listings", params, sort],
    queryFn: () => api.get("/listings", { params }).then(r => r.data)
  });

  useEffect(() => {
    const id = setTimeout(() => { refetch(); }, 300); // debounce
    return () => clearTimeout(id);
  }, [q, cat, type, min, max, sort]);

  const items = useMemo(() => {
    let arr = (data || []).slice();
    if (sort === "price_asc") arr.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    else if (sort === "price_desc") arr.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
    else arr.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return arr;
  }, [data, sort]);

  return (
    <>
      <div className="only-mobile" style={{ marginBottom:8 }}>
        <button className="btn" onClick={()=>setShowFilters(s=>!s)}>{showFilters?"Hide":"Show"} Filters</button>
      </div>
      {(showFilters || window.innerWidth>=640) && (
        <div className="card pad" style={{ marginBottom: 12 }}>
          <div className="filters">
            <input placeholder="Search (e.g., cycle, charger, wallet)" value={q} onChange={e => setQ(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&refetch()} />
            <select value={cat} onChange={e => setCat(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="sale">For Sale</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <input type="number" placeholder="Min ₹" value={min} onChange={e => setMin(e.target.value)} />
            <input type="number" placeholder="Max ₹" value={max} onChange={e => setMax(e.target.value)} />
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="updatedAt_desc">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? <div className="empty">Loading…</div> :
        items?.length ? (
          <div className="grid">
            {items.map((it: any) => <Card key={it._id} item={it} />)}
          </div>
        ) : (
          <div className="empty">No items match your filters yet.</div>
        )
      }
    </>
  );
}

function Card({ item }: { item: any }) {
  const badgeClass = `badge ${item.type}`;
  return (
    <article className="card">
      <Link to={`/listing/${item._id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <img className="item-img" src={item.images?.[0] || `https://picsum.photos/seed/${item._id}/800/600`} />
        <div className="pad" style={{ padding: "10px 12px" }}>
          <div className="row">
            <div className="title truncate" title={item.title}>{item.title}</div>
            <span className={badgeClass}>{item.type}</span>
          </div>
          <div className="muted truncate" style={{ fontSize: 14 }}>{item.description}</div>
          <div className="row" style={{ marginTop: 6, fontSize: 14 }}>
            <div>{item.type === "sale" ? currency(item.price) : (item.location?.label || "Campus")}</div>
            <div className="muted">{timeAgo(item.updatedAt)}</div>
          </div>
          <div className="badges" style={{ marginTop: 6 }}>
            <span className="badge">{item.category}</span>
            <span className="badge">{item.status}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
function currency(n?: number){ return n==null? "" : new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n); }
function timeAgo(ts: string){ const m=Math.floor((Date.now()-new Date(ts).getTime())/60000); if(m<60) return m+"m ago"; const h=Math.floor(m/60); if(h<24) return h+"h ago"; const d=Math.floor(h/24); return d+"d ago"; }