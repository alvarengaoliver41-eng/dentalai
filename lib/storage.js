import { Redis } from '@upstash/redis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, '..', 'data');

function resolveRedisCreds() {
  // Caso A: REST URL + TOKEN explícitos (Vercel KV / Upstash directo)
  const explicitUrl =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const explicitToken =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (explicitUrl && explicitToken) {
    return { url: explicitUrl, token: explicitToken };
  }
  // Caso B: REDIS_URL/KV_URL con formato "rediss://default:TOKEN@host:6379"
  // Construimos la URL REST a partir del host y el token a partir del password.
  const combined = process.env.KV_URL || process.env.REDIS_URL;
  if (combined) {
    try {
      const u = new URL(combined);
      if (u.hostname && u.password) {
        return { url: `https://${u.hostname}`, token: decodeURIComponent(u.password) };
      }
    } catch {
      // url inválida, ignorar
    }
  }
  return null;
}

const creds = resolveRedisCreds();
const HAS_REDIS = !!creds;
const IS_VERCEL = !!process.env.VERCEL;

if (IS_VERCEL && !HAS_REDIS) {
  console.error(
    '⚠️  No hay env vars de Redis. Conectá Upstash al proyecto desde Vercel → Storage → Marketplace → Upstash for Redis → Connect Project, y redeployá.'
  );
}

const redis = HAS_REDIS ? new Redis({ url: creds.url, token: creds.token }) : null;

function ensureWritable() {
  if (IS_VERCEL && !HAS_REDIS) {
    throw new Error(
      'Storage no configurado: falta conectar Upstash Redis al proyecto en Vercel (Settings → Storage).'
    );
  }
}

const APPOINTMENTS_KEY = 'dentalai:appointments';
const CONFIG_KEY = 'dentalai:config';

function readSeed(filename) {
  return JSON.parse(readFileSync(join(SEED_DIR, filename), 'utf-8'));
}

function localPath(filename) {
  return join(SEED_DIR, filename);
}

function readLocal(filename, fallback) {
  const path = localPath(filename);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeLocal(filename, data) {
  writeFileSync(localPath(filename), JSON.stringify(data, null, 2));
}

function parseRedisValue(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export async function readAppointments() {
  if (redis) {
    const raw = await redis.get(APPOINTMENTS_KEY);
    const parsed = parseRedisValue(raw);
    if (parsed === null) {
      await redis.set(APPOINTMENTS_KEY, []);
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  }
  return readLocal('appointments.json', []);
}

export async function writeAppointments(data) {
  if (redis) {
    await redis.set(APPOINTMENTS_KEY, data);
    return;
  }
  ensureWritable();
  writeLocal('appointments.json', data);
}

export async function readConfig() {
  if (redis) {
    const raw = await redis.get(CONFIG_KEY);
    const parsed = parseRedisValue(raw);
    if (parsed === null) {
      const seed = readSeed('clinic-config.json');
      await redis.set(CONFIG_KEY, seed);
      return seed;
    }
    return parsed;
  }
  return readLocal('clinic-config.json', readSeed('clinic-config.json'));
}

export async function writeConfig(data) {
  if (redis) {
    await redis.set(CONFIG_KEY, data);
    return;
  }
  ensureWritable();
  writeLocal('clinic-config.json', data);
}

export function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

export async function getAvailableSlots(date) {
  const appointments = await readAppointments();
  const allSlots = generateTimeSlots();
  const taken = appointments
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
  return allSlots.filter(slot => !taken.includes(slot));
}
