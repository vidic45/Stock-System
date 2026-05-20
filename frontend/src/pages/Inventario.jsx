import { useState, useEffect } from "react";
import { useToast } from "../components/useToast.jsx";

const API = "https://stock-system-backend-3nom.onrender.com";

const VACIO = { codigo: "", nombre: "", precio: "", stock: "", minimo: "" };

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "agregar" | producto (editar)
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const { show, Toast } = useToast();

  const cargar = () =>
    fetch(`${API}/productos`)
      .then((r) => r.json())
      .then((d) => {
        setProductos(d);
        setLoading(false);
      });

  useEffect(() => {
    cargar();
  }, []);

  const abrirAgregar = () => {
    setForm(VACIO);
    setModal("agregar");
  };
  const abrirEditar = (p) => {
    setForm({ ...p });
    setModal(p);
  };
  const cerrar = () => setModal(null);

  const guardar = async () => {
    if (
      !form.codigo ||
      !form.nombre ||
      form.precio === "" ||
      form.stock === "" ||
      form.minimo === ""
    )
      return show("Completa todos los campos.", "error");

    setGuardando(true);
    const esNuevo = modal === "agregar";
    const url = esNuevo
      ? `${API}/productos`
      : `${API}/productos/${modal.codigo}`;
    const method = esNuevo ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: form.codigo,
        nombre: form.nombre,
        precio: +form.precio,
        stock: +form.stock,
        minimo: +form.minimo,
      }),
    });

    setGuardando(false);
    if (res.ok) {
      show(esNuevo ? "Producto agregado ✓" : "Producto actualizado ✓");
      cerrar();
      cargar();
    } else {
      const e = await res.json();
      show(e.error || "Error al guardar.", "error");
    }
  };

  const eliminar = async (codigo) => {
    if (!confirm(`¿Eliminar ${codigo}?`)) return;
    const res = await fetch(`${API}/productos/${codigo}`, { method: "DELETE" });
    if (res.ok) {
      show("Producto eliminado.");
      cargar();
    } else show("Error al eliminar.", "error");
  };

  if (loading) return <div className="empty">Cargando inventario...</div>;

  const bajoStock = productos.filter((p) => p.estado !== "ok");

  return (
    <>
      {Toast}
      <div className="page-title">Inventario</div>
      <div className="page-sub">{productos.length} productos registrados</div>

      {bajoStock.length > 0 && (
        <div className="alert-banner">
          ⚠️ {bajoStock.length} producto(s) con stock bajo o agotado.
        </div>
      )}

      <div className="card">
        <div className="card-pad section-header">
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            Lista de productos
          </span>
          <button className="btn btn-primary" onClick={abrirAgregar}>
            + Agregar producto
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Precio (S/)</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    Sin productos aún.
                  </td>
                </tr>
              )}
              {productos.map((p) => (
                <tr key={p.codigo}>
                  <td className="mono">{p.codigo}</td>
                  <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                  <td className="mono">S/ {p.precio.toFixed(2)}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    {p.stock}
                  </td>
                  <td className="mono">{p.minimo}</td>
                  <td>
                    <span className={`badge ${p.estado}`}>
                      {p.estado === "ok"
                        ? "✅ OK"
                        : p.estado === "bajo"
                          ? "⚠️ Bajo"
                          : "❌ Agotado"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => abrirEditar(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => eliminar(p.codigo)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal agregar / editar */}
      {modal && (
        <div className="modal-overlay" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modal === "agregar"
                ? "Agregar producto"
                : `Editar — ${modal.codigo}`}
            </h3>
            <div className="form-grid">
              <div className="field">
                <label>Código</label>
                <input
                  value={form.codigo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      codigo: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="P006"
                  disabled={modal !== "agregar"}
                />
              </div>
              <div className="field">
                <label>Nombre del producto</label>
                <input
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombre: e.target.value }))
                  }
                  placeholder="Ej: Arroz x 50kg"
                />
              </div>
              <div className="field">
                <label>Precio (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, precio: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="field">
                <label>Stock actual</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="field">
                <label>Stock mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={form.minimo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minimo: e.target.value }))
                  }
                  placeholder="5"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
