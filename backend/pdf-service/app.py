from flask import Flask, request, send_file
import subprocess
import json
import tempfile

app = Flask(__name__)

@app.route("/generar", methods=["POST"])
def generar():
    data = request.json

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        ruta_pdf = tmp.name

    subprocess.run([
        "python",
        "generar_factura.py",
        json.dumps(data),
        ruta_pdf
    ])

    return send_file(ruta_pdf, as_attachment=True)

app.run(host="0.0.0.0", port=10000)