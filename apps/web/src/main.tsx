import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const client = new QueryClient();
const base = import.meta.env.BASE_URL.replace(/\/$/, ""); // e.g. "/find-iitk"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);