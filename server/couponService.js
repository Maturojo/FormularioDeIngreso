import crypto from 'node:crypto';

const DISCOUNT_LABEL = '10% OFF';

export function buildCouponCode() {
  return `SURM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createUniqueCoupon(db, leadId) {
  let attempts = 0;

  while (attempts < 10) {
    const code = buildCouponCode();

    try {
      const result = await db.run(
        `
          INSERT INTO coupons (lead_id, code, discount_label)
          VALUES (?, ?, ?)
        `,
        [leadId, code, DISCOUNT_LABEL]
      );

      return {
        id: result.lastID,
        code,
        discountLabel: DISCOUNT_LABEL,
        status: 'active'
      };
    } catch (error) {
      if (String(error.message).includes('UNIQUE constraint failed: coupons.code')) {
        attempts += 1;
        continue;
      }

      throw error;
    }
  }

  throw new Error('No se pudo generar un cupón único');
}
