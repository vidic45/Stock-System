"""
generar_factura.py
==================
Llamado por el backend Node.js para generar facturas PDF.
Uso: python generar_factura.py '<json_payload>' '<ruta_salida.pdf>'
"""

import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

# ── Configuración de empresa (editar para cada cliente) ──────────────────────
EMPRESA = {
    "nombre":    "Mi Negocio S.A.C.",
    "ruc":       "20123456789",
    "direccion": "Jr. Los Pinos 123, Chiclayo",
    "telefono":  "+51 074 123456",
    "email":     "ventas@minegocio.pe",
}

# ── Colores ──────────────────────────────────────────────────────────────────
VERDE      = colors.HexColor("#1a6b4a")
GRIS_CLARO = colors.HexColor("#f5f5f0")
GRIS_BORDE = colors.HexColor("#d0d0c8")
BLANCO     = colors.white
NEGRO      = colors.HexColor("#0f0f0f")


def generar_factura(numero, cliente, items, inv, ruta_salida):
    doc = SimpleDocTemplate(
        ruta_salida,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    def s(size=9, bold=False, color=NEGRO, align=TA_LEFT):
        return ParagraphStyle(
            f"s{size}{bold}{align}",
            fontSize=size,
            fontName="Helvetica-Bold" if bold else "Helvetica",
            textColor=color,
            alignment=align,
        )

    story = []
    ancho = A4[0] - 4*cm

    # ── Cabecera ──
    t = Table([[
        Paragraph(f"<b>{EMPRESA['nombre']}</b>",
                  s(22, True, VERDE)),
        Paragraph("<b>FACTURA ELECTRÓNICA</b>",
                  s(14, True, VERDE, TA_RIGHT)),
    ]], colWidths=[ancho*.6, ancho*.4])
    t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"BOTTOM")]))
    story.append(t)
    story.append(Spacer(1, .2*cm))

    t2 = Table([[
        Paragraph(
            f"{EMPRESA['ruc']} | {EMPRESA['direccion']}<br/>"
            f"{EMPRESA['telefono']} | {EMPRESA['email']}",
            s(9, color=colors.HexColor("#888"))
        ),
        Paragraph(
            f"<b>N°:</b> {numero}<br/>"
            f"<b>Fecha:</b> {datetime.now().strftime('%d/%m/%Y')}<br/>"
            f"<b>Hora:</b> {datetime.now().strftime('%H:%M')}",
            s(9, align=TA_RIGHT)
        ),
    ]], colWidths=[ancho*.6, ancho*.4])
    story.append(t2)
    story.append(HRFlowable(width="100%", thickness=1.5, color=VERDE,
                             spaceAfter=.4*cm, spaceBefore=.3*cm))

    # ── Cliente ──
    t3 = Table([
        [Paragraph("CLIENTE / RECEPTOR", s(8, True, VERDE))],
        [Paragraph(f"<b>{cliente['nombre']}</b>", s(10, True))],
        [Paragraph(f"RUC / DNI: {cliente.get('ruc','—')}  |  {cliente.get('direccion','—')}", s(9))],
    ], colWidths=[ancho])
    t3.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), GRIS_CLARO),
        ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("BOX",(0,0),(-1,-1),.5,GRIS_BORDE),
    ]))
    story.append(t3)
    story.append(Spacer(1, .5*cm))

    # ── Tabla de productos ──
    cw = [ancho*.40, ancho*.10, ancho*.18, ancho*.15, ancho*.17]
    filas = [[
        Paragraph("DESCRIPCIÓN",    s(9, True, BLANCO)),
        Paragraph("CANT.",          s(9, True, BLANCO, TA_CENTER)),
        Paragraph("P. UNIT. (S/)", s(9, True, BLANCO, TA_RIGHT)),
        Paragraph("IGV (18%)",      s(9, True, BLANCO, TA_RIGHT)),
        Paragraph("TOTAL (S/)",     s(9, True, BLANCO, TA_RIGHT)),
    ]]
    subtotal = 0.0
    for item in items:
        codigo = item["codigo"].upper()
        prod   = inv[codigo]
        pu     = prod["precio"]
        cant   = item["cantidad"]
        total  = pu * cant
        igv_i  = pu * 0.18 / 1.18
        subtotal += total
        filas.append([
            Paragraph(f"<b>{prod['nombre']}</b><br/><font size=8 color='#888'>Cód: {codigo}</font>", s(9)),
            Paragraph(str(cant),          s(9, align=TA_CENTER)),
            Paragraph(f"{pu/1.18:.2f}",   s(9, align=TA_RIGHT)),
            Paragraph(f"{igv_i:.2f}",     s(9, align=TA_RIGHT)),
            Paragraph(f"{total:.2f}",     s(9, align=TA_RIGHT)),
        ])

    t4 = Table(filas, colWidths=cw, repeatRows=1)
    t4.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),VERDE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[BLANCO, GRIS_CLARO]),
        ("GRID",(0,0),(-1,-1),.4,GRIS_BORDE),
        ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    story.append(t4)
    story.append(Spacer(1, .4*cm))

    # ── Totales ──
    igv   = subtotal * 0.18 / 1.18
    base  = subtotal - igv
    t5 = Table([
        ["", Paragraph("Valor venta (sin IGV):", s(9, align=TA_RIGHT)),
              Paragraph(f"S/ {base:.2f}", s(9, align=TA_RIGHT))],
        ["", Paragraph("IGV (18%):",             s(9, align=TA_RIGHT)),
              Paragraph(f"S/ {igv:.2f}",  s(9, align=TA_RIGHT))],
        ["", Paragraph("<b>TOTAL A PAGAR:</b>",  s(11, True, VERDE, TA_RIGHT)),
              Paragraph(f"<b>S/ {subtotal:.2f}</b>", s(11, True, VERDE, TA_RIGHT))],
    ], colWidths=[ancho*.55, ancho*.28, ancho*.17])
    t5.setStyle(TableStyle([
        ("LINEABOVE",(1,2),(-1,2),1.2,VERDE),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("RIGHTPADDING",(0,0),(-1,-1),6),
    ]))
    story.append(t5)
    story.append(Spacer(1, .8*cm))
    story.append(HRFlowable(width="100%", thickness=.5, color=GRIS_BORDE, spaceAfter=.3*cm))
    story.append(Paragraph(
        f"{EMPRESA['nombre']} — {EMPRESA['ruc']} | {EMPRESA['email']} | {EMPRESA['telefono']}<br/>"
        "Documento generado electrónicamente. Válido como comprobante de pago.",
        s(8, color=colors.HexColor("#aaa"), align=TA_CENTER)
    ))

    doc.build(story)


if __name__ == "__main__":
    payload  = json.loads(sys.argv[1])
    ruta_pdf = sys.argv[2]
    generar_factura(
        payload["numero"],
        payload["cliente"],
        payload["items"],
        payload["inv"],
        ruta_pdf,
    )
    print(f"PDF generado: {ruta_pdf}")
