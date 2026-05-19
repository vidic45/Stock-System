import { useState, useEffect } from "react";

const API = "http://localhost:3001";

export default function Dashboard({ onNav }) {
  const [stats, setStats] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/stats`).then(r => r.json()),
      fetch(`${API}/productos`).then(r => r.json()),
    ]).then(([s, prods]) => {
      setStats(s);
      setAlertas(prods.filter(p => p.estado !== "ok"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty">Cargando...</div>;

  return (
    <>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Resumen del sistema de inventario</div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Productos</div>
          <div className="kpi-val blue">{stats?.total_productos ?? "—"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Stock Bajo</div>
          <div className="kpi-val amber">{stats?.stock_bajo ?? "—"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Agotados</div>
          <div className="kpi-val red">{stats?.agotados ?? "—"}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Valor en Inventario</div>
          <div className="kpi-val green">S/ {stats?.valor_total ?? "0.00"}</div>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>⚠️ Alertas de stock</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("inventario")}>
              Ver inventario →
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Stock actual</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map(p => (
                  <tr key={p.codigo}>
                    <td className="mono">{p.codigo}</td>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td className="mono">{p.stock}</td>
                    <td className="mono">{p.minimo}</td>
                    <td>
                      <span className={`badge ${p.estado}`}>
                        {p.estado === "agotado" ? "❌ Agotado" : "⚠️ Stock bajo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Accesos rápidos</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => onNav("venta")}>
            🧾 Nueva Venta
          </button>
          <button className="btn btn-ghost" onClick={() => onNav("inventario")}>
            📦 Gestionar Inventario
          </button>
          <button className="btn btn-ghost" onClick={() => onNav("facturas")}>
            📁 Ver Facturas
          </button>
        </div>
      </div>
    </>
  );
}
