import { useState, useEffect } from "react";

const API = "https://stock-system-backend-3nom.onrender.com";

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/facturas-lista`)
      .then((r) => r.json())
      .then((d) => {
        setFacturas(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="empty">Cargando facturas...</div>;

  return (
    <>
      <div className="page-title">Facturas generadas</div>
      <div className="page-sub">{facturas.length} factura(s) en el sistema</div>

      <div className="card">
        <div className="table-wrap">
          {facturas.length === 0 ? (
            <div className="empty">
              Aún no hay facturas. Registra una venta primero.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Archivo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, i) => (
                  <tr key={f}>
                    <td className="mono" style={{ color: "var(--muted)" }}>
                      {facturas.length - i}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {f.replace(".pdf", "").replace(/_/g, "-")}
                    </td>
                    <td>
                      <a
                        href={`${API}/facturas/${f}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        📄 Abrir PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
