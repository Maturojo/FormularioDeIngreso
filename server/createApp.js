import cors from 'cors';
import express from 'express';
import { initDb } from './jsonDb.js';
import { createUniqueCoupon } from './jsonCouponService.js';
import { mapCouponRow } from './jsonFormatters.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  function buildCouponWithLead(db, coupon) {
    const lead = db.data.leads.find((item) => item.id === coupon.leadId);
    return mapCouponRow({
      ...coupon,
      lead
    });
  }

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

    const normalizedEmail = email.trim().toLowerCase();
    const existingLead = db.data.leads.find((lead) => lead.email.toLowerCase() === normalizedEmail);

    if (existingLead) {
      return response.status(400).json({
        error: 'Ese email ya fue registrado y ya tiene un cupón asignado.'
      });
    }

    const lead = {
      id: db.data.meta.nextLeadId++,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      city: city.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    db.data.leads.push(lead);
    await db.write();

    const coupon = await createUniqueCoupon(db, lead.id);

    return response.status(201).json({
      leadId: lead.id,
      coupon
    });
  });

  app.get('/api/coupons/:code', async (request, response) => {
    const db = await initDb();
    const coupon = db.data.coupons.find((item) => item.code === request.params.code);

    if (!coupon) {
      return response.status(404).json({ error: 'Cupón no encontrado.' });
    }

    return response.json({ coupon: buildCouponWithLead(db, coupon) });
  });

  app.post('/api/coupons/:code/redeem', async (request, response) => {
    const db = await initDb();
    const coupon = db.data.coupons.find((item) => item.code === request.params.code);

    if (!coupon) {
      return response.status(404).json({ error: 'Cupón no encontrado.' });
    }

    if (coupon.status === 'redeemed') {
      return response.status(409).json({ error: 'Este cupón ya fue utilizado y está bloqueado.' });
    }

    coupon.status = 'redeemed';
    coupon.redeemedAt = new Date().toISOString();
    coupon.redeemedBy = request.body?.redeemedBy || 'Operador';
    await db.write();

    return response.json({ coupon: buildCouponWithLead(db, coupon) });
  });

  app.get('/api/dashboard', async (_request, response) => {
    const db = await initDb();
    const totalLeads = db.data.leads.length;
    const activeCoupons = db.data.coupons.filter((coupon) => coupon.status === 'active').length;
    const redeemedCoupons = db.data.coupons.filter((coupon) => coupon.status === 'redeemed').length;
    const recentCoupons = [...db.data.coupons]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((coupon) => buildCouponWithLead(db, coupon));

    return response.json({
      stats: {
        totalLeads,
        activeCoupons,
        redeemedCoupons
      },
      recentCoupons
    });
  });

  return app;
}
