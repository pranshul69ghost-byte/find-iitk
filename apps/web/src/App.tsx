import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import UserDetail from "./pages/UserDetail";
import { useEffect, useRef, useState } from "react";
import ListingModal from "./components/ListingModal";
import RequireAuth from "./components/RequireAuth";
import RequirePhone from "./components/RequirePhone";
import "./styles/ui.css";
import "./styles/responsive.css";
// apps/web/src/App.tsx (top of file)
import logoUrl from "./assets/find-at-iitk-icon.svg"

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, setTheme };
}
function token(){ return localStorage.getItem("token") || ""; }

export default function App() {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const authed = !!token();

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  };

  return (
    <div>
      {authed && (
        <header>
          <div className="nav" style={{ maxWidth: "100%" }}>
            <a className="brand" href="#" onClick={(e)=>{e.preventDefault(); nav("/");}}>
              <img 
                src={logoUrl} 
                alt="Find@IITK Logo"
                style={{ height: "24px", width: "24px", marginRight: "1px" }}
              />
              <span>Find@IITK</span>
            </a>
            <div style={{ marginLeft: 12 }} className="flex">
              <NavLink to="/" className="btn">Home</NavLink>
              <NavLink to="/messages" className="btn">Messages</NavLink>
              <button className="btn primary" onClick={() => modalRef.current?.showModal()}>Post Item</button>
            </div>
            <div style={{ marginLeft: "auto" }} className="flex">
              <NavLink to="/me" className="btn">Profile</NavLink>
              <button className="btn" onClick={logout}>Logout</button>
              <select
                aria-label="Theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="btn"
                style={{ paddingRight: 8, minWidth: 110 }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="midnight">Midnight</option>
                <option value="ocean">Ocean</option>
                <option value="grape">Grape</option>
                <option value="forest">Forest</option>
                <option value="sunset">Sunset</option>
              </select>
            </div>
          </div>
        </header>
      )}

      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <RequireAuth>
              <RequirePhone>
                <Home openPostModal={() => modalRef.current?.showModal()} />
              </RequirePhone>
            </RequireAuth>
          } />
          <Route path="/listing/:id" element={
            <RequireAuth>
              <RequirePhone>
                <ListingDetail />
              </RequirePhone>
            </RequireAuth>
          } />
          <Route path="/me" element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          } />
          <Route path="/messages" element={
            <RequireAuth>
              <RequirePhone>
                <Messages />
              </RequirePhone>
            </RequireAuth>
          } />
          <Route path="/user/:id" element={
            <RequireAuth>
              <UserDetail />
            </RequireAuth>
          } />
          <Route path="*" element={<div className="card pad">Not found</div>} />
        </Routes>
      </main>

      <ListingModal ref={modalRef} />
    </div>
  );
}