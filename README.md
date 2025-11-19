# WhatsApp RemoteAuth Bot (Memory Session)

Bot minimalista basado en [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) v1.23+ que usa **RemoteAuth** con un **MemoryStore interno**, sin MongoDB ni archivos de sesión persistentes. Ideal para correr en local con Node.js 18 o 22.

## Requisitos
- Node.js 18+ (compatible con 22)
- Google Chrome/Chromium dependencias que usa Puppeteer (la mayoría de distros Linux ya las incluyen)

## Configuración
Crea un archivo `.env` en la raíz (se incluye uno de ejemplo):

```
PORT=3000
WA_CLIENT_ID=raypay-local
```

- **PORT**: Puerto del servidor HTTP.
- **WA_CLIENT_ID**: Identificador del cliente para RemoteAuth (usa uno diferente por instancia si corres varias).

## Instalación
```bash
npm install
```

## Uso
```bash
npm start
```

La app levanta el bot automáticamente y expone solo tres rutas:
- `GET /qr` → Devuelve una página HTML con el código QR actual.
- `GET /status` → Responde `{ ready: true/false }` según el estado del cliente.
- `POST /send` → Envía un mensaje JSON: `{ "phone": "<numero>", "message": "Hola" }`.

No hay listeners de mensajes entrantes ni almacenamiento persistente. La sesión vive en memoria mientras el proceso está en ejecución.
