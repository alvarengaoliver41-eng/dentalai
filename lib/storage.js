import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// En Vercel /tmp es el único directorio escribible y vive solo mientras la función está caliente.
// En local escribimos directo en /data del repo.
const IS_VERCEL = !!process.env.VERCEL;
const SEED_DIR = join(REPO_ROOT, 'data');
const DATA_DIR = IS_VERCEL ? '/tmp/dentalai' : SEED_DIR;

const APPOINTMENTS_FILE = 'appointments.json';
const CONFIG_FILE = 'clinic-config.json';

function ensureFile(filename) {
  if (IS_VERCEL && !existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const target = join(DATA_DIR, filename);
  if (!existsSync(target)) {
    const seed = join(SEED_DIR, filename);
    if (existsSync(seed)) {
      copyFileSync(seed, target);
    } else if (filename === APPOINTMENTS_FILE) {
      writeFileSync(target, '[]');
    }
  }
  return target;
}

export function readAppointments() {
  const path = ensureFile(APPOINTMENTS_FILE);
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeAppointments(data) {
  const path = ensureFile(APPOINTMENTS_FILE);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export function readConfig() {
  const path = ensureFile(CONFIG_FILE);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeConfig(data) {
  const path = ensureFile(CONFIG_FILE);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export function generateTimeSlots() {
  const slots = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

export function getAvailableSlots(date) {
  const appointments = readAppointments();
  const allSlots = generateTimeSlots();
  const taken = appointments
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
  return allSlots.filter(slot => !taken.includes(slot));
}
