import crypto from 'node:crypto';

const DISCOUNT_LABEL = '10% OFF';

function buildCouponCode() {
  return `SURM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createUniqueCoupon(db, leadId) {
  let attempts = 0;

  while (attempts < 10) {
    const code = buildCouponCode();
    const exists = db.data.coupons.some((coupon) => coupon.code === code);

    if (exists) {
      attempts += 1;
      continue;
    }

    const coupon = {
      id: db.data.meta.nextCouponId++,
      leadId,
      code,
      status: 'active',
      discountLabel: DISCOUNT_LABEL,
      redeemedAt: null,
      redeemedBy: null,
      createdAt: new Date().toISOString()
    };

    db.data.coupons.push(coupon);
    await db.write();

    return coupon;
  }

  throw new Error('No se pudo generar un cupón único');
}
