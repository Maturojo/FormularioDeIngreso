import crypto from 'node:crypto';

const DISCOUNT_LABEL = '10% OFF';

function buildCouponCode() {
  return `SURM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createUniqueCoupon(db, leadId) {
  let attempts = 0;

  while (attempts < 10) {
    const code = buildCouponCode();

    try {
      const coupon = {
        leadId,
        code,
        status: 'active',
        discountLabel: DISCOUNT_LABEL,
        redeemedAt: null,
        redeemedBy: null,
        createdAt: new Date()
      };

      const result = await db.collection('coupons').insertOne(coupon);

      return {
        id: result.insertedId.toString(),
        code: coupon.code,
        status: coupon.status,
        discountLabel: coupon.discountLabel,
        redeemedAt: coupon.redeemedAt,
        redeemedBy: coupon.redeemedBy,
        createdAt: coupon.createdAt.toISOString()
      };
    } catch (error) {
      if (error?.code === 11000) {
        attempts += 1;
        continue;
      }

      throw error;
    }
  }

  throw new Error('No se pudo generar un cupon unico');
}
