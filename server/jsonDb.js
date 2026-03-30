import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { JSONFilePreset } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDbPath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  if (process.env.VERCEL) {
    return '/tmp/formulario-ingreso-data.json';
  }

  return path.join(__dirname, 'storage', 'data.json');
}

export async function getDb() {
  const dbPath = resolveDbPath();
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  return JSONFilePreset(dbPath, {
    meta: {
      nextLeadId: 1,
      nextCouponId: 1
    },
    leads: [],
    coupons: []
  });
}

export async function initDb() {
  return getDb();
}
