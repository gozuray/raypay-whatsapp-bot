import express from "express";

const app = express();
const PORT = 3000;
const BOT_API_BASE_URL = "http://localhost:3001";

function renderHtml(body) {
  return `
    <html>
      <head><title>QR de WhatsApp</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;gap:20px;font-family:sans-serif;padding:24px;">
        ${body}
      </body>
    </html>
  `;
}

app.get("/qr", async (_req, res) => {
  try {
    const response = await fetch(`${BOT_API_BASE_URL}/qr`);

    if (!response.ok) {
      let message = "QR no disponible (bot no listo o sin generar)";

      try {
        const payload = await response.json();
        message = payload?.error || message;
      } catch (_) {
        // Se mantiene el mensaje por defecto si no es JSON
      }

      res
        .status(response.status)
        .send(renderHtml(`<h2>${message}</h2><p>Estado HTTP: ${response.status}</p>`));
      return;
    }

    const { qrDataUrl } = await response.json();

    if (!qrDataUrl) {
      res
        .status(404)
        .send(
          renderHtml("<h2>QR no disponible (bot ya conectado o aún sin generar)</h2>")
        );
      return;
    }

    res.send(
      renderHtml(`
        <h2>Escanea tu QR de WhatsApp</h2>
        <img src="${qrDataUrl}" alt="QR de WhatsApp" style="width:300px;height:300px" />
        <p>Si el QR expira, actualiza la página.</p>
      `)
    );
  } catch (error) {
    res
      .status(502)
      .send(
        renderHtml(
          `<h2>Error conectando al bot</h2><p>${
            error?.message || "No se pudo obtener el QR"
          }</p>`
        )
      );
  }
});

app.listen(PORT, () => {
  console.log(`QR server running on http://localhost:${PORT}/qr`);
});
