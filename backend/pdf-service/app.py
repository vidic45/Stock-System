from flask import Flask, request, send_file
import subprocess
import json
import tempfile
import os

app = Flask(__name__)

@app.route("/generar", methods=["POST"])
def generar():
    data = request.json

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        ruta_pdf = tmp.name

    result = subprocess.run([
    "python3",
    "generar_factura.py",
    json.dumps(data),
    ruta_pdf
    ], capture_output=True, text=True)

    if result.returncode != 0:
        return {
            "error": "Error generando PDF",
            "detalle": result.stderr
        }, 500
    
    if not os.path.exists(ruta_pdf):
        return {"error": "PDF no fue generado"}, 500

    return send_file(ruta_pdf, as_attachment=True)

app.run(host="0.0.0.0", port=10000)