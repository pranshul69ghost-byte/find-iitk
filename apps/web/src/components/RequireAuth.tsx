import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
function token(){ return localStorage.getItem("token") || ""; }
export default function RequireAuth({ children }: { children: ReactElement }) {
  const loc = useLocation();
  if (!token()) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  return children;
}