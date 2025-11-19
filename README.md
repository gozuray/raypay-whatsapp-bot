# WhatsApp Bot with RemoteAuth & MongoDB

A production-ready WhatsApp bot built with Node.js 22, Express, whatsapp-web.js, RemoteAuth, and MongoDB for fully persistent multi-device sessions.

## Features
- RemoteAuth with a MongoDB-backed adapter (no filesystem or MongoStore dependency).
- Automatic reconnection without scanning a QR after the first login.
- Multi-device WhatsApp support with fully async storage.
- REST API to inspect status, fetch QR codes, send messages, and view persisted session data.
- Works on servers, VPS instances, or Raspberry Pi.

## Prerequisites
- Node.js 22+
- MongoDB instance (local or cloud)
- OpenSSL/Chrome dependencies for Puppeteer (most Linux distros have these by default)

## Environment Variables
Create a `.env` file based on `.env.example`:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=whatsapp
WA_CLIENT_ID=raypay-whatsapp-bot
PORT=3000
```

- **MONGODB_URI**: Connection string to your MongoDB server.
- **MONGODB_DB**: Database name where the `whatsapp_sessions` collection is stored.
- **WA_CLIENT_ID**: Unique identifier for this bot instance (use a different one per bot).
- **PORT**: API server port.

## Installation
```bash
npm install
```

## Running Locally
```bash
npm start
```
- Open `GET /qr` to retrieve the QR code data URL and scan it with WhatsApp.
- Once authenticated, the session persists in MongoDB and QR will no longer be needed.

## API Endpoints
- `GET /status` – Returns the current WhatsApp connection state.
- `GET /qr` – Returns the QR code as a data URL (only when available).
- `POST /send` – Send a message: `{ "phone": "<number>", "message": "Hello" }`.
- `GET /session` – Debug endpoint to view persisted credentials/state (do not expose publicly in production).

## Deployment Notes
- Keep `.env` outside version control and configure environment variables on your host.
- Use a process manager (PM2, systemd, Docker) to run the service continuously.
- Ensure MongoDB is reachable from your server and secured with authentication/firewall rules.
- For Raspberry Pi or low-memory servers, keep the Puppeteer instance headless and avoid running a desktop environment.

## Project Structure
```
/src
  /auth
    mongoAuth.js   # Custom MongoDB-backed RemoteAuth adapter
  bot.js           # WhatsApp client initialization and helpers
  db.js            # MongoDB connection via Mongoose
  server.js        # Express API wiring everything together
.env.example
package.json
README.md
```

## Troubleshooting
- If you see `auth_failure`, clear the MongoDB document for your `WA_CLIENT_ID` and restart to re-scan the QR.
- Verify that MongoDB is reachable and credentials are correct if the server cannot start.
- For Puppeteer sandbox issues on some Linux hosts, ensure the `--no-sandbox` flag remains enabled.
