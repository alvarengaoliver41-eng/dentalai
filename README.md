# 🦷 DentalAI — Recepción virtual con Sarah

Aplicación web para "Clínica Dental Sonrisa" con Sarah, una recepcionista virtual con IA (GPT-4o + tool calling).

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
2. **Root Directory**: dejá vacío (raíz del repo). Vercel va a leer `vercel.json` para buildear el frontend y montar las functions de `api/`.
3. **Environment Variables**: agregá `OPENAI_API_KEY` con tu clave de OpenAI. *No la commitees nunca al repo.*
4. **Deploy**.

## Notas sobre persistencia en Vercel

Vercel tiene filesystem read-only excepto `/tmp`, que es ephemeral por instancia. Los turnos y la config editada viven en `/tmp/dentalai/` y se reinician cada cold start (~5 min sin tráfico) o en cada deploy. Suficiente para una demo. Para persistencia real, migrar a Postgres/KV.

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
