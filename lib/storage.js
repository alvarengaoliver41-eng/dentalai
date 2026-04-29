import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, '..', 'data');

function readSeed(filename) {
  return JSON.parse(readFileSync(join(SEED_DIR, filename), 'utf-8'));
}

// In-memory storage (demo only — resets on cold start)
let appointments = [];
let config = null;

export async function readAppointments() {
  return [...appointments];
}

export async function writeAppointments(data) {
  appointments = [...data];
}

export async function readConfig() {
  if (!config) config = readSeed('clinic-config.json');
  return { ...config };
}

export async function writeConfig(data) {
  config = { ...data };
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
  const appts = await readAppointments();
  const allSlots = generateTimeSlots();
  const taken = appts
    .filter(a => a.date === date && a.status !== 'cancelled')
    .map(a => a.time);
  return allSlots.filter(slot => !taken.includes(slot));
}
