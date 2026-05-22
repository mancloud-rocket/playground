# El playground de Fernando

Host para las presentaciones comerciales de Rocketbot con login previo.

## Contenido

- `/` — Login estilizado
- `/hub` — Hub con links a los decks (requiere sesion)
- `/deck/v3.html` — Sales Deck v3
- `/deck/cinematic.html` — Sales Deck cinematic

## Local

```bash
cd playground
cp .env.example .env
# Edita .env con AUTH_USER, AUTH_PASSWORD y SESSION_SECRET
npm install
npm start
```

Abre `http://localhost:3000`.

## Regenerar decks

Desde la raiz del repo:

```bash
python build_sales_deck_v3.py
```

Esto actualiza `playground/public/deck/v3.html` y `cinematic.html`.

## Deploy en Render

1. Crea un repo git solo con la carpeta `playground/` (o apunta Render al subdirectorio).
2. New Web Service -> conecta el repo.
3. Root directory: `playground` (si el repo es la raiz completa).
4. Build: `npm install`
5. Start: `npm start`
6. Variables de entorno en el dashboard:
   - `AUTH_USER` = `rocketbot_admin`
   - `AUTH_PASSWORD` = tu password larga
   - `SESSION_SECRET` = string aleatorio de 64+ caracteres
   - `NODE_ENV` = `production`

Tambien puedes usar `render.yaml` incluido (Blueprint).

## Deploy en Vercel

```bash
cd playground
npm install
npx vercel
```

Configura las mismas variables de entorno en el dashboard de Vercel:

- `AUTH_USER`
- `AUTH_PASSWORD`
- `SESSION_SECRET`
- `NODE_ENV=production`

## Seguridad

- **No commitees `.env`** — las credenciales van solo en variables de entorno del hosting.
- La sesion usa cookie firmada httpOnly (7 dias).
- Las rutas `/deck/*` y `/hub` estan protegidas server-side.

## Credenciales

Usuario por defecto: `rocketbot_admin`

La contrasena se configura via `AUTH_PASSWORD` en el entorno de despliegue.
