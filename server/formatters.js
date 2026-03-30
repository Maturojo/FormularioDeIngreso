function toLocalDate(dateValue) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(dateValue));
}

export function mapCouponRow(row) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    statusLabel: row.status === 'redeemed' ? 'Canjeado / bloqueado' : 'Activo',
    discountLabel: row.discount_label,
    redeemedBy: row.redeemed_by,
    createdAt: row.created_at,
    createdAtLabel: toLocalDate(row.created_at),
    redeemedAt: row.redeemed_at,
    lead: {
      id: row.lead_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      notes: row.notes
    }
  };
}
