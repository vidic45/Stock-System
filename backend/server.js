import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const DB_PATH = path.join(__dirname, "inventario.json");
const SCRIPT_PATH = path.join(__dirname, "generar_factura.py");
const FACTURAS_DIR = path.join(__dirname, "facturas");

app.use(cors());
app.use(express.json());
app.use("/facturas", express.static(FACTURAS_DIR));

// Asegura que exista la carpeta de facturas
if (!fs.existsSync(FACTURAS_DIR)) fs.mkdirSync(FACTURAS_DIR);

// ── Inventario por defecto ─────────────────────────────────────────────────
const INVENTARIO_INICIAL = {
  P001: { nombre: "Laptop HP 15",       precio: 2800.00, stock: 12, minimo: 5 },
  P002: { nombre: "Mouse inalámbrico",  precio:   45.00, stock: 3,  minimo: 10 },
  P003: { nombre: "Teclado mecánico",   precio:  189.00, stock: 0,  minimo: 5 },
  P004: { nombre: "Monitor 24 pulgadas",precio:  650.00, stock: 8,  minimo: 3 },
  P005: { nombre: "Auriculares USB",    precio:   85.00, stock: 20, minimo: 5 },
};

function leerInventario() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INVENTARIO_INICIAL, null, 2));
    return { ...INVENTARIO_INICIAL };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function guardarInventario(inv) {
  fs.writeFileSync(DB_PATH, JSON.stringify(inv, null, 2));
}

// ── Número de factura correlativo ──────────────────────────────────────────
const COUNTER_PATH = path.join(__dirname, "counter.json");

function getNextFactura() {
  let n = 1;
  if (fs.existsSync(COUNTER_PATH)) {
    n = JSON.parse(fs.readFileSync(COUNTER_PATH)).n;
  }
  fs.writeFileSync(COUNTER_PATH, JSON.stringify({ n: n + 1 }));
  return `F001-${String(n).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────────────────────────────────────────

// GET /productos — lista completa del inventario
app.get("/productos", (req, res) => {
  const inv = leerInventario();
  const lista = Object.entries(inv).map(([codigo, p]) => ({
    codigo,
    ...p,
    estado: p.stock === 0 ? "agotado" : p.stock <= p.minimo ? "bajo" : "ok",
  }));
  res.json(lista);
});

// POST /productos — agregar nuevo producto
app.post("/productos", (req, res) => {
  const { codigo, nombre, precio, stock, minimo } = req.body;
  if (!codigo || !nombre || precio == null || stock == null || minimo == null)
    return res.status(400).json({ error: "Faltan campos requeridos." });

  const inv = leerInventario();
  if (inv[codigo.toUpperCase()])
    return res.status(409).json({ error: "El código ya existe." });

  inv[codigo.toUpperCase()] = { nombre, precio: +precio, stock: +stock, minimo: +minimo };
  guardarInventario(inv);
  res.status(201).json({ ok: true });
});

// PUT /productos/:codigo — editar producto
app.put("/productos/:codigo", (req, res) => {
  const inv = leerInventario();
  const codigo = req.params.codigo.toUpperCase();
  if (!inv[codigo]) return res.status(404).json({ error: "Producto no encontrado." });

  const { nombre, precio, stock, minimo } = req.body;
  inv[codigo] = {
    nombre:  nombre  ?? inv[codigo].nombre,
    precio:  precio  != null ? +precio  : inv[codigo].precio,
    stock:   stock   != null ? +stock   : inv[codigo].stock,
    minimo:  minimo  != null ? +minimo  : inv[codigo].minimo,
  };
  guardarInventario(inv);
  res.json({ ok: true });
});

// DELETE /productos/:codigo — eliminar producto
app.delete("/productos/:codigo", (req, res) => {
  const inv = leerInventario();
  const codigo = req.params.codigo.toUpperCase();
  if (!inv[codigo]) return res.status(404).json({ error: "Producto no encontrado." });
  delete inv[codigo];
  guardarInventario(inv);
  res.json({ ok: true });
});

// GET /stats — dashboard KPIs
app.get("/stats", (req, res) => {
  const inv = leerInventario();
  const productos = Object.values(inv);
  res.json({
    total_productos: productos.length,
    stock_bajo:  productos.filter(p => p.stock > 0 && p.stock <= p.minimo).length,
    agotados:    productos.filter(p => p.stock === 0).length,
    valor_total: productos.reduce((s, p) => s + p.precio * p.stock, 0).toFixed(2),
  });
});

// POST /ventas — registrar venta y generar factura PDF
app.post("/ventas", (req, res) => {
  const { cliente, items } = req.body;
  // items: [{ codigo, cantidad }]
  if (!cliente || !items?.length)
    return res.status(400).json({ error: "Faltan datos de la venta." });

  const inv = leerInventario();

  // Validar stock
  for (const item of items) {
    const prod = inv[item.codigo?.toUpperCase()];
    if (!prod) return res.status(400).json({ error: `Código ${item.codigo} no existe.` });
    if (prod.stock < item.cantidad)
      return res.status(400).json({ error: `Stock insuficiente para ${prod.nombre}.` });
  }

  // Descontar stock
  for (const item of items) {
    inv[item.codigo.toUpperCase()].stock -= item.cantidad;
  }
  guardarInventario(inv);

  const numero = getNextFactura();
  const nombreArchivo = `Factura_${numero.replace("-", "_")}.pdf`;
  const rutaArchivo = path.join(FACTURAS_DIR, nombreArchivo);

  // Llama al script Python para generar el PDF
  const payload = JSON.stringify({ numero, cliente, items, inv });
  execFile("python", [SCRIPT_PATH, payload, rutaArchivo], (err, stdout, stderr) => {
    if (err) {
      console.error("ERROR PYTHON:", err);
      console.error("STDERR:", stderr);

      execFile("python3", [SCRIPT_PATH, payload, rutaArchivo], (err2, stdout2, stderr2) => {
        if (err2) {
          console.error("ERROR PYTHON3:", err2);
          console.error("STDERR2:", stderr2);
          return res.status(500).json({ error: "Error al generar PDF." });
        }
        res.json({ ok: true });
      });
      return;
    }
    res.json({ ok: true });
  });
});

// GET /facturas — lista de facturas generadas
app.get("/facturas-lista", (req, res) => {
  const archivos = fs.existsSync(FACTURAS_DIR)
    ? fs.readdirSync(FACTURAS_DIR).filter(f => f.endsWith(".pdf")).reverse()
    : [];
  res.json(archivos);
});

app.listen(PORT, () => console.log(`✅ Backend corriendo en http://localhost:${PORT}`));
