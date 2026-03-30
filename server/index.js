import cors from 'cors';
import express from 'express';
import { initDb } from './db.js';
import { createUniqueCoupon } from './couponService.js';
import { mapCouponRow } from './formatters.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/leads', async (request, response) => {
  const db = await initDb();
  const { fullName, email, phone, city = '', notes = '' } = request.body || {};

  if (!fullName || !email || !phone) {
    return response.status(400).json({
      error: 'Nombre, email y teléfono son obligatorios.'
    });
  }

  try {
    const result = await db.run(
      `
        INSERT INTO leads (full_name, email, phone, city, notes)
        VALUES (?, ?, ?, ?, ?)
      `,
      [fullName, email, phone, city, notes]
    );

    const coupon = await createUniqueCoupon(db, result.lastID);

    return response.status(201).json({
      leadId: result.lastID,
      coupon
    });
  } catch (error) {
    const message = String(error.message).includes('UNIQUE constraint failed: leads.email')
      ? 'Ese email ya fue registrado y ya tiene un cupón asignado.'
      : 'No se pudieron guardar los datos.';

    return response.status(400).json({ error: message });
  }
});

app.get('/api/coupons/:code', async (request, response) => {
  const db = await initDb();
  const coupon = await db.get(
    `
      SELECT
        coupons.*,
        leads.full_name,
        leads.email,
        leads.phone,
        leads.city,
        leads.notes
      FROM coupons
      INNER JOIN leads ON leads.id = coupons.lead_id
      WHERE coupons.code = ?
    `,
    [request.params.code]
  );

  if (!coupon) {
    return response.status(404).json({ error: 'Cupón no encontrado.' });
  }

  return response.json({ coupon: mapCouponRow(coupon) });
});

app.post('/api/coupons/:code/redeem', async (request, response) => {
  const db = await initDb();
  const coupon = await db.get(
    `
      SELECT * FROM coupons WHERE code = ?
    `,
    [request.params.code]
  );

  if (!coupon) {
    return response.status(404).json({ error: 'Cupón no encontrado.' });
  }

  if (coupon.status === 'redeemed') {
    return response.status(409).json({ error: 'Este cupón ya fue utilizado y está bloqueado.' });
  }

  await db.run(
    `
      UPDATE coupons
      SET status = 'redeemed',
          redeemed_at = CURRENT_TIMESTAMP,
          redeemed_by = ?
      WHERE id = ?
    `,
    [request.body?.redeemedBy || 'Operador', coupon.id]
  );

  const updated = await db.get(
    `
      SELECT
        coupons.*,
        leads.full_name,
        leads.email,
        leads.phone,
        leads.city,
        leads.notes
      FROM coupons
      INNER JOIN leads ON leads.id = coupons.lead_id
      WHERE coupons.id = ?
    `,
    [coupon.id]
  );

  return response.json({ coupon: mapCouponRow(updated) });
});

app.get('/api/dashboard', async (_request, response) => {
  const db = await initDb();

  const totalLeadsRow = await db.get(`SELECT COUNT(*) as total FROM leads`);
  const activeCouponsRow = await db.get(`SELECT COUNT(*) as total FROM coupons WHERE status = 'active'`);
  const redeemedCouponsRow = await db.get(`SELECT COUNT(*) as total FROM coupons WHERE status = 'redeemed'`);
  const recentCoupons = await db.all(
    `
      SELECT
        coupons.*,
        leads.full_name,
        leads.email,
        leads.phone,
        leads.city,
        leads.notes
      FROM coupons
      INNER JOIN leads ON leads.id = coupons.lead_id
      ORDER BY coupons.created_at DESC
      LIMIT 10
    `
  );

  return response.json({
    stats: {
      totalLeads: totalLeadsRow.total,
      activeCoupons: activeCouponsRow.total,
      redeemedCoupons: redeemedCouponsRow.total
    },
    recentCoupons: recentCoupons.map(mapCouponRow)
  });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`API lista en http://localhost:${PORT}`);
  });
});
