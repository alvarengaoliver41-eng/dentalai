# ✨ AgendaAI — Recepción virtual con Sarah

Aplicación web genérica para cualquier tipo de clínica (odontológica, estética, médica, etc.) con Sarah, una recepcionista virtual con IA (GPT-4o + tool calling). Adaptable a cualquier nicho que trabaje con turnos.

## Estructura

```
dentalai/
├── api/              # Vercel serverless functions (Node.js)
│   ├── chat.js
│   ├── config.js
│   ├── availability.js
│   ├── appointments.js
│   └── appointments/[id]/
│       ├── index.js        (DELETE /api/appointments/:id)
│       ├── cancel.js       (PATCH /api/appointments/:id/cancel)
│       └── reschedule.js   (PATCH /api/appointments/:id/reschedule)
├── lib/              # Lógica compartida (storage, tools, chat)
├── data/             # JSON seeds (appointments + clinic-config)
├── frontend/         # React + Vite (UI)
├── package.json      # Deps de las serverless functions (root)
├── vercel.json       # Build config + SPA fallback
└── .env.example
```

## Deploy en Vercel

1. **Importá el repo** en https://vercel.com/new.
2. **Root Directory**: vacío (raíz del repo). Vercel lee `vercel.json` para buildear el frontend y montar las functions de `api/`.
3. **Storage (Upstash Redis)**: en el dashboard del proyecto → **Storage** → **Marketplace Database Providers** → **Upstash for Redis** → crear (free tier alcanza). Conectalo al proyecto y Vercel inyecta automáticamente `KV_REST_API_URL` y `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`).
4. **Environment Variables**: agregá `OPENAI_API_KEY` con tu clave. *No la commitees nunca al repo.*
5. **Deploy**.

## Persistencia

Los turnos y la config se guardan en Upstash Redis (claves `dentalai:appointments` y `dentalai:config`). Persisten entre deploys e instancias. En la primera lectura, la config se inicializa desde `data/clinic-config.json`. Si no hay env vars de Redis, el storage cae a archivos locales (útil para dev).

## Desarrollo local

```bash
npm install -g vercel        # solo la primera vez
cp .env.example .env         # poné tu OPENAI_API_KEY
npm install                  # deps del root (api/)
cd frontend && npm install && cd ..
vercel dev                   # corre frontend + api en http://localhost:3000
```

## Endpoints

- `POST /api/chat` — chat con Sarah (con tool calling)
- `GET/PUT /api/config` — datos de la clínica
- `GET /api/availability?date=YYYY-MM-DD` — slots libres
- `GET/POST/DELETE /api/appointments` — listar / crear / borrar (`?scope=all|history`)
- `DELETE /api/appointments/:id` — eliminar uno
- `PATCH /api/appointments/:id/cancel` — cancelar (soft)
- `PATCH /api/appointments/:id/reschedule` — reprogramar
