import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import type { ReactElement } from "react";

export default function RequirePhone({ children }: { children: ReactElement }) {
  const loc = useLocation();
  const { data, isLoading } = useQuery({ queryKey: ["me-guard"], queryFn: ()=> api.get("/users/me").then(r=>r.data) });
  if (isLoading) return <div className="empty">Loading…</div>;
  if (!data?.phone) return <Navigate to="/me?complete=1" state={{ from: loc.pathname + loc.search }} replace />;
  return children;
}