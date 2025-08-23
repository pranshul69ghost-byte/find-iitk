import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

async function uploadFiles(files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const token = getToken();
  const res = await api.post("/files/upload", fd, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  return res.data.urls as string[];
}

export default function PostListing() {
  const [form, setForm] = useState<any>({
    type: "sale",
    title: "",
    description: "",
    category: "",
    price: "",
    condition: "used",
    negotiable: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const isAuthed = Boolean(getToken());
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthed) {
      // optionally redirect or show message
    }
  }, [isAuthed]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let images: string[] = [];
      if (files.length) {
        images = await uploadFiles(files);
      }
      const payload: any = {
        ...form,
        images,
        price: form.type === "sale" ? Number(form.price) : undefined
      };
      const token = getToken();
      const res = await api.post("/listings", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return res.data;
    },
    onSuccess: () => {
      alert("Posted!");
      setFiles([]);
      setForm((f: any) => ({ ...f, title: "", description: "", category: "", price: "" }));
      qc.invalidateQueries({ queryKey: ["listings"] });
    }
  });

  if (!isAuthed) {
    return (
      <div className="max-w-lg">
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded mb-3">
          You must log in with your IITK email to post. Go to the Profile page to log in via OTP.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
      className="max-w-lg space-y-3"
    >
      <div className="flex gap-2">
        {["sale", "lost", "found"].map((t) => (
          <label
            key={t}
            className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${form.type === t ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            <input type="radio" name="type" value={t} className="hidden" checked={form.type === t} onChange={() => setForm((f: any) => ({ ...f, type: t }))} />
            {t.toUpperCase()}
          </label>
        ))}
      </div>
      <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} required />
      <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
      <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))} />

      {form.type === "sale" && (
        <>
          <input className="input" placeholder="Price ₹" value={form.price} onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))} />
          <select className="input" value={form.condition} onChange={(e) => setForm((f: any) => ({ ...f, condition: e.target.value }))}>
            <option value="used">Used</option>
            <option value="new">New</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm((f: any) => ({ ...f, negotiable: e.target.checked }))} />
            Negotiable
          </label>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Images (up to 5)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block"
        />
        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <img key={i} src={src} className="h-24 w-full object-cover rounded border" />
            ))}
          </div>
        )}
      </div>

      <button disabled={isPending} className="bg-blue-600 text-white px-4 py-2 rounded">
        {isPending ? "Posting..." : "Post"}
      </button>

      <style>{`.input{width:100%;padding:.6rem .8rem;border:1px solid #e5e7eb;border-radius:.5rem}`}</style>
    </form>
  );
}