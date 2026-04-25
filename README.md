# 🦷 DentalAI — Sistema de recepción virtual

Aplicación web para Clínica Dental Sonrisa con Sarah, una recepcionista virtual con IA.

## Requisitos

- Node.js 18+
- Una clave de API de OpenAI (GPT-4o)

## Configuración inicial

1. Copiá el archivo de ejemplo y creá tu `.env`:
```
   cp backend/.env.example backend/.env
```
2. Editá `backend/.env` y poné tu clave de OpenAI:
```
   OPENAI_API_KEY=sk-...
```

## Cómo iniciar el sistema

Necesitás dos terminales abiertas:

**Terminal 1 — Backend:**
```
cd backend
npm start
```

**Terminal 2 — Frontend:**
```
cd frontend
npm run dev
```

Luego abrí `http://localhost:5173` en tu navegador.
