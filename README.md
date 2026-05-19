# 📦 Stock System

Sistema de inventario y facturación PDF para pequeñas empresas.  
Desarrollado en Chiclayo, Perú 🇵🇪

---
## Screenshots
![DEMO] (/screenshots/dashboard.png)
![DEMO] (/screenshots/Factura.png)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Generación PDF | Python + ReportLab |
| Base de datos | JSON local (`inventario.json`) |

---

## Funciones

- ✅ Dashboard con KPIs (total productos, stock bajo, agotados, valor en inventario)
- ✅ Alertas automáticas de stock bajo y agotado
- ✅ CRUD completo de productos (agregar, editar, eliminar)
- ✅ Registro de ventas con descuento automático de stock
- ✅ Generación de facturas PDF con IGV 18% (formato peruano)
- ✅ Historial de facturas generadas

---

## Instalación

### Requisitos

- Node.js 18+
- Python 3.8+
- `pip install reportlab`

### Backend

```bash
cd backend
npm install
node server.js
```

Corre en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173`

---

## Estructura

```
stock-system/
├── backend/
│   ├── server.js           # API REST (Express)
│   ├── generar_factura.py  # Generador PDF (ReportLab)
│   ├── inventario.json     # Base de datos (auto-generada)
│   └── facturas/           # PDFs generados
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Inventario.jsx
        │   ├── NuevaVenta.jsx
        │   └── Facturas.jsx
        └── components/
            └── useToast.js
```

---

Made with ♥ in Chiclayo, Perú
