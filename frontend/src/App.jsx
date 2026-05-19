import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Inventario from "./pages/Inventario.jsx";
import NuevaVenta from "./pages/NuevaVenta.jsx";
import Facturas from "./pages/Facturas.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard",    icon: "📊" },
  { id: "inventario", label: "Inventario",  icon: "📦" },
  { id: "venta",      label: "Nueva Venta", icon: "🧾" },
  { id: "facturas",   label: "Facturas",    icon: "📁" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");

  const render = () => {
    if (page === "dashboard")  return <Dashboard onNav={setPage} />;
    if (page === "inventario") return <Inventario />;
    if (page === "venta")      return <NuevaVenta />;
    if (page === "facturas")   return <Facturas />;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>📦 StockSystem</h2>
          <span>v1.0 · Chiclayo</span>
        </div>
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-item ${page === p.id ? "active" : ""}`}
            onClick={() => setPage(p.id)}
          >
            <span className="nav-icon">{p.icon}</span>
            {p.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "rgba(255,255,255,.25)", letterSpacing: 1 }}>
            Hecho en Chiclayo 🇵🇪
          </span>
        </div>
      </aside>
      <main className="main">{render()}</main>
    </div>
  );
}
