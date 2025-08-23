import { Navigate, useLocation } from "react-router-dom";
function token(){ return localStorage.getItem("token") || ""; }
export default function RequireAuth({ children }: { children: JSX.Element }) {
  const loc = useLocation();
  if (!token()) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  return children;
}