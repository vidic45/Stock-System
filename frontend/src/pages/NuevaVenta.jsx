import { useState, useEffect } from "react";
import { useToast } from "../components/useToast.jsx";

const API = "https://pdf-service-k7vt.onrender.com";

export default function NuevaVenta() {
  const [productos, setProductos] = useState([]);
  const [cliente, setCliente] = useState({
    nombre: "",
    ruc: "",
    direccion: "",
  });
  const [items, setItems] = useState([{ codigo: "", cantidad: 1 }]);
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { show, Toast } = useToast();

  useEffect(() => {
    fetch(`${API}/productos`)
      .then((r) => r.json())
      .then(setProductos);
  }, []);

  const addItem = () => setItems((i) => [...i, { codigo: "", cantidad: 1 }]);

  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx));

  const setItem = (idx, field, val) =>
    setItems(items.map((it, j) => (j === idx ? { ...it, [field]: val } : it)));

  const getProducto = (codigo) => productos.find((p) => p.codigo === codigo);

  const subtotal = items.reduce((s, it) => {
    const p = getProducto(it.codigo);
    return s + (p ? p.precio * +it.cantidad : 0);
  }, 0);

  const igv = (subtotal * 0.18) / 1.18;
  const base = subtotal - igv;

  const enviar = async () => {
    if (!cliente.nombre.trim())
      return show("Ingresa el nombre del cliente.", "error");
    const validos = items.filter((i) => i.codigo && +i.cantidad > 0);
    if (!validos.length) return show("Agrega al menos un producto.", "error");

    setEnviando(true);
    const res = await fetch(`${API}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, items: validos }),
    });
    setEnviando(false);

    if (res.ok) {
      const data = await res.json();
      setResultado(data);
      setItems([{ codigo: "", cantidad: 1 }]);
      setCliente({ nombre: "", ruc: "", direccion: "" });
    } else {
      const e = await res.json();
      show(e.error || "Error al registrar la venta.", "error");
    }
  };

  return (
    <>
      {Toast}
      <div className="page-title">Nueva Venta</div>
      <div className="page-sub">Registra una venta y genera la factura PDF</div>

      {resultado && (
        <div className="factura-result" style={{ marginBottom: 20 }}>
          <div>
            <p>✅ Factura {resultado.numero} generada</p>
            <small>Stock descontado automáticamente</small>
          </div>
          <a
            href={`${API}${resultado.pdf}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            📄 Descargar PDF
          </a>
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}
      >
        {/* Izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Datos del cliente */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
              Datos del cliente
            </h3>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Nombre / Razón Social *</label>
                <input
                  value={cliente.nombre}
                  onChange={(e) =>
                    setCliente((c) => ({ ...c, nombre: e.target.value }))
                  }
                  placeholder="Cliente General"
                />
              </div>
              <div className="field">
                <label>RUC / DNI</label>
                <input
                  value={cliente.ruc}
                  onChange={(e) =>
                    setCliente((c) => ({ ...c, ruc: e.target.value }))
                  }
                  placeholder="00000000"
                />
              </div>
              <div className="field">
                <label>Dirección</label>
                <input
                  value={cliente.direccion}
                  onChange={(e) =>
                    setCliente((c) => ({ ...c, direccion: e.target.value }))
                  }
                  placeholder="Jr. Los Pinos 123"
                />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="card card-pad">
            <div className="section-header" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Productos</h3>
              <button className="btn btn-ghost btn-sm" onClick={addItem}>
                + Agregar línea
              </button>
            </div>

            <div className="venta-items">
              {items.map((item, idx) => {
                const prod = getProducto(item.codigo);
                return (
                  <div key={idx} className="venta-item">
                    <div className="field">
                      <select
                        value={item.codigo}
                        onChange={(e) => setItem(idx, "codigo", e.target.value)}
                      >
                        <option value="">— Seleccionar producto —</option>
                        {productos
                          .filter((p) => p.stock > 0)
                          .map((p) => (
                            <option key={p.codigo} value={p.codigo}>
                              {p.nombre} (Stock: {p.stock}) — S/{" "}
                              {p.precio.toFixed(2)}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="field">
                      <input
                        type="number"
                        min="1"
                        max={prod?.stock ?? 999}
                        value={item.cantidad}
                        onChange={(e) =>
                          setItem(idx, "cantidad", e.target.value)
                        }
                      />
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Derecha — resumen */}
        <div
          className="card card-pad"
          style={{ height: "fit-content", position: "sticky", top: 24 }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Resumen
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {items
              .filter((i) => i.codigo)
              .map((it, idx) => {
                const p = getProducto(it.codigo);
                if (!p) return null;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>
                      {p.nombre} ×{it.cantidad}
                    </span>
                    <span className="mono">
                      S/ {(p.precio * +it.cantidad).toFixed(2)}
                    </span>
                  </div>
                );
              })}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <span>Valor sin IGV</span>
              <span className="mono">S/ {base.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <span>IGV (18%)</span>
              <span className="mono">S/ {igv.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 800,
                marginTop: 4,
                color: "var(--green)",
              }}
            >
              <span>TOTAL</span>
              <span className="mono">S/ {subtotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
            onClick={enviar}
            disabled={enviando}
          >
            {enviando ? "Generando..." : "🧾 Generar Factura PDF"}
          </button>
        </div>
      </div>
    </>
  );
}
