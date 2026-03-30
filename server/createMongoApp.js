import cors from 'cors';
import express from 'express';
import { initDb } from './mongoDb.js';
import { createUniqueCoupon } from './mongoCouponService.js';
import { mapCouponRow } from './jsonFormatters.js';

export function createMongoApp() {
  const app = express();
  const asyncHandler = (handler) => (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next);

  app.use(cors());
  app.use(express.json());

  async function buildCouponWithLead(db, coupon) {
    const lead = await db.collection('leads').findOne({ _id: coupon.leadId });

    return mapCouponRow({
      ...coupon,
      id: coupon._id?.toString(),
      lead
    });
  }

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, database: 'mongodb' });
  });

  app.post('/api/leads', asyncHandler(async (request, response) => {
    const db = await initDb();
    const { fullName, email, phone, city = '', notes = '' } = request.body || {};

    if (!fullName || !email || !phone) {
      return response.status(400).json({
        error: 'Nombre, email y telefono son obligatorios.'
      });
    }

    const lead = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      notes: notes.trim(),
      createdAt: new Date()
    };

    try {
      const result = await db.collection('leads').insertOne(lead);
      const coupon = await createUniqueCoupon(db, result.insertedId);

      return response.status(201).json({
        leadId: result.insertedId.toString(),
        coupon
      });
    } catch (error) {
      if (error?.code === 11000) {
        return response.status(400).json({
          error: 'Ese email ya fue registrado y ya tiene un cupon asignado.'
        });
      }

      return response.status(500).json({
        error: 'No se pudieron guardar los datos.'
      });
    }
  }));

  app.get('/api/coupons/:code', asyncHandler(async (request, response) => {
    const db = await initDb();
    const coupon = await db.collection('coupons').findOne({ code: request.params.code });

    if (!coupon) {
      return response.status(404).json({ error: 'Cupon no encontrado.' });
    }

    return response.json({ coupon: await buildCouponWithLead(db, coupon) });
  }));

  app.post('/api/coupons/:code/redeem', asyncHandler(async (request, response) => {
    const db = await initDb();
    const coupon = await db.collection('coupons').findOne({ code: request.params.code });

    if (!coupon) {
      return response.status(404).json({ error: 'Cupon no encontrado.' });
    }

    if (coupon.status === 'redeemed') {
      return response.status(409).json({ error: 'Este cupon ya fue utilizado y esta bloqueado.' });
    }

    await db.collection('coupons').updateOne(
      { _id: coupon._id },
      {
        $set: {
          status: 'redeemed',
          redeemedAt: new Date(),
          redeemedBy: request.body?.redeemedBy || 'Operador'
        }
      }
    );

    const updatedCoupon = await db.collection('coupons').findOne({ _id: coupon._id });
    return response.json({ coupon: await buildCouponWithLead(db, updatedCoupon) });
  }));

  app.get('/api/dashboard', asyncHandler(async (_request, response) => {
    const db = await initDb();

    const [totalLeads, activeCoupons, redeemedCoupons, recentCouponsRaw] = await Promise.all([
      db.collection('leads').countDocuments(),
      db.collection('coupons').countDocuments({ status: 'active' }),
      db.collection('coupons').countDocuments({ status: 'redeemed' }),
      db.collection('coupons').find({}).sort({ createdAt: -1 }).limit(10).toArray()
    ]);

    const recentCoupons = await Promise.all(recentCouponsRaw.map((coupon) => buildCouponWithLead(db, coupon)));

    return response.json({
      stats: {
        totalLeads,
        activeCoupons,
        redeemedCoupons
      },
      recentCoupons
    });
  }));

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({
      error: 'No se pudo conectar con MongoDB.'
    });
  });

  return app;
}
